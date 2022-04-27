import {
  ActionReducerMapBuilder,
  AsyncThunk,
  CaseReducer,
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit'
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers/lib/utils'
import { Pool, queryPool, queryPools } from '../lib/queries'
import { getUnderlyingPrice } from '../lib/getUnderlyingPrice'
import { calcPayoffPerToken } from '../Util/calcPayoffPerToken'
import request from 'graphql-request'
import { RootState } from './Store'
import ERC20_ABI from '@diva/contracts/abis/erc20.json'
import { get0xOpenOrders } from '../DataService/OpenOrders'
import { config, whitelistedPoolCreatorAddress } from '../constants'
import { BigNumber, Contract, providers } from 'ethers'

type RequestState = 'pending' | 'fulfilled' | 'rejected'

type ChainState = {
  statusByName: Record<string, RequestState | undefined>
  pools: Pool[]
  isBuy: boolean
  underlyingPrice: {
    [poolId: string]: string
  }
  orders: {
    [poolId: string]: {
      long: {
        buy: any[]
      }
      short: {
        sell: any[]
        buy: any[]
      }
    }
  }
  tokens: {
    [tokenAddress: string]: {
      decimals: number
      balance: string
      allowance: string
    }
  }
}

type AppStateByChain = {
  chainId?: number
  userAddress?: string
  [chainId: number]: ChainState
}

const buildThunkState = <T extends AsyncThunk<unknown, unknown, unknown>>(
  thunk: T,
  builder: ActionReducerMapBuilder<AppStateByChain>,
  overrides?: {
    fulfilled?: CaseReducer<AppStateByChain, ReturnType<T['fulfilled']>>
    pending?: CaseReducer<AppStateByChain, ReturnType<T['pending']>>
    rejected?: CaseReducer<AppStateByChain, ReturnType<T['rejected']>>
  }
) => {
  const keys = ['fulfilled', 'pending', 'rejected'] as const
  keys.forEach((key) => {
    builder.addCase(thunk[key], (state, action) => {
      const override = overrides?.[key]
      if (override) override(state, action as unknown as any)

      if (key === 'rejected') {
        console.error(action)
      }
      const poolState = state[state.chainId]
      poolState.statusByName[
        action.type.substring(0, action.type.length - (key.length + 1))
      ] = key
    })
  })
}

export const defaultAppState = {
  statusByName: {},
  isBuy: true,
  pools: [],
  underlyingPrice: {},
  orders: {},
  tokens: {},
}

export const initialState: AppStateByChain = {
  1: defaultAppState,
  3: defaultAppState,
  4: defaultAppState,
  42: defaultAppState,
  137: defaultAppState,
  80001: defaultAppState,
}

export const fetchOrders = createAsyncThunk(
  'app/orders',
  async ({ pool, isLong }: { pool: Pool; isLong: boolean }, store) => {
    const tokenAddress = pool[isLong ? 'longToken' : 'shortToken'].id
    const state = store.getState() as RootState

    if (state.appSlice.chainId == null) {
      console.warn('fetchOrders was called even though chainId is undefined')

      return {
        buyOrders: [],
        sellOrders: [],
      }
    }

    const sellOrders: any = await get0xOpenOrders(
      tokenAddress,
      pool.collateralToken.id,
      Number(config[state.appSlice.chainId])
    )
    const buyOrders: any = await get0xOpenOrders(
      pool.collateralToken.id,
      tokenAddress,
      Number(config[state.appSlice.chainId])
    )

    return {
      buyOrders,
      sellOrders,
    }
  }
)

export const createOrder = createAsyncThunk(
  'app/createOrder',
  async ({ pool, isLong }: { pool: Pool; isLong: boolean }) => {
    // request<{ pool: Pool }>(
    //   orderBookEndpoint,
    //   createOrderMutation({
    //     chainId: state.poolSlice?.chainId,
    //   }),
    // ),
    // const sellOrders: any = await get0xOpenOrders(
    //   tokenAddress,
    //   pool.collateralToken.id
    // )
    // const buyOrders: any = await get0xOpenOrders(
    //   pool.collateralToken.id,
    //   tokenAddress
    // )
    // return {
    //   buyOrders,
    //   sellOrders,
    // }
  }
)

export const fetchTokenInfo = createAsyncThunk(
  'app/fetchTokenInfo',
  async (
    {
      token,
      provider,
    }: {
      token: string
      provider: providers.Web3Provider
    },
    store
  ) => {
    const contract = new Contract(token, ERC20_ABI, provider.getSigner())
    const state = store.getState() as RootState
    if (state.appSlice.userAddress == null) {
      console.warn('trying to use fetchTokenInfo when userAddress not defined')
      return {
        token,
        balance: '',
        decimals: 18,
        allowance: '',
      }
    }
    const { userAddress } = state.appSlice

    const [balance, decimals, allowance] = await Promise.all([
      contract.balanceOf(userAddress) as Promise<BigNumber>,
      contract.decimals() as Promise<number>,
      contract.allowance(
        userAddress,
        config[state.appSlice.chainId].divaAddress
      ) as Promise<BigNumber>,
    ])

    return {
      token,
      balance: balance.toString(),
      decimals,
      allowance: allowance.toString(),
    }
  }
)

export const fetchBalance = createAsyncThunk(
  'app/fetchBalance',
  async (
    {
      token,
      provider,
    }: {
      token: string
      provider: providers.Web3Provider
    },
    store
  ) => {
    const contract = new Contract(token, ERC20_ABI, provider.getSigner())
    const state = store.getState() as RootState
    if (state.appSlice.userAddress == null) {
      console.warn('trying to use fetchBalance when userAddress not defined')
      return
    }
    const balance = await contract.balanceOf(state.appSlice.userAddress)
    return balance
  }
)

export const approveOrder = createAsyncThunk(
  'app/approveOrder',
  async ({
    token,
    amount,
    provider,
  }: {
    token: string
    amount: number
    provider: providers.Web3Provider
  }) => {
    const contract = new Contract(token, ERC20_ABI, provider.getSigner())
    const decimals = contract.decimals()
    const allowance = parseUnits(amount.toString(), decimals)
    const tx = await contract.approve(token, allowance)
    await tx.wait()
    return {
      token,
      amount: amount.toString(),
    }
  }
)

export const fetchUnderlyingPrice = createAsyncThunk(
  'app/underlyingPrice',
  async (asset: string) => {
    const res = await getUnderlyingPrice(asset)
    return res
  }
)

export const fetchPool = createAsyncThunk(
  'app/pool',
  async ({ graphUrl, poolId }: { graphUrl: string; poolId: string }) => {
    const res = await request<{ pool: Pool }>(
      graphUrl,
      queryPool(parseInt(poolId))
    )
    return res.pool
  }
)

export const fetchPools = createAsyncThunk(
  'app/pools',
  async (
    args,
    store
  ): Promise<{
    pools: Pool[]
    chainId?: number
  }> => {
    let res: Pool[] = []
    const state = store.getState() as RootState
    const { chainId } = state.appSlice
    if (chainId == null) {
      console.warn('fetchOrders was called even though chainId is undefined')
      return { pools: [] }
    }

    if (config[chainId] == null) {
      console.error(`constants for chainId: "${chainId}" are not configured`)
      return { pools: [] }
    }

    const graphUrl = config[chainId].divaSubgraph

    let lastId = '0'
    let lastRes: Pool[]
    /**
     * Fetches pools recursively (using the last id to paginate)
     */

    while (lastRes == null || lastRes.length > 0) {
      try {
        const result = await request(graphUrl, queryPools(lastId))

        if (result.pools.length > 0)
          lastId = result.pools[result.pools?.length - 1].id

        lastRes = result.pools
        res = res.concat(lastRes)
      } catch (err) {
        /**
         * Handle error and fail gracefully
         */
        console.error(err)
        return {
          pools: [],
          chainId,
        }
      }
    }

    return {
      pools: res,
      chainId,
    }
  }
)

const addPools = (_state: AppStateByChain, pools: Pool[], chainId?: number) => {
  const newPools = pools.map((p) => p.id)
  const state = _state[chainId]

  if (chainId == null) {
    console.warn('addPools was called even though chainId is undefined')
    /**
     * cancel action if chainId is undefined
     */
    return
  }

  const oldPools = state.pools.filter((p) => !newPools.includes(p.id))
  state.pools = pools.concat(oldPools)
  state.pools.sort((a, b) => {
    if (a.id < b.id) return -1
    if (a.id > b.id) return 1
    return 0
  })
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setIsBuy: (state, action: PayloadAction<boolean>) => {
      state[state.chainId].isBuy = action.payload
    },
    setChainId: (state, action: PayloadAction<number>) => {
      state.chainId = action.payload
    },
    setUserAddress: (state, action: PayloadAction<string>) => {
      state.userAddress = action.payload
    },
    addPools: (state: AppStateByChain, action: PayloadAction<Pool[]>) => {
      addPools(state, action.payload)
    },
  },
  extraReducers: (builder) => {
    buildThunkState(fetchUnderlyingPrice, builder, {
      fulfilled: (state, action) => {
        const appState = state[state.chainId]
        appState.underlyingPrice[action.meta.arg] = action.payload
      },
    })

    buildThunkState(approveOrder, builder, {
      fulfilled: (state, action) => {
        const appState = state[state.chainId]
        appState.tokens[action.payload.token] = {
          ...appState.tokens[action.payload.token],
          allowance: action.payload.amount,
        }
      },
    })

    buildThunkState(fetchBalance, builder, {
      fulfilled: (state, action) => {
        const appState = state[state.chainId]
        appState.tokens[action.payload.token] = {
          ...appState.tokens[action.payload.token],
          balance: action.payload,
        }
      },
    })

    buildThunkState(fetchPool, builder, {
      fulfilled: (state, action) => {
        addPools(state, [action.payload], state.chainId)
      },
    })

    buildThunkState(fetchTokenInfo, builder, {
      fulfilled: (state, action) => {
        const appState = state[state.chainId]
        appState.tokens[action.payload.token] = {
          ...appState.tokens[action.payload.token],
          balance: action.payload.balance,
          allowance: action.payload.allowance,
          decimals: action.payload.decimals,
        }
      },
    })

    buildThunkState(fetchOrders, builder, {
      fulfilled: (state, action) => {
        const poolState = state[state?.chainId]
        const orders = poolState.orders[action.meta.arg.pool.id]
        poolState.orders[action.meta.arg.pool.id] = {
          ...orders,
          [action.meta.arg.isLong ? 'long' : 'short']: action.payload,
        }
      },
    })
  },
})

