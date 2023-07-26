import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { OrderbookPriceResponse } from '../Models/orderbook'

interface TradeOptionState {
  allOptions: []
  allOptionsLiquidity: []
  userAccount: string
  responseBuy: OrderbookPriceResponse[]
  responseSell: OrderbookPriceResponse[]
  optionSellOrdersTotal: number
  optionBuyOrdersTotal: number
}

const initialState: TradeOptionState = {
  allOptions: [],
  allOptionsLiquidity: [],
  userAccount: '',
  responseBuy: [],
  responseSell: [],
  optionSellOrdersTotal: 0.0,
  optionBuyOrdersTotal: 0.0,
}

export const tradeOptionSlice = createSlice({
  name: 'option',
  initialState,
  reducers: {
    setResponseBuy: (
      state,
      action: PayloadAction<OrderbookPriceResponse[]>
    ) => {
      state.responseBuy = action.payload
    },

    setResponseSell: (
      state,
      action: PayloadAction<OrderbookPriceResponse[]>
    ) => {
      state.responseSell = action.payload
    },

    setMetamaskAccount: (state, action: PayloadAction<string>) => {
      state.userAccount = action.payload
    },

    setAllOptions: (state, action: PayloadAction<[]>) => {
      state.allOptions = action.payload
    },

    setAllOptionsLiquidity: (state, action: PayloadAction<[]>) => {
      state.allOptionsLiquidity = action.payload
    },

    setOptionSellOrdersTotal: (state, action: PayloadAction<number>) => {
      state.optionSellOrdersTotal = action.payload
    },

    setOptionBuyOrdersTotal: (state, action: PayloadAction<number>) => {
      state.optionBuyOrdersTotal = action.payload
    },
  },
})

// Action creators are generated for each case reducer function
export const { setAllOptions } = tradeOptionSlice.actions
export const { setMetamaskAccount } = tradeOptionSlice.actions
export const { setResponseBuy } = tradeOptionSlice.actions
export const { setResponseSell } = tradeOptionSlice.actions
export const { setAllOptionsLiquidity } = tradeOptionSlice.actions
export const { setOptionSellOrdersTotal } = tradeOptionSlice.actions
export const { setOptionBuyOrdersTotal } = tradeOptionSlice.actions
export default tradeOptionSlice.reducer
