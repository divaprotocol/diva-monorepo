import { configureStore } from '@reduxjs/toolkit'
import tradeReducer from './TradeOption'
import activeTabReducer from './ActiveTab'
import statsReducer from './Stats'
import { appSlice, defaultAppState, initialState } from './appSlice'
import { debounce } from '../lib/debounce'
const preloadedState = JSON.parse(localStorage.getItem('diva-app-state-local'))

const validState = (state) => {
  if (
    preloadedState != null &&
    /**
     * validates that all properties from defaultAppState and
     * initialState are there as a way to validate the schema
     * of the cached app state
     */
    !Object.keys(initialState).every(
      (key) =>
        preloadedState[key] != null &&
        Object.keys(defaultAppState).every(
          (_key) => preloadedState[key][_key] != null
        )
    )
  ) {
    console.error('previous app state is invalid, resetting it')
    return undefined
  }
  return state
}

const store = configureStore({
  preloadedState: validState(
    JSON.parse(localStorage.getItem('diva-app-state-local'))
  ),
  reducer: {
    tradeOption: tradeReducer,
    activeTab: activeTabReducer,
    stats: statsReducer,
    appSlice: appSlice.reducer,
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
