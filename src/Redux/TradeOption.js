import { createSlice } from '@reduxjs/toolkit'

export const tradeOptionSlice = createSlice({
  name: 'option',
  initialState: {
    option: {},
  },
  
  reducers: {
    setTradingOption: (state, action) => {
        state.option = action.payload
      },
  },
})

// Action creators are generated for each case reducer function
export const { setTradingOption } = tradeOptionSlice.actions

export default tradeOptionSlice.reducer