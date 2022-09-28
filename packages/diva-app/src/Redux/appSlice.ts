import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { BigNumber, providers, ethers } from 'ethers'
import { formatEther, parseEther, parseUnits } from 'ethers/lib/utils'
import {
  FeeRecipient,
  Pool,
  PositionToken,
  queryFeeRecipients,
  queryPool,
  queryPools,
  queryUser,
  User,
} from '../lib/queries'
import { getUnderlyingPrice } from '../lib/getUnderlyingPrice'
import { calcPayoffPerToken } from '../Util/calcPayoffPerToken'
import request from 'graphql-request'
import { RootState } from './Store'
import { get0xOpenOrders, getOrderbookPrices } from '../DataService/OpenOrders'
import {
  config,
  divaGovernanceAddress,
  NULL_ADDRESS,
  DEFAULT_TAKER_TOKEN_FEE,
  DEFAULT_THRESHOLD,
} from '../constants'

type RequestState = 'pending' | 'fulfilled' | 'rejected'

type AppState = {
  statusByName: Record<string, RequestState | undefined>
  pools: Pool[]
  feeRecipients: FeeRecipient[]
  positionTokens: PositionToken[]
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
}

type AppStateByChain = {
  chainId?: number
  userAddress?: string
  provider?: providers.Web3Provider
  [chainId: number]: AppState
}

export const defaultAppState = {
  statusByName: {},
  isBuy: true,
  pools: [],
  feeRecipients: [],
  positionTokens: [],
  underlyingPrice: {},
  orders: {},
}

export const initialState: AppStateByChain = {
  1: defaultAppState,
  3: defaultAppState,
  4: defaultAppState,
  5: defaultAppState,
  42: defaultAppState,
  137: defaultAppState,
  80001: defaultAppState,
}

