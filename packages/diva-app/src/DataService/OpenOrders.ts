import axios from 'axios'
import { config } from '../constants'
import { BigNumber, ethers } from 'ethers'
import BalanceCheckerABI from '../abi/BalanceCheckerABI.json'

/**
 * Filter for orders that can actually be filled, i.e. where makers
 * have sufficient allowances
 * Example of an invalid order:
 * - takerAmount: 100000000000000000 // 0.1 positionTokens
 * - makerAmount: 80000000000000000000 // 80 dUSD
 * - -> price: 800 dUSD / position token
 * - remainingFillableTakerAmount: 1
 * - -> remainigFillableMakerAmount = 800
 * - makerToken allowance: 30 instead of 800
 * - -> remainingFillableTakerAmount has to be reduced to 30 * takerAmount / makerAmount
 * - -> = 0 in this particular example which would result in this order being filtered out from the orders
 */
async function getFillableOrders(
  orders,
  tokenAddress,
  exchangeProxy,
  chainId,
  provider
) {
  // Connect to BalanceChecker contract which implements a function (called allowances)
  // to obtain multiple allowances with one single call
  const contract = new ethers.Contract(
    config[chainId].balanceCheckAddress,
    BalanceCheckerABI,
    provider
  )

  // Get all maker addresses from orders array
  let makers: string[] = orders.map((data) => {
    return data.order.maker
  })

  // Get iteratable set of maker addresses excluding duplicates
  makers = [...new Set(makers)]

  // Cut maker address array into batches of 400 as BalanceChecker's allowances function
  // cannot consume more than 400-500 as gas limits also applies for read-only calls
  const makersChunks = makers.reduce((resultArray, item, index) => {
    const batchIndex = Math.floor(index / 4)
    if (!resultArray[batchIndex]) {
      resultArray[batchIndex] = []
    }
    resultArray[batchIndex].push(item)
    return resultArray
  }, [])
  console.log('makersChunks', makersChunks)

  let response: any = {}
  let makerAllowances: {
    [address: string]: BigNumber
  } = {}

  await Promise.all(
    makersChunks.map(async (makersBatch) => {
      try {
        // Prepare address inputs for allowances function (two arrays, both same length as maker addresses array
        // populated with exchange contract address and position token address, respectively)
        const addresses = Array.from({ length: makersBatch.length }).fill(
          exchangeProxy
        )
        const tokens = Array.from({ length: makersBatch.length }).fill(
          tokenAddress
        )
        // Get allowances
        const res = await contract.allowances(makersBatch, addresses, tokens)
        response = makersBatch.reduce(
          (obj, key, index) => ({ ...obj, [key]: res[index] }),
          {}
        )
        // Add entries to maker => allowance mapping
        makerAllowances = Object.assign(makerAllowances, response)
      } catch (error) {
        console.error(error)
      }
    })
  )
  console.log('maker allowance', makerAllowances)

  // Initialize array that will hold the filtered order objects
  const filteredOrders = []

  orders.forEach((order) => {
    // Convert order object into a Javascript object
    const extendedOrder = JSON.parse(JSON.stringify(order))

    const makerAmount = BigNumber.from(order.order.makerAmount)
    const takerAmount = BigNumber.from(order.order.takerAmount)

    // Calculate remainingFillableMakerAmount based using remainingFillableTakerAmount, makerAmount and takerAmount information received from 0x api
    const remainingFillableMakerAmount = makerAmount
      .mul(BigNumber.from(order.metaData.remainingFillableTakerAmount))
      .div(takerAmount)

    // Get maker allowance and include it as a new field in order metaData
    // Note that remainingMakerAllowance is the full makerAllowance for the first (best) order
    // and then decreases for the following orders as the remainingFillableMakerAmount gets deducted
    const remainingMakerAllowance = makerAllowances[extendedOrder.order.maker]

    // Add remainingMakerAllowance fiedl to the order object
    extendedOrder.metaData.remainingMakerAllowance =
      remainingMakerAllowance.toString()

    if (remainingMakerAllowance.gt(0)) {
      // remainingFillableMakerAmount is the minimum of remainingMakerAllowance and remainingFillableMakerAmount implied by remainingFillableTakerAmount
      // if remainingMakerAllowance < remainingFillableMakerAmount, then remainingFillableTakerAmount needs to be reduced as well
      if (remainingFillableMakerAmount.lte(remainingMakerAllowance)) {
        extendedOrder.metaData.remainingFillableMakerAmount =
          remainingFillableMakerAmount.toString()
      } else {
        extendedOrder.metaData.remainingFillableMakerAmount =
          remainingMakerAllowance.toString()
        // If makerAllowance is lower than remainingFillabelMakerAmount, then remainingFillableTakerAmount needs to be reduced
        // e.g., if remainingTakerFillableAmount = 1 and implied remainingTakerFillableAmount = 500 but remainingMakerAllowance = 100
        // then new remainingTakerFillableAmount = 1 * 100 / 500 = 1/5 = 0 -> gets filtered out from the orderbook automatically
        extendedOrder.metaData.remainingFillableTakerAmount =
          remainingMakerAllowance.mul(takerAmount).div(makerAmount).toString()
      }

      // Add to fillable orders
      filteredOrders.push(extendedOrder)
      // Update the makerAllowances mapping to reflect the remainingAllowance after
      // deducting remainingFillableMakerAmount
      makerAllowances[order.order.maker] = remainingMakerAllowance.sub(
        remainingFillableMakerAmount
      )
      // TODO Consider adding the expected price here
    }
  })

  return filteredOrders
}

export const get0xOpenOrders = async (
  makerToken: string,
  takerToken: string,
  chainId: number,
  provider: any,
  exchangeProxy: string
) => {
  // Config parameters
  const perPage = 1000
  const MAX_PAGES = 2 // parameter to control the maximum number of pages to query and with that the number 0x API requests; if set to 0/1, only the first page will be queried

  // bids:
  // - makerToken = quoteToken
  // - takerToken = baseToken
  // asks:
  // - makerToken = baseToken
  // - takerToken = quoteToken
  const urlPrefix =
    config[chainId].orderbook +
    '?quoteToken=' +
    makerToken +
    '&baseToken=' +
    takerToken
  const url = urlPrefix + `&page=1&perPage=${perPage}`

  const res = await axios
    .get(url)
    .then(async function (response) {
      let orders: any[] = []
      const total = response.data.bids.total //total number of existing orders for option
      orders = response.data.bids.records
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
            const url = urlPrefix + `&page=${page}&perPage=${perPage}`
            const resp = await axios.get(url)
            orders.concat(resp.data.bids.records)
          }
        }
      }
      return orders
    })
    .catch((err) => {
      console.error(err)
      return []
    })

  // Get actually fillable orders. Reasons for this filter is that
  // 0x may return orders that are not mutually fillable. This can happen if a maker
  // revokes/reduces the allowance for the makerToken after the order creation.
  const fillableOrders = await getFillableOrders(
    res,
    makerToken,
    exchangeProxy,
    chainId,
    provider
  )

  return fillableOrders
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