export const selectAppStateByChain = (state: RootState): ChainState => {
  return state.appSlice[state.appSlice.chainId]
}

export const selectIsBuy = (state: RootState) =>
  selectAppStateByChain(state).isBuy

export const selectPool = (
  state: RootState,
  poolId: string
): Pool | undefined =>
  selectAppStateByChain(state).pools.find((p) => p?.id === poolId)

export const selectPools = (state: RootState) =>
  selectAppStateByChain(state).pools.map((p) => ({
    ...p,
    intrinsicValue: selectIntrinsicValue(state, p.id),
  })) || []

export const selectMyDataFeeds = (state: RootState) =>
  selectPools(state).filter(
    (m) => m.dataProvider === state.appSlice.userAddress
  )

export const selectPrice = (state: RootState, poolId: string) =>
  selectAppStateByChain(state).underlyingPrice[poolId]

export const selectRequestStatus = (status) => (state: RootState) =>
  selectAppStateByChain(state).statusByName[status]

export const selectPayoff = (state: RootState, poolId: string) => {
  const pool = selectPool(state, poolId)
  if (pool == null) return undefined
  const usdPrice = selectPrice(state, poolId)
  if (usdPrice == null) return undefined
  const payoff = calcPayoffPerToken(
    BigNumber.from(pool.floor),
    BigNumber.from(pool.inflection),
    BigNumber.from(pool.cap),
    BigNumber.from(pool.collateralBalanceLongInitial),
    BigNumber.from(pool.collateralBalanceShortInitial),
    pool.statusFinalReferenceValue === 'Open'
      ? parseEther(usdPrice)
      : BigNumber.from(pool.finalReferenceValue),
    BigNumber.from(pool.supplyInitial),
    pool.collateralToken.decimals
  )
  if (payoff == null) return undefined

  return {
    payoff: payoff,
    usdPrice: usdPrice,
  }
}

export const selectIntrinsicValue = (
  state: RootState,
  poolId: string
): any | undefined => {
  const payoff = selectPayoff(state, poolId)
  if (payoff == null) return undefined
  const pool = selectPool(state, poolId)
  if (
    pool.statusFinalReferenceValue === 'Open' &&
    parseFloat(payoff.usdPrice) == 0
  ) {
    return 'n/a'
  } else {
    return payoff.payoff
  }
}

export const selectMaxPayout = (
  state: RootState,
  poolId: string,
  isLong: boolean
) => {
  const pool = selectPool(state, poolId)
  if (pool == null) return undefined
  return formatEther(
    BigNumber.from(
      isLong
        ? pool.collateralBalanceLongInitial
        : pool.collateralBalanceShortInitial
    )
      .add(
        BigNumber.from(
          isLong
            ? pool.collateralBalanceShortInitial
            : pool.collateralBalanceLongInitial
        )
      )
      .mul(parseUnits('1', 18 - pool.collateralToken.decimals))
      .mul(parseEther('1'))
      .div(BigNumber.from(pool.supplyInitial))
  )
}

export const selectOrder = (
  state: RootState,
  poolId: string,
  isLong: boolean
) => selectAppStateByChain(state).orders[poolId]?.[isLong ? 'long' : 'short']

