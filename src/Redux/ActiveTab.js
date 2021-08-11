import { createSlice } from '@reduxjs/toolkit'

export const activeTabSlice = createSlice({
  name: 'activeTab',
  initialState: {
    activeTab: '/market',
  },
  
  reducers: {
    setActiveTab: (state, action) => {
        state.activeTab = action.payload
      },
  },
})

// Action creators are generated for each case reducer function
export const { setActiveTab } = activeTabSlice.actions
export default activeTabSlice.reducer