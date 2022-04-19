import { configureStore } from '@reduxjs/toolkit'
import tradeReducer from './TradeOption'
import activeTabReducer from './ActiveTab'
import statsReducer from './Stats'
import { poolSlice } from './poolSlice'
import { debounce } from '../lib/debounce'
const store = configureStore({
  preloadedState:
    JSON.parse(localStorage.getItem('diva-app-state-local')) || {},
  reducer: {
    tradeOption: tradeReducer,
    activeTab: activeTabReducer,
    stats: statsReducer,
    poolSlice: poolSlice.reducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

store.subscribe(
  debounce(() => {
    const serializedState = JSON.stringify(store.getState())
    localStorage.setItem('diva-app-state-local', serializedState)
  }, 1000)
)

export default store
