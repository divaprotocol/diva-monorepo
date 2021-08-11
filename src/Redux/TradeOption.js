import { createSlice } from '@reduxjs/toolkit'

export const tradeOptionSlice = createSlice({
  name: 'option',
  initialState: {
    allOptions: [],
    option: {},
  },
  
  reducers: {
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
export default tradeOptionSlice.reducer