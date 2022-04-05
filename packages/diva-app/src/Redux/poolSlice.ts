import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { BigNumber } from 'ethers'
import { formatEther, parseEther, parseUnits } from 'ethers/lib/utils'
import {
  Pool,
  queryDatafeed,
  queryMarkets,
  queryPool,
  queryPools,
} from '../lib/queries'
import { getUnderlyingPrice } from '../lib/getUnderlyingPrice'
import { calcPayoffPerToken } from '../Util/calcPayoffPerToken'
import request from 'graphql-request'
import { RootState } from './Store'
import { get0xOpenOrders } from '../DataService/OpenOrders'

type PoolState = {
  pools: Pool[]
  isBuy: boolean
  underlyingPrice: {
    [poolId: string]: string
  }
  orders: {
    [poolId: string]: {
      long: {
        sell: any[]
        buy: any[]
      }
      short: {
        sell: any[]
        buy: any[]
      }
    }
  }
}

const initialState: PoolState = {
  pools: [],
  isBuy: true,
  underlyingPrice: {},
  orders: {},
}

export const fetchOrders = createAsyncThunk(
  'pools/orders',
  async ({ pool, isLong }: { pool: Pool; isLong: boolean }) => {
    const tokenAddress = pool[isLong ? 'longToken' : 'shortToken'].id
    const sellOrders: any = await get0xOpenOrders(
      tokenAddress,
      pool.collateralToken.id
    )
    const buyOrders: any = await get0xOpenOrders(
      pool.collateralToken.id,
      tokenAddress
    )

    return {
      buyOrders,
      sellOrders,
    }
  }
)

export const fetchUnderlyingPrice = createAsyncThunk(
  'pools/underlyingPrice',
  async (pool: Pool) => {
    const res = await getUnderlyingPrice(pool.referenceAsset)
    return res
  }
)

export const fetchPool = createAsyncThunk(
  'pools/pool',
  async ({ graphUrl, poolId }: { graphUrl: string; poolId: string }) => {
    const res = await request<{ pool: Pool }>(
      graphUrl,
      queryPool(parseInt(poolId))
    )
    return res.pool
  }
)

export const fetchPools = createAsyncThunk(
  'pools/pools',
  async ({ graphUrl }: { graphUrl: string }) => {
    let res: Pool[] = []

    let lastId = '0'
    let lastRes: Pool[]
    while (lastRes == null || lastRes.length > 0) {
      const result = await request(graphUrl, queryPools(lastId))

      if (result.pools.length > 0)
        lastId = result.pools[result.pools?.length - 1].id

      lastRes = result.pools
      res = res.concat(lastRes)
    }

    return res
  }
)

export const fetchMarkets = createAsyncThunk(
  'pools/markets',
  async ({ graphUrl }: { graphUrl: string }) => {
    let res: Pool[] = []

    let lastId = '0'
    let lastRes: Pool[]
    while (lastRes == null || lastRes.length > 0) {
      const result = await request(graphUrl, queryMarkets(lastId))

      if (result.pools.length > 0)
        lastId = result.pools[result.pools?.length - 1].id

      lastRes = result.pools
      res = res.concat(lastRes)
    }

    return res
  }
)

const addPools = (state: PoolState, pools: Pool[]) => {
  const newPools = pools.map((p) => p.id)
  const oldPools = state.pools.filter((p) => !newPools.includes(p.id))
  state.pools = pools.concat(oldPools)
}

export const poolSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    setIsBuy: (state, action: PayloadAction<boolean>) => {
      state.isBuy = action.payload
    },
    addPools: (state: PoolState, action: PayloadAction<Pool[]>) => {
      addPools(state, action.payload)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUnderlyingPrice.fulfilled, (state, action) => {
      state.underlyingPrice[action.meta.arg.id] = action.payload
    })

    builder.addCase(fetchPool.fulfilled, (state, action) => {
      addPools(state, [action.payload])
    })

    builder.addCase(fetchPools.fulfilled, (state, action) => {
      addPools(state, action.payload)
    })

    builder.addCase(fetchMarkets.fulfilled, (state, action) => {
      addPools(state, action.payload)
    })

    builder.addCase(fetchOrders.fulfilled, (state, action) => {
      const orders = state.orders[action.meta.arg.pool.id]
      state.orders[action.meta.arg.pool.id] = {
        ...orders,
        [action.meta.arg.isLong ? 'long' : 'short']: action.payload,
      }
    })
  },
})

export const isBuySelector = (state: RootState) => state.poolSlice.isBuy

export const poolSelector = (
  state: RootState,
  poolId: string
): Pool | undefined => {
  return state.poolSlice.pools.find((p) => p?.id === poolId)
}

export const poolsSelector = (state: RootState): Pool[] | undefined =>
  state.poolSlice.pools.map((p) => ({
    ...p,
    intrinsicValue: intrinsicSelector(state, p.id),
  }))

export const priceSelector = (state: RootState, poolId: string) =>
  state.poolSlice.underlyingPrice[poolId]

export const payoffSelector = (state: RootState, poolId: string) => {
  const pool = poolSelector(state, poolId)
  if (pool == null) return undefined
  const usdPrice = priceSelector(state, poolId)
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

export const intrinsicSelector = (
  state: RootState,
  poolId: string
): any | undefined => {
  const payoff = payoffSelector(state, poolId)
  if (payoff == null) return undefined
  const pool = poolSelector(state, poolId)
  if (
    pool.statusFinalReferenceValue === 'Open' &&
    parseFloat(payoff.usdPrice) == 0
  ) {
    return 'n/a'
  } else {
    return payoff.payoff
  }
}

export const maxPayoutSelector = (
  state: RootState,
  poolId: string,
  isLong: boolean
) => {
  const option = poolSelector(state, poolId)
  if (option == null) return undefined
  return formatEther(
    BigNumber.from(
      isLong
        ? option.collateralBalanceLongInitial
        : option.collateralBalanceShortInitial
    )
      .add(
        BigNumber.from(
          isLong
            ? option.collateralBalanceShortInitial
            : option.collateralBalanceLongInitial
        )
      )
      .mul(parseUnits('1', 18 - option.collateralToken.decimals))
      .mul(parseEther('1'))
      .div(BigNumber.from(option.supplyInitial))
  )
}

export const orderSelector = (
  state: RootState,
  poolId: string,
  isLong: boolean
) => {
  return state.poolSlice.orders[poolId]?.[isLong ? 'long' : 'short']
}

export const expectedRateSelector = (
  state: RootState,
  poolId: string,
  isLong: boolean
) => {
  const orders = orderSelector(state, poolId, isLong)
  // TODO: use orders to get buy and sell
  return {
    buy: 7.8,
    sell: 8.1,
  }
}

export const tokenSelector = (state: RootState, poolId: string) => {
  const pool = poolSelector(state, poolId)
  return pool?.collateralToken
}

export const maxYieldSelector = (
  state: RootState,
  poolId: string,
  isLong: boolean
) => {
  const _B = BigNumber
  const token = tokenSelector(state, poolId)
  const maxPayout = maxPayoutSelector(state, poolId, isLong)
  const avgExpectedRate = expectedRateSelector(state, poolId, isLong)
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

export const breakEvenSelector = (
  state: RootState,
  poolId: string,
  isLong: boolean
) => {
  const pool = poolSelector(state, poolId)
  if (pool == null) return undefined
  const usdPrice = priceSelector(state, poolId)
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
export const { setIsBuy } = poolSlice.actions
