import { configureStore } from '@reduxjs/toolkit'
import tradeReducer from './TradeOption'
import activeTabReducer from './ActiveTab'
export default configureStore({
  reducer: {
      tradeOption : tradeReducer,
      activeTab : activeTabReducer
  }
})