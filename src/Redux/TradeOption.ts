import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Pool } from '../lib/queries'
import { Option } from './Option'

interface TradeOptionState {
  allOptions: []
  allOptionsLiquidity: []
  option: Pool
  userAccount: string
  responseBuy: []
  responseSell: []
}

const initialState: TradeOptionState = {
  allOptions: [],
  allOptionsLiquidity: [],
  option: Option,
  userAccount: '',
  responseBuy: [],
  responseSell: [],
}

export const tradeOptionSlice = createSlice({
  name: 'option',
  initialState,
  reducers: {
    setResponseBuy: (state, action: PayloadAction<[]>) => {
      state.responseBuy = action.payload
    },

    setResponseSell: (state, action: PayloadAction<[]>) => {
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

    setTradingOption: (state, action: PayloadAction<Pool>) => {
      state.option = action.payload
    },
  },
})

// Action creators are generated for each case reducer function
export const { setTradingOption } = tradeOptionSlice.actions
export const { setAllOptions } = tradeOptionSlice.actions
export const { setMetamaskAccount } = tradeOptionSlice.actions
export const { setResponseBuy } = tradeOptionSlice.actions
export const { setResponseSell } = tradeOptionSlice.actions
export const { setAllOptionsLiquidity } = tradeOptionSlice.actions
export default tradeOptionSlice.reducer
