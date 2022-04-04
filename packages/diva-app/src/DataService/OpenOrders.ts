import axios from 'axios'
//const ordersUrl = 'https://ropsten.api.0x.org/orderbook/v1/orders?makerToken='
const ordersUrl = 'https://polygon.api.0x.org/orderbook/v1/orders?makerToken='
const getOrderHashUrl = 'https://polygon.api.0x.org/orderbook/v1/order/'
export const get0xOpenOrders = (
  CollateralToken: string,
  TokenAddress: string
) => {
  const res = axios
    .get(ordersUrl + CollateralToken + '&takerToken=' + TokenAddress)
    .then(function (response) {
      return response.data.records
    })
    .catch(() => {
      return {}
    })

  return res
}

export const getOrderDetails = (orderHash: string) => {
  const res = axios
    .get(getOrderHashUrl + orderHash)
    .then(function (response) {
      return response.data
    })
    .catch(() => {
      return {}
    })
  return res
}
