import axios from 'axios'
const ordersUrl = 'http://localhost:3001/orderbook/v1/orders?makerToken='

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
