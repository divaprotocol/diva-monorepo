import { configureStore, ConfigureStoreOptions } from '@reduxjs/toolkit'
import { appSlice, defaultAppState, initialState } from './appSlice'
import { debounce } from '../lib/debounce'
import { tradeOptionSlice } from './TradeOption'

const validState = (state) => {
  if (
    state != null &&
    state.appSlice != null &&
    /**
     * validates that all properties from defaultAppState and
     * initialState are there as a way to validate the schema
     * of the cached app state
     */
    !Object.keys(initialState).every((key) => {
      const res =
        state.tradeOption != null &&
        state.appSlice[key] != null &&
        Object.keys(defaultAppState).every((_key) => {
          const _res = state.appSlice[key][_key] != null
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

const preloadedState = validState(
  JSON.parse(localStorage.getItem('diva-app-state-local'))
)

const storeConfig: ConfigureStoreOptions = {
  reducer: {
    tradeOption: tradeOptionSlice.reducer,
    appSlice: appSlice.reducer,
  },
}

/**
 * Only add preloadded state to redux configuration if it is valid
 */
if (preloadedState != null) {
  storeConfig.preloadedState = preloadedState
}

const store = configureStore(storeConfig)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

store.subscribe(
  debounce(() => {
    const serializedState = JSON.stringify(store.getState())
    localStorage.setItem('diva-app-state-local', serializedState)
  }, 1000)
)

export default store
