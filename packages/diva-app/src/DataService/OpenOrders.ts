import axios from 'axios'
import { config } from '../constants'
export const get0xOpenOrders = (
  CollateralToken: string,
  TokenAddress: string,
  chainId: number
) => {
  const perPage = 1000
  const url =
    config[chainId].allOrders +
    `?page=1&perPage=${perPage}` +
    '?makerToken=' +
    CollateralToken +
    '&takerToken=' +
    TokenAddress
  const res = axios
    .get(url)
    .then(async function (response) {
      let orders: any[] = []
      const total = response.data.total //total number of existing orders for option
      orders = response.data.records
      if (total > perPage) {
        // in case the total orders are over 1000 maximum pages we want to request
        const MAX_PAGES = 2
        const pages =
          total % perPage > 0
            ? Math.floor(total / perPage) + 1
            : Math.floor(total / perPage)
        const resultPages = pages > MAX_PAGES ? MAX_PAGES : pages
        //start for from the second page as the first page results are already stored in orders array
        for (let page = 2; page <= resultPages; page++) {
          const url =
            config[chainId].allOrders +
            `?page=${page}&perPage=${perPage}` +
            '/makerToken=' +
            CollateralToken +
            '&takerToken=' +
            TokenAddress
          const resp = await axios.get(url)
          orders.concat(resp.data.records)
        }
        return orders
      } else {
        return orders
      }
    })
    .catch((err) => {
      console.error(err)
      return []
    })

  return res
}

export const getOrderDetails = (orderHash: string, chainId) => {
  const res = axios
    .get(config[chainId].order + orderHash)
    .then(function (response) {
      return response.data
    })
    .catch((err) => {
      console.error(err)
      return {}
    })
  return res
}

export const getUserOrders = async (trader: string, chainId) => {
  if (trader != 'undefined') {
    const res = axios
      .get(config[chainId].allOrders + '?trader=' + trader)
      .then(function (response) {
        return response.data.records
      })
      .catch((err) => {
        console.error(err)
        return {}
      })
    return res
  }
}
