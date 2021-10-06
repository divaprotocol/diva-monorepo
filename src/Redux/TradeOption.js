import { createSlice } from '@reduxjs/toolkit'

export const tradeOptionSlice = createSlice({
  name: 'option',
  initialState: {
    allOptions: [],
    option: {},
    userAccount : '',
    responseBuy : [],
    responseSell : []
  },
  
  reducers: {
    setResponseBuy : (state, action) => {
      state.responseBuy = action.payload
    },

    setResponseSell : (state, action) => {
      state.responseSell = action.payload
    },

    setMetamaskAccount : (state, action) => {
      state.userAccount = action.payload
    },

    setAllOptions : (state, action) => {
      state.allOptions = action.payload
    },

    setTradingOption: (state, action) => {
      state.option = action.payload
    },

  },
})

// Action creators are generated for each case reducer function
export const { setTradingOption } = tradeOptionSlice.actions
export const { setAllOptions } = tradeOptionSlice.actions
export const {setMetamaskAccount } = tradeOptionSlice.actions
export const {setResponseBuy} = tradeOptionSlice.actions
export const {setResponseSell} = tradeOptionSlice.actions
export default tradeOptionSlice.reducer