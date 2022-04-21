import { configureStore } from '@reduxjs/toolkit'
import tradeReducer from './TradeOption'
import { appSlice, defaultAppState, initialState } from './appSlice'
import { debounce } from '../lib/debounce'
const preloadedState = JSON.parse(localStorage.getItem('diva-app-state-local'))

const validState = (state) => {
  if (
    preloadedState != null &&
    preloadedState.appSlice != null &&
    /**
     * validates that all properties from defaultAppState and
     * initialState are there as a way to validate the schema
     * of the cached app state
     */
    !Object.keys(initialState).every((key) => {
      const res =
        preloadedState.appSlice[key] != null &&
        Object.keys(defaultAppState).every((_key) => {
          const _res = preloadedState.appSlice[key][_key] != null
          return _res
        })
      return res
    })
  ) {
    console.error('previous app state is invalid, resetting it', preloadedState)
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
