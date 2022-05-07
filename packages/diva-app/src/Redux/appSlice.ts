import {
  ActionReducerMapBuilder,
  AsyncThunk,
  CaseReducer,
  createAsyncThunk,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit'
import { getMessage } from 'eip-712'
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers/lib/utils'
import { BigNumber, Contract, providers, utils } from 'ethers'
import {
  createOrderMutation,
  Order,
  Pool,
  queryOrdersByTokens,
  queryPool,
  queryPools,
} from '../lib/queries'
import { getUnderlyingPrice } from '../lib/getUnderlyingPrice'
import { calcPayoffPerToken } from '../Util/calcPayoffPerToken'
import request from 'graphql-request'
import { RootState } from './Store'
import ERC20_ABI from '@diva/contracts/abis/erc20.json'
import {
  config,
  NULL_ADDRESS,
  orderBookEndpoint,
  whitelistedPoolCreatorAddress,
} from '../constants'
import { zeroXDomain, create0xMessage, zeroXTypes } from '../lib/zeroX'
import IZeroX_ABI from '../abi/IZeroX.json'
import { ActionTypes } from '@mui/base'

/**
 * We track the state of thunks in redux
 */
type RequestState = 'pending' | 'fulfilled' | 'rejected'

type OrderView = {
  isBuy: boolean
  isLimit: boolean
  takerAmount: string
  takerToken: string
  makerAmount: string
  makerToken: string
  price: string
  expiryInSeconds: string
}

type ChainState = {
  requestByName: Record<string, RequestState | undefined>
  pools: Pool[]
  underlyingPrice: {
    [poolId: string]: string
  }
  orders: {
    [makerToken: string]: {
      [takerToken: string]: Order[]
    }
  }
  tokens: {
    [tokenAddress: string]: {
      decimals: number
      balance: string
    }
  }
  allowance: {
    [allowanceAddress: string]: {
      [tokenAddress: string]: string
    }
  }
  orderView: {
    [orderKey: string]: OrderView
  }
}

const defaultOrderViewState = {
  price: '0',
  makerAmount: '0',
  takerAmount: '0',
  expiryInSeconds: '3600', // 1 hour default
  makerToken: '',
  takerToken: '',
  isBuy: true,
  isLimit: true,
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
    builder.addCase(thunk[key], (state, action: any) => {
      const override = overrides?.[key]
      if (override) override(state, action as unknown as any)

      if (key === 'rejected') {
        console.error(action.error)
      }
      const poolState = state[state.chainId]
      poolState.requestByName[
        action.type.substring(0, action.type.length - (key.length + 1))
      ] = key
    })
  })
}

export const defaultAppState: ChainState = {
  requestByName: {},
  pools: [],
  underlyingPrice: {},
  orders: {},
  tokens: {},
  orderView: {},
  allowance: {},
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
  'app/fetchOrders',
  async ({
    makerToken,
    takerToken,
  }: {
    makerToken: string
    takerToken: string
  }) => {
    const query = queryOrdersByTokens({
      makerToken,
      takerToken,
    })

    const {
      ordersByTokens: { items: orders },
    } = await request<{
      ordersByTokens: {
        items: Order[]
      }
    }>(orderBookEndpoint, query, {}, { authorization: 'a' })
    return {
      orders,
      makerToken,
      takerToken,
    }
  }
)

