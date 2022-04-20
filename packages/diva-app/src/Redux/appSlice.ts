import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { BigNumber } from 'ethers'
import { formatEther, parseEther, parseUnits } from 'ethers/lib/utils'
import { Pool, queryPool, queryPools } from '../lib/queries'
import { getUnderlyingPrice } from '../lib/getUnderlyingPrice'
import { calcPayoffPerToken } from '../Util/calcPayoffPerToken'
import request from 'graphql-request'
import { RootState } from './Store'
import { get0xOpenOrders } from '../DataService/OpenOrders'
import { config, whitelistedPoolCreatorAddress } from '../constants'

type AppStateByChain = {
  chainId?: number
  userAddress?: string
  [chainId: number]: {
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
  }
}

export const defaultAppState = {
  isBuy: true,
  pools: [],
  underlyingPrice: {},
  orders: {},
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

export const fetchUnderlyingPrice = createAsyncThunk(
  'app/underlyingPrice',
  async (pool: Pool) => {
    const res = await getUnderlyingPrice(pool.referenceAsset)
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
      const poolState = state[state.chainId || 3]
      poolState.underlyingPrice[action.meta.arg.id] = action.payload
    })

    builder.addCase(fetchPool.fulfilled, (state, action) => {
      addPools(state, [action.payload])
    })

    builder.addCase(fetchPools.fulfilled, (state, action) => {
      addPools(state, action.payload.pools, action.payload.chainId)
    })

    builder.addCase(fetchOrders.fulfilled, (state, action) => {
      const poolState = state[state?.chainId]
      const orders = poolState.orders[action.meta.arg.pool.id]
      poolState.orders[action.meta.arg.pool.id] = {
        ...orders,
        [action.meta.arg.isLong ? 'long' : 'short']: action.payload,
      }
    })
  },
})

export const selectAppStateByChain = (state: RootState) => {
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
  }))

export const selectMyDataFeeds = (state: RootState) =>
  selectPools(state).filter(
    (m) => m.dataProvider === state.appSlice.userAddress
  )

export const selectPrice = (state: RootState, poolId: string) =>
  selectAppStateByChain(state).underlyingPrice[poolId]

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

export const { setIsBuy, setUserAddress, setChainId } = appSlice.actions
