import { createSlice } from '@reduxjs/toolkit'

export const statsSlice = createSlice({
  name: 'stats',
  initialState: {
    maxYield: 'n/a',
    breakEven: 'n/a',
    intrinsicValue: 'n/a',
    maxPayout: '0',
  },
  reducers: {
    setMaxYield: (state, action) => {
      state.maxYield = action.payload + 'x'
    },
    setBreakEven: (state, action) => {
      state.breakEven = action.payload
    },
    setIntrinsicValue: (state, action) => {
      state.intrinsicValue = action.payload
    },
    setMaxPayout: (state, action) => {
      state.maxPayout = action.payload
    },
  },
})

export const { setMaxYield, setBreakEven, setIntrinsicValue, setMaxPayout } =
  statsSlice.actions
export default statsSlice.reducer