export const fillOrder = createAsyncThunk(
  'app/fillOrder',
  async (
    {
      orderKey,
      provider,
    }: { orderKey: string; provider: providers.Web3Provider },
    thunk
  ) => {
    const state = thunk.getState() as RootState
    const { chainId } = state.appSlice
    const orderView = state.appSlice[chainId].orderView[orderKey]
    if (orderView.isLimit) {
      throw new Error('cannot fill order in limit view')
    }
    const orders =
      state.appSlice[chainId].orders[orderView.takerToken][orderView.makerToken]
    const exchangeProxy = config[chainId].zeroXAddress
    const takerTokenInfo = selectTokenInfo(orderView.takerToken)(state)

    const ordersToFill: (Omit<Order, 'signature' | 'id'> & {
      remainingFillableTakerAmount: string
      expectedRate: string
    })[] = []
    const signatures: Order['signature'][] = []
    const amountsToFill: string[] = []

    const buyerToken = new Contract(
      '0xf9C6740DDFfDd0303ffDc79BAB56cc90fA858E9F',
      ERC20_ABI,
      provider
    )

    const sellerToken = new Contract(
      '0x87f725d834fcd8ae2347af58984309b415ddd1d1',
      ERC20_ABI,
      provider
    )

    const seller = '0x7543C7cfA57BA2a465BAe9084F6776AEdF5684a1'
    const buyer = '0x9d265705a779bbdacb2C149eD12B0944e3A0CC19'

    const sellerAllowance = await sellerToken.allowance(seller, exchangeProxy)

    const buyerAllowance = await buyerToken.allowance(buyer, exchangeProxy)

    console.log({ buyerAllowance, sellerAllowance, orderView })

    let restAmount = parseFloat(orderView.takerAmount)

    orders.forEach(({ signature, id, ...order }) => {
      const orderAmount = parseFloat(
        formatUnits(order.takerAmount, takerTokenInfo?.decimals)
      )
      console.log({ orderAmount, restAmount })

      if (restAmount > 0) {
        ordersToFill.push({
          ...order,
          expectedRate: '2.00',
          remainingFillableTakerAmount: '300000000000000000',
        })
        signatures.push({
          ...signature,
          v: Number(signature.v),
          signatureType: Number(signature.signatureType),
        })
        amountsToFill.push(
          parseUnits(
            Math.min(restAmount, orderAmount).toString(),
            18
          ).toString()
        )
      }
      restAmount = restAmount - orderAmount
    })

    const exchangeContract = new Contract(
      exchangeProxy,
      IZeroX_ABI,
      provider.getSigner()
    )

    console.log(
      JSON.stringify({
        ordersToFill,
        signatures,
        amountsToFill,
      })
    )

    try {
      const tx = await exchangeContract.batchFillLimitOrders(
        ordersToFill,
        signatures,
        amountsToFill,
        true
      )
      await tx.wait()
    } catch (err) {
      console.error(err)
    }
  }
)

export const createOrder = createAsyncThunk(
  'app/createOrder',
  async (orderKey: string, thunk) => {
    const state = thunk.getState() as RootState
    const { chainId, userAddress } = state.appSlice
    const orderView = state.appSlice[chainId].orderView[orderKey]
    const verifyingAddress = config[chainId].zeroXAddress
    const expiry = (
      Math.floor(Date.now() / 1000) + Number(orderView.expiryInSeconds)
    ).toString()

    const makerToken = selectTokenInfo(orderView.makerToken)(state)
    const takerToken = selectTokenInfo(orderView.takerToken)(state)

    try {
      // Generate a random private key
      const privateKey = utils.formatBytes32String(
        Math.random().toString().substring(2)
      )
      const signingKey = new utils.SigningKey(privateKey)
      const order = {
        expiry,
        maker: userAddress,
        makerAmount: parseUnits(
          orderView.isBuy ? orderView.makerAmount : orderView.takerAmount,
          makerToken.decimals
        ).toString(), // amount sold
        makerToken: orderView.makerToken, // token sold
        // 0x pools are deprecated - this is the null value for 0x pools
        pool: '0x0000000000000000000000000000000000000000000000000000000000000000',
        salt: Date.now().toString(),
        sender: NULL_ADDRESS, // If set, only this address can directly call fillLimitOrder()
        taker: NULL_ADDRESS, // If set, only this address can fill this order.
        takerAmount: parseUnits(
          orderView.isBuy ? orderView.takerAmount : orderView.makerAmount,
          takerToken.decimals
        ).toString(),
        takerToken: orderView.takerToken,
        feeRecipient: NULL_ADDRESS,
        takerTokenFeeAmount: BigNumber.from(0).toString(),
      }
      const typedData = {
        types: zeroXTypes,
        primaryType: 'LimitOrder',
        domain: zeroXDomain({ chainId, verifyingContract: verifyingAddress }),
        message: create0xMessage(order),
      }

      const message = getMessage(typedData, true)
      const { r, s, v } = signingKey.signDigest(message)
      const mutation = createOrderMutation({
        ...order,
        chainId,
        verifyingContract: verifyingAddress,
        signature: {
          r,
          s,
          v,
          signatureType: 2,
        },
      })

      console.log(
        JSON.stringify({
          ...order,
          chainId,
          verifyingContract: verifyingAddress,
          signature: {
            r,
            s,
            v,
          },
        })
      )

      await request<{ pool: Pool }>(
        orderBookEndpoint,
        mutation,
        {},
        { authorization: 'a' }
      )
    } catch (err) {
      console.error(err)
    }
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
    if (provider == null || token == null)
      throw new Error('provider or token is not defined')
    const contract = new Contract(token, ERC20_ABI, provider.getSigner())
    const state = store.getState() as RootState
    if (state.appSlice.chainId == null) {
      throw new Error('chainId must be defined')
    }
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

    const [balance, decimals] = await Promise.all([
      contract.balanceOf(userAddress) as Promise<BigNumber>,
      contract.decimals() as Promise<number>,
    ])

    return {
      token,
      balance: balance.toString(),
      decimals,
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

export const fetchAllowance = createAsyncThunk(
  'app/fetchAllowance',
  async (
    {
      allowanceAddress,
      tokenAddress,
      provider,
    }: {
      allowanceAddress: string
      tokenAddress: string
      provider: providers.Web3Provider
    },
    store
  ) => {
    const contract = new Contract(tokenAddress, ERC20_ABI, provider.getSigner())
    const state = store.getState() as RootState
    if (state.appSlice.userAddress == null) {
      console.warn('userAddress not defined')
      return
    }
    const allowance = await contract.allowance(
      state.appSlice.userAddress,
      allowanceAddress
    )
    return {
      allowance: allowance.toString(),
      tokenAddress,
      allowanceAddress,
    }
  }
)

export const approveTransaction = createAsyncThunk(
  'app/approveTransaction',
  async (
    {
      tokenAddress,
      allowanceAddress,
      amount,
      provider,
    }: {
      tokenAddress: string
      allowanceAddress: string
      amount: string
      provider: providers.Web3Provider
    },
    store
  ) => {
    const state = store.getState() as RootState
    const contract = new Contract(tokenAddress, ERC20_ABI, provider.getSigner())
    const decimals = await contract.decimals()
    const allowance = parseUnits(amount, decimals)

    const { chainId } = state.appSlice
    if (chainId == null) {
      throw new Error('chainId must be defined')
    }
    const tx = await contract.approve(allowanceAddress, allowance)
    await tx.wait()
    return {
      tokenAddress,
      allowanceAddress,
      amount: allowance.toString(),
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

const reducePools = (
  _state: AppStateByChain,
  pools: Pool[],
  chainId?: number
) => {
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
    setChainId: (state, action: PayloadAction<number>) => {
      state.chainId = action.payload
    },
    setUserAddress: (state, action: PayloadAction<string>) => {
      state.userAddress = action.payload
    },
    setOrderView: (
      state,
      action: PayloadAction<{ key: string; data: Partial<OrderView> }>
    ) => {
      const { key, data } = action.payload
      const appState = state[state.chainId]
      if (appState.orderView[key] == null) {
        appState.orderView[key] = defaultOrderViewState
      }
      appState.orderView[key] = {
        ...state[state.chainId].orderView[key],
        ...data,
      }
    },
    setMakerAmount: (
      state,
      action: PayloadAction<{ value: string; orderViewKey: string }>
    ) => {
      const { orderViewKey, value } = action.payload
      const appState = state[state.chainId]
      if (appState.orderView[orderViewKey] == null) {
        appState.orderView[orderViewKey] = defaultOrderViewState
      }
      const orderView = appState.orderView[orderViewKey]
      orderView.makerAmount = value
      const result =
        value === '0' || orderView.takerAmount === '0'
          ? 0
          : parseFloat(value) / parseFloat(orderView.takerAmount)
      orderView.price = (isNaN(result) ? '0' : result).toString()
    },
    setTakerAmount: (
      state,
      action: PayloadAction<{ value: string; orderViewKey: string }>
    ) => {
      const { orderViewKey, value } = action.payload
      const appState = state[state.chainId]
      if (appState.orderView[orderViewKey] == null) {
        appState.orderView[orderViewKey] = defaultOrderViewState
      }
      const orderView = appState.orderView[orderViewKey]
      orderView.takerAmount = value
      const result =
        value === '0' || orderView.makerAmount === '0'
          ? 0
          : parseFloat(orderView.makerAmount) / parseFloat(value)
      orderView.price = (isNaN(result) ? '0' : result).toString()
    },
    setOrderPrice: (
      state,
      action: PayloadAction<{ value: string; orderViewKey: string }>
    ) => {
      const { orderViewKey, value } = action.payload
      const appState = state[state.chainId]
      if (appState.orderView[orderViewKey] == null) {
        appState.orderView[orderViewKey] = defaultOrderViewState
      }
      const orderView = appState.orderView[orderViewKey]
      const result = parseFloat(orderView.takerAmount) * parseFloat(value)
      orderView.makerAmount = (isNaN(result) ? '0' : result).toString()
      orderView.price = value
    },
    setIsBuy: (
      state,
      action: PayloadAction<{ value: boolean; orderViewKey: string }>
    ) => {
      const { orderViewKey, value } = action.payload
      const appState = state[state.chainId]
      if (appState.orderView[orderViewKey] == null) {
        appState.orderView[orderViewKey] = defaultOrderViewState
      }
      const orderView = appState.orderView[orderViewKey]
      orderView.isBuy = value
    },
    setIsLimit: (
      state,
      action: PayloadAction<{ value: boolean; orderViewKey: string }>
    ) => {
      const { orderViewKey, value } = action.payload
      const appState = state[state.chainId]
      if (appState.orderView[orderViewKey] == null) {
        appState.orderView[orderViewKey] = defaultOrderViewState
      }
      const orderView = appState.orderView[orderViewKey]
      orderView.isLimit = value
    },
  },
  extraReducers: (builder) => {
    buildThunkState(fetchUnderlyingPrice, builder, {
      fulfilled: (state, action) => {
        const appState = state[state.chainId]
        appState.underlyingPrice[action.meta.arg] = action.payload
      },
    })

    buildThunkState(fetchAllowance, builder, {
      fulfilled: (state, action) => {
        const appState = state[state.chainId]
        appState.allowance[action.payload.allowanceAddress] = {
          ...appState.allowance[action.payload.allowanceAddress],
          [action.payload.tokenAddress]: action.payload.allowance,
        }
      },
    })

    buildThunkState(approveTransaction, builder, {
      fulfilled: (state, action) => {
        const appState = state[state.chainId]

        appState.allowance[action.payload.allowanceAddress] = {
          ...appState.allowance[action.payload.allowanceAddress],
          [action.payload.tokenAddress]: action.payload.amount,
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
        reducePools(state, [action.payload], state.chainId)
      },
    })

    buildThunkState(fetchPools, builder, {
      fulfilled: (state, action) => {
        reducePools(state, action.payload.pools, state.chainId)
      },
    })

    buildThunkState(fetchTokenInfo, builder, {
      fulfilled: (state, action) => {
        const appState = state[state.chainId]
        appState.tokens[action.payload.token] = {
          ...appState.tokens[action.payload.token],
          balance: action.payload.balance,
          decimals: action.payload.decimals,
        }
      },
    })

    buildThunkState(fetchOrders, builder, {
      fulfilled: (state, action) => {
        const appState = state[state.chainId]
        if (appState.orders[action.payload.makerToken] == null) {
          appState.orders[action.payload.makerToken] = {}
        }

        const orders =
          appState.orders[action.payload.makerToken]?.[
            action.payload.takerToken
          ] || []
        const newOrders = action.payload.orders || []
        const newOrderIds = newOrders.map((order) => order.id)

        appState.orders[action.payload.makerToken][action.payload.takerToken] =
          [
            ...(orders.filter((order) => !newOrderIds.includes(order.id)) ||
              []),
            ...newOrders,
          ]
      },
    })
  },
})

export const selectAppStateByChain = (state: RootState): ChainState => {
  return state.appSlice[state.appSlice.chainId]
}

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

export const selectRequestStatus = (name: string) => (state: RootState) =>
  selectAppStateByChain(state).requestByName[name]

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

export const selectOrderView =
  (key: string) =>
  (state: RootState): OrderView =>
    selectAppStateByChain(state).orderView[key] || defaultOrderViewState

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

export const selectCollateralToken = (state: RootState, poolId: string) => {
  const pool = selectPool(state, poolId)
  return pool?.collateralToken
}

export const selectMaxYield = (
  state: RootState,
  poolId: string,
  isLong: boolean
) => {
  const _B = BigNumber
  const token = selectCollateralToken(state, poolId)
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
  if (tokenInfo == null) return null
  return formatUnits(BigNumber.from(tokenInfo.balance), tokenInfo.decimals)
}

export const selectAllowanceState =
  (allowanceAddress: string, tokenAddress: string) =>
  (state: RootState): string => {
    return selectAppStateByChain(state)?.allowance[allowanceAddress]?.[
      tokenAddress
    ]
  }

export const selectAllowance =
  (tokenAddress: string, allowanceAddress: string) => (state: RootState) => {
    const allowance = selectAllowanceState(
      allowanceAddress,
      tokenAddress
    )(state)
    if (allowance != null) {
      const tokenInfo = selectTokenInfo(tokenAddress)(state)
      return tokenInfo != null
        ? formatUnits(BigNumber.from(allowance), tokenInfo.decimals)
        : undefined
    }
    return undefined
  }

export const selectTokenInfo = (token) => (state: RootState) =>
  selectAppStateByChain(state).tokens[token] || undefined

export const selectUnderlyingPrice =
  (asset: string) =>
  (state: RootState): string | undefined =>
    selectAppStateByChain(state).underlyingPrice[asset]

export const selectOrdersByTokens =
  (makerToken: string, takerToken: string) => (state: RootState) =>
    selectAppStateByChain(state).orders[makerToken]?.[takerToken] || []

export const {
  setUserAddress,
  setChainId,
  setOrderView,
  setMakerAmount,
  setOrderPrice,
  setTakerAmount,
  setIsBuy,
  setIsLimit,
} = appSlice.actions
