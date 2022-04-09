import { useWallet } from '@web3-ui/hooks'
import axios from 'axios'
import { config } from '../constants'

//const ordersUrl = 'https://ropsten.api.0x.org/orderbook/v1/orders?makerToken='
//const ordersUrl = 'https://polygon.api.0x.org/orderbook/v1/orders?makerToken='
//const getOrderHashUrl = 'https://polygon.api.0x.org/orderbook/v1/order/'

export const get0xOpenOrders = (
  CollateralToken: string,
  TokenAddress: string,
  chainId: number
) => {
  console.log(
    'chain id ' + chainId + ' all orders ' + config[chainId].allOrders
  )
  const res = axios
    .get(
      config[chainId].allOrders +
        '?makerToken=' +
        CollateralToken +
        '&takerToken=' +
        TokenAddress
    )
    .then(function (response) {
      return response.data.records
    })
    .catch(() => {
      return {}
    })

  return res
}

export const getOrderDetails = (orderHash: string, chainId) => {
  const res = axios
    .get(config[chainId].order + orderHash)
    .then(function (response) {
      return response.data
    })
    .catch(() => {
      return {}
    })
  return res
}
