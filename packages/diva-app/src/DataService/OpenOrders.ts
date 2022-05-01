import axios from 'axios'
import { config } from '../constants'
export const get0xOpenOrders = (
  CollateralToken: string,
  TokenAddress: string,
  chainId: number
) => {
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
    .catch((err) => {
      console.error(err)
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
    .catch((err) => {
      console.error(err)
      return {}
    })
  return res
}

export const getUserOrders = async (trader: string, chainId) => {
  console.log('trader ' + config[chainId].allOrders + '?trader=' + trader)

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