export const fetchOrders = createAsyncThunk(
  'app/orders',
  async ({ pool, isLong }: { pool: Pool; isLong: boolean }, store) => {
    const tokenAddress = pool[isLong ? 'longToken' : 'shortToken'].id
    const state = store.getState() as RootState
    const { provider } = state.appSlice

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
      Number(config[state.appSlice.chainId]),
      provider,
      config[state.appSlice.chainId].exchangeProxy
    )
    const buyOrders: any = await get0xOpenOrders(
      pool.collateralToken.id,
      tokenAddress,
      Number(config[state.appSlice.chainId]),
      provider,
      config[state.appSlice.chainId].exchangeProxy
    )

    return {
      buyOrders,
      sellOrders,
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

export const fetchFeeRecipients = createAsyncThunk(
  'app/feeRecipients',
  async ({ address }: { address: string }, store) => {
    const state = store.getState() as RootState
    const { chainId } = state.appSlice

    const graphUrl = config[chainId].divaSubgraph
    const res = await request<{ feeRecipients: FeeRecipient[] }>(
      graphUrl,
      queryFeeRecipients(address)
    )
    return res.feeRecipients
  }
)

export const fetchPools = createAsyncThunk(
  'app/pools',
  async (
    {
      page,
      createdBy,
      pageSize = 100,
      dataProvider,
    }: {
      page: number
      createdBy?: string
      pageSize?: number
      dataProvider?: string
    },
    store
  ): Promise<{
    pools: Pool[]
    chainId?: number
  }> => {
    const state = store.getState() as RootState
    const { chainId } = state.appSlice
    if (chainId == null) {
      console.warn('fetchOrders was called even though chainId is undefined')
      return { pools: [] }
    }

    if (config[chainId] == null) {
      console.error(`constants for chainId: '${chainId}' are not configured`)
      return { pools: [] }
    }

    const graphUrl = config[chainId].divaSubgraph

    let pools: Pool[]

    try {
      const result = await request(
        graphUrl,
        queryPools(
          (Math.max(page, 0) * pageSize) / 2,
          pageSize,
          createdBy,
          dataProvider
        )
      )

      pools = result.pools
    } catch (err) {
      /**
       * Handle error and fail gracefully
       */
      console.error(err, 'error is fetching pools')
      return {
        pools: [],
        chainId,
      }
    }

    const tokenPair = []
    pools.map((poolPair: Pool) => {
      tokenPair.push({
        baseToken: ethers.utils.getAddress(poolPair.longToken.id),
        quoteToken: ethers.utils.getAddress(poolPair.collateralToken.id),
        id: poolPair.longToken.name,
        decimals: poolPair.collateralToken.decimals,
      })
      tokenPair.push({
        baseToken: ethers.utils.getAddress(poolPair.shortToken.id),
        quoteToken: ethers.utils.getAddress(poolPair.collateralToken.id),
        id: poolPair.shortToken.name,
        decimals: poolPair.collateralToken.decimals,
      })
    })

    const taker = NULL_ADDRESS
    const feeRecipient = divaGovernanceAddress
    const takerTokenFee = DEFAULT_TAKER_TOKEN_FEE
    const threshold = DEFAULT_THRESHOLD

    try {
      const prices = await getOrderbookPrices({
        chainId,
        page,
        perPage: pageSize,
        graphUrl,
        createdBy,
        taker,
        feeRecipient,
        takerTokenFee,
        threshold,
        tokenPair,
      })

      pools = pools.map((pool: Pool) => {
        return (pool = {
          ...pool,
          prices: {
            long: prices.filter((price: any) => price.id === 'L' + pool.id)[0],
            short: prices.filter((price: any) => price.id === 'S' + pool.id)[0],
          },
        })
      })
    } catch (err) {
      console.error(err, 'error is fetching pools bid and asks')

      return {
        pools: pools.map((pool: Pool) => {
          return (pool = {
            ...pool,
            prices: {},
          })
        }),
        chainId,
      }
    }

    return {
      pools,
      chainId,
    }
  }
)

export const fetchPositionTokens = createAsyncThunk(
  'app/positionTokens',
  async (
    {
      page,
      pageSize = 300,
    }: {
      page: number
      pageSize?: number
    },
    store
  ) => {
    const state = store.getState() as RootState
    const { chainId, userAddress } = state.appSlice
    const res = await request<{ user: User }>(
      config[chainId as number].divaSubgraph,
      queryUser(userAddress, pageSize, Math.max(page, 0) * pageSize)
    )

    return res.user.positionTokens.map((token) => token.positionToken)
  }
)

const addPools = (_state: AppStateByChain, pools: Pool[], chainId?: number) => {
  const newPools = pools.map((p) => p.id)
  const state = _state[chainId]

  if (chainId == null) {
    console.warn('fetchOrders was called even though chainId is undefined')
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
    builder.addCase(fetchUnderlyingPrice.fulfilled, (state, action) => {
      const appState = state[state.chainId]
      appState.underlyingPrice[action.meta.arg] = action.payload
    })

    builder.addCase(fetchPool.fulfilled, (state, action) => {
      addPools(state, [action.payload], state.chainId)
    })

    builder.addCase(fetchPools.pending, (state, action) => {
      const poolState = state[state.chainId]
      poolState.pools = []
      poolState.statusByName[
        action.type.substring(0, action.type.length - ('pending'.length + 1))
      ] = 'pending'
    })

    builder.addCase(fetchPools.rejected, (state, action) => {
      const poolState = state[state.chainId]
      poolState.statusByName[
        action.type.substring(0, action.type.length - ('rejected'.length + 1))
      ] = 'rejected'
    })

    builder.addCase(fetchPools.fulfilled, (state, action) => {
      const poolState = state[state.chainId]
      poolState.statusByName[
        action.type.substring(0, action.type.length - ('fulfilled'.length + 1))
      ] = 'fulfilled'
      poolState.pools = action.payload.pools
    })

    builder.addCase(fetchOrders.fulfilled, (state, action) => {
      const poolState = state[state.chainId]
      const orders = poolState.orders[action.meta.arg.pool.id]
      poolState.orders[action.meta.arg.pool.id] = {
        ...orders,
        [action.meta.arg.isLong ? 'long' : 'short']: action.payload,
      }
    })

    builder.addCase(fetchPositionTokens.fulfilled, (state, action) => {
      const poolState = state[state.chainId]
      const tokens = action.payload
      const newPools = tokens
        .map((token) => token.pool)
        .filter((pool) => pool != null)
      poolState.pools = newPools.filter(
        (pool, index, self) => index === self.findIndex((t) => t.id === pool.id)
      )
      poolState.positionTokens = tokens
    })

    builder.addCase(fetchFeeRecipients.fulfilled, (state, action) => {
      const poolState = state[state.chainId]
      poolState.feeRecipients = action.payload
    })
  },
})

export const selectAppStateByChain = (state: RootState) => {
  return state.appSlice[state.appSlice.chainId] as AppState
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

export const selectPositionTokens = (state: RootState) =>
  selectAppStateByChain(state).positionTokens || []

export const selectMyDataFeeds = (state: RootState) =>
  selectPools(state).filter(
    (m) => m.dataProvider === state.appSlice.userAddress
  )

export const selectPrice = (state: RootState, poolId: string) =>
  selectAppStateByChain(state).underlyingPrice[poolId]

export const selectRequestStatus = (status) => (state: RootState) =>
  selectAppStateByChain(state).statusByName[status]

export const selectPayoff = (
  state: RootState,
  poolId: string,
  finalReferenceValue: string
) => {
  const pool = selectPool(state, poolId)
  if (pool == null) return undefined
  const payoff = calcPayoffPerToken(
    BigNumber.from(pool.floor),
    BigNumber.from(pool.inflection),
    BigNumber.from(pool.cap),
    BigNumber.from(pool.collateralBalanceLongInitial),
    BigNumber.from(pool.collateralBalanceShortInitial),
    BigNumber.from(finalReferenceValue),
    BigNumber.from(pool.supplyInitial),
    pool.collateralToken.decimals
  )
  if (payoff == null) return undefined

  return {
    payoff: payoff,
  }
}

export const selectIntrinsicValue = (
  state: RootState,
  poolId: string,
  finalReferenceValue?: string
): any | undefined => {
  if (finalReferenceValue === '-' || finalReferenceValue == null) return '-'
  else {
    const payoff = selectPayoff(state, poolId, finalReferenceValue)
    if (payoff == null) return undefined
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

export const selectExpectedRate = (state: RootState) => {
  return {
    buy: state.tradeOption.responseBuy[0].order.makerAmount,
    sell: state.tradeOption.responseSell[0].order.makerAmount,
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
  const avgExpectedRate = selectExpectedRate(state)
  if (maxPayout == null || avgExpectedRate === undefined) return undefined
  return {
    buy: parseFloat(
      formatEther(
        parseEther(maxPayout).div(
          parseUnits(String(avgExpectedRate.buy), token.decimals)
        )
      )
    ).toFixed(2),
    sell: parseFloat(
      formatEther(
        parseEther(maxPayout).div(
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
  const usdPrice = selectPrice(state, pool.referenceAsset)
  if (usdPrice == null) return undefined
  const be1 = parseEther(usdPrice)
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
  const be2 = parseEther(usdPrice)
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
    (p) => p?.createdBy === divaGovernanceAddress.toLowerCase()
  )

export const selectOtherPools = (state: RootState) =>
  selectAppStateByChain(state).pools.filter(
    (p) => p?.createdBy !== divaGovernanceAddress.toLowerCase()
  )

export const selectChainId = (state: RootState) => state.appSlice.chainId

export const selectUserAddress = (state: RootState) =>
  state.appSlice.userAddress

export const selectUnderlyingPrice =
  (asset: string) =>
  (state: RootState): string | undefined =>
    selectAppStateByChain(state).underlyingPrice[asset]

export const selectFeeRecipients = (state: RootState) =>
  selectAppStateByChain(state).feeRecipients

export const { setIsBuy, setUserAddress, setChainId } = appSlice.actions
