import { configureStore } from '@reduxjs/toolkit'
import tradeReducer from './TradeOption'
import activeTabReducer from './ActiveTab'
import statsReducer from './Stats'
import { poolSlice } from './poolSlice'
const store = configureStore({
  reducer: {
    tradeOption: tradeReducer,
    activeTab: activeTabReducer,
    stats: statsReducer,
    poolSlice: poolSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
