import { configureStore } from '@reduxjs/toolkit'
import tradeReducer from './TradeOption'
import activeTabReducer from './ActiveTab'

const store = configureStore({
  reducer: {
    tradeOption: tradeReducer,
    activeTab: activeTabReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export default store
