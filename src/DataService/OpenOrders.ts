import axios from 'axios'
const ordersUrl = 'https://ropsten.api.0x.org/orderbook/v1/orders?makerToken='

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