export const selectExpectedRate = (
  state: RootState,
  poolId: string,
  isLong: boolean
) => {
  const orders = selectOrder(state, poolId, isLong)
  // TODO: use orders to get buy and sell
  return {
    buy: 7.8,
    sell: 8.1,
  }
}

export const selectToken = (state: RootState, poolId: string) => {
  const pool = selectPool(state, poolId)
  return pool?.collateralToken
}

export const selectMaxYield = (
  state: RootState,
  poolId: string,
  isLong: boolean
) => {
  const _B = BigNumber
  const token = selectToken(state, poolId)
  const maxPayout = selectMaxPayout(state, poolId, isLong)
  const avgExpectedRate = selectExpectedRate(state, poolId, isLong)
  if (maxPayout == null || avgExpectedRate === undefined) return undefined

  return {
    buy: parseFloat(
      formatEther(
        parseUnits(maxPayout).div(
          parseUnits(String(avgExpectedRate.buy), token.decimals)
        )
      )
    ).toFixed(2),
    sell: parseFloat(
      formatEther(
        parseUnits(maxPayout).div(
          parseUnits(String(avgExpectedRate.sell), token.decimals)
        )
      )
    ).toFixed(2),
  }
}

export const selectBreakEven = (
  state: RootState,
  poolId: string,
  isLong: boolean
) => {
  const pool = selectPool(state, poolId)
  if (pool == null) return undefined
  const usdPrice = selectPrice(state, poolId)
  if (usdPrice == null) return undefined

  const be1 = parseUnits(usdPrice, 2)
    .mul(BigNumber.from(pool.inflection))
    .sub(BigNumber.from(pool.floor))
    .mul(BigNumber.from(isLong ? pool.supplyLong : pool.supplyShort))
    .div(
      BigNumber.from(
        isLong
          ? pool.collateralBalanceLongInitial
          : pool.collateralBalanceShortInitial
      )
    )
    .add(BigNumber.from(pool.floor))

  const be2 = parseUnits(usdPrice, 2)
    .mul(BigNumber.from(pool.supplyLong))
    .sub(
      BigNumber.from(
        isLong
          ? pool.collateralBalanceLongInitial
          : pool.collateralBalanceShortInitial
      )
    )
    .mul(BigNumber.from(pool.cap).sub(BigNumber.from(pool.inflection)))
    .div(
      BigNumber.from(
        isLong
          ? pool.collateralBalanceShortInitial
          : pool.collateralBalanceLongInitial
      )
    )
    .add(BigNumber.from(pool.inflection))

  if (
    BigNumber.from(pool.floor).lte(be1) &&
    be1.lte(BigNumber.from(pool.inflection))
  ) {
    return formatEther(be1)
  } else if (
    BigNumber.from(pool.inflection).lt(be2) &&
    be2.lte(BigNumber.from(pool.cap))
  ) {
    return formatEther(be2)
  } else {
    return 'n/a'
  }
}

export const selectMainPools = (state: RootState) =>
  selectAppStateByChain(state).pools.filter(
    (p) => p?.createdBy === whitelistedPoolCreatorAddress
  )

export const selectOtherPools = (state: RootState) =>
  selectAppStateByChain(state).pools.filter(
    (p) => p?.createdBy !== whitelistedPoolCreatorAddress
  )

export const selectChainId = (state: RootState) => state.appSlice.chainId

export const selectUserAddress = (state: RootState) =>
  state.appSlice.userAddress

export const selectTokenBalance = (token) => (state: RootState) => {
  const tokenInfo = selectAppStateByChain(state).tokens[token]
  return formatUnits(BigNumber.from(tokenInfo.balance), tokenInfo.decimals)
}

export const selectTokenAllowance = (token) => (state: RootState) => {
  const tokenInfo = selectAppStateByChain(state).tokens[token]
  return formatUnits(BigNumber.from(tokenInfo.allowance), tokenInfo.decimals)
}

export const selectTokenInfo = (token) => (state: RootState) =>
  selectAppStateByChain(state).tokens[token]

export const selectUnderlyingPrice =
  (asset: string) =>
  (state: RootState): string | undefined =>
    selectAppStateByChain(state).underlyingPrice[asset]

export const { setIsBuy, setUserAddress, setChainId } = appSlice.actions
