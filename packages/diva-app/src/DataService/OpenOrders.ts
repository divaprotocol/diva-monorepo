import axios from 'axios'
import { config } from '../constants'
export const get0xOpenOrders = (
  MakerToken: string,
  TakerToken: string,
  chainId: number
) => {
  // Config parameters
  const perPage = 1000
  const MAX_PAGES = 2 // parameter to control the maximum number of pages to query and with that the number 0x API requests; if set to 0/1, only the first page will be queried

  const url =
    config[chainId].allOrders +
    `?page=1&perPage=${perPage}` +
    '?makerToken=' +
    MakerToken +
    '&takerToken=' +
    TakerToken
  const res = axios
    .get(url)
    .then(async function (response) {
      let orders: any[] = []
      const total = response.data.total //total number of existing orders for option
      orders = response.data.records
      if (total > perPage) {
        // in case the total orders are over 1000 maximum pages we want to request
        const pages =
          total % perPage > 0
            ? Math.floor(total / perPage) + 1
            : Math.floor(total / perPage)
        const resultPages = pages > MAX_PAGES ? MAX_PAGES : pages
        //start from the second page as the first page results are already stored in orders array
        if (MAX_PAGES >= 2) {
          for (let page = 2; page <= resultPages; page++) {
            const url =
              config[chainId].allOrders +
              `?page=${page}&perPage=${perPage}` +
              '?makerToken=' +
              MakerToken +
              '&takerToken=' +
              TakerToken
            const resp = await axios.get(url)
            orders.concat(resp.data.records)
          }
        }
      }
      return orders
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
