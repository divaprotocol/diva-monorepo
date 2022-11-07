import axios from 'axios'
import {
  config,
  NULL_ADDRESS,
  DIVA_GOVERNANCE_ADDRESS,
  TRADING_FEE,
} from '../constants'
import { BigNumber, ethers } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { getExpiryMinutesFromNow } from '../Util/Dates'
import BalanceCheckerABI from '../abi/BalanceCheckerABI.json'
import ERC20ABI from '../abi/ERC20ABI.json'
import {
  PoolInfoType,
  OrderbookPriceRequest,
  OrderOutputType,
  PriceResponseType,
  PriceOutputType,
} from '../Models/orderbook'
import { Pool } from '../lib/queries'

/**
 * Filter for orders that can actually be filled, i.e. where makers
 * have sufficient allowance AND balance. This filter is required because 0x api
 * returns all maker orders by default. The problem is that if the balance or the allowance drops below the required
 * level to fill all maker orders, those orders are no longer mutually fillable
 * resulting in fill order errors. To prevent this, additional logic has to be implemented where
 * orders are checked for fillability starting with the best price orders. Non-fillable orders are filtered out and not displayed
 * in the orderbook.
 * Example of an invalid order:
 * - takerAmount: 100000000000000000 // 0.1 positionTokens
 * - makerAmount: 80000000000000000000 // 80 dUSD
 * - -> price: 800 dUSD / position token
 * - remainingFillableTakerAmount: 1
 * - -> remainigFillableMakerAmount = 800
 * - makerToken allowance: 30 instead of 800
 * - -> remainingFillableTakerAmount has to be reduced to 30 * takerAmount / makerAmount
 * - -> = 0 in this particular example which would result in this order being filtered out from the orders
 * Similarly, an invalid order may result from insufficient maker token balance
 * The BalanceChecker contract's `getMinOfBalancesOrAllowances` function is used to assess the fillability of orders.
 */
async function getFillableOrders(
  orders,
  tokenAddress,
  exchangeProxy,
  chainId,
  provider,
  makerTokenUnit,
  takerTokenUnit
) {
  // Connect to BalanceChecker contract which implements the `getMinOfBalancesOrAllowances` which allows to
  // obtain the minimum of allowance and balance for an array of maker address with one single call
  const contract = new ethers.Contract(
    config[chainId].balanceCheckerAddress,
    BalanceCheckerABI,
    provider
  )

  // Get all maker addresses from orders array
  let makers: string[] = orders.map((data) => {
    return data.order.maker
  })

  // Get iteratable set of maker addresses excluding duplicates
  makers = [...new Set(makers)]

  // Cut maker address array into batches of 400 as BalanceChecker's `getMinOfBalancesOrAllowances` function
  // cannot consume more than 400-500 as gas limits also applies for read-only calls
  const makersChunks = makers.reduce((resultArray, item, index) => {
    const batchIndex = Math.floor(index / 400)
    if (!resultArray[batchIndex]) {
      resultArray[batchIndex] = []
    }
    resultArray[batchIndex].push(item)
    return resultArray
  }, [])

  let makerMinOfBalancesOrAllowances: {
    [address: string]: BigNumber
  } = {}

  await Promise.all(
    makersChunks.map(async (makersBatch) => {
      try {
        let response: any = {}
        // Prepare tokens argument for getMinOfBalancesOrAllowances function (array with the same length as maker addresses array
        // populated with position token address)
        const tokens = Array.from({ length: makersBatch.length }).fill(
          tokenAddress
        )
        // Get minimum of balances and allowances for given batch of maker addresses
        const res: BigNumber[] = await contract.getMinOfBalancesOrAllowances(
          makersBatch,
          tokens,
          exchangeProxy
        )
        response = makersBatch.reduce(
          (obj, key, index) => ({ ...obj, [key]: res[index] }),
          {}
        )
        // Add entries to makerMinOfBalancesOrAllowances mapping
        makerMinOfBalancesOrAllowances = Object.assign(
          makerMinOfBalancesOrAllowances,
          response
        )
      } catch (error) {
        console.error(error)
      }
    })
  )

  // Initialize array that will hold the filtered order objects
  const fillableOrders = []

  orders.forEach((order) => {
    // Convert order object into a Javascript object
    const extendedOrder = JSON.parse(JSON.stringify(order))

    const makerAmount = BigNumber.from(order.order.makerAmount)
    const takerAmount = BigNumber.from(order.order.takerAmount)

    // Calculate prices
    const ratioMakerAmountToTakerAmount = makerAmount
      .mul(takerTokenUnit)
      .div(takerAmount) // in maker token decimals
    const ratioTakerAmountToMakerAmount = takerAmount
      .mul(makerTokenUnit)
      .div(makerAmount) // in taker token decimals

    // Add to extendedOrder object
    // TODO Consider using those ratios in the trade related code rather than calculating the expected price over and over again
    extendedOrder.order.ratioMakerAmountToTakerAmount =
      ratioMakerAmountToTakerAmount.toString()
    extendedOrder.order.ratioTakerAmountToMakerAmount =
      ratioTakerAmountToMakerAmount.toString()

    // Calculate remainingFillableMakerAmount using remainingFillableTakerAmount, makerAmount and takerAmount information received from 0x api
    // This new variable is compared to the maker's maker token balance and allowance to assess fillability.
    const remainingFillableMakerAmount = makerAmount
      .mul(BigNumber.from(order.metaData.remainingFillableTakerAmount))
      .div(takerAmount)

    // Get minimum of maker's maker token balance and allowance and include it as a new field in order metaData.
    // Note that remainingMakerMinOfBalancesOrAllowances is the minimum of full makerAllowance and balance for the first (best) order
    // and then decreases for the following orders as the remainingFillableMakerAmount gets reduced.
    const remainingMakerMinOfBalancesOrAllowances =
      makerMinOfBalancesOrAllowances[extendedOrder.order.maker]

    // Add remainingMakerMinOfBalancesOrAllowances field to the order object
    extendedOrder.metaData.remainingMakerMinOfBalancesOrAllowances =
      remainingMakerMinOfBalancesOrAllowances.toString()

    if (remainingMakerMinOfBalancesOrAllowances.gt(0)) {
      // remainingFillableMakerAmount is the minimum of remainingMakerMinOfBalancesOrAllowances and remainingFillableMakerAmount implied by remainingFillableTakerAmount.
      // If remainingMakerMinOfBalancesOrAllowances < remainingFillableMakerAmount, then remainingFillableTakerAmount needs to be reduced as well.
      if (
        remainingFillableMakerAmount.lte(
          remainingMakerMinOfBalancesOrAllowances
        )
      ) {
        extendedOrder.metaData.remainingFillableMakerAmount =
          remainingFillableMakerAmount.toString()
      } else {
        extendedOrder.metaData.remainingFillableMakerAmount =
          remainingMakerMinOfBalancesOrAllowances.toString()
        // If makerAllowance is lower than remainingFillabelMakerAmount, then remainingFillableTakerAmount needs to be reduced
        // e.g., if remainingTakerFillableAmount = 1 and implied remainingTakerFillableAmount = 500 but remainingMakerMinOfBalancesOrAllowances = 100
        // then new remainingTakerFillableAmount = 1 * 100 / 500 = 1/5 = 0 -> gets filtered out from the orderbook automatically
        extendedOrder.metaData.remainingFillableTakerAmount =
          remainingMakerMinOfBalancesOrAllowances
            .mul(takerAmount)
            .div(makerAmount)
            .toString()
      }

      // Add to fillable orders
      fillableOrders.push(extendedOrder)

      // Update the makerMinOfBalancesOrAllowances mapping to reflect the remainingMakerMinOfBalancesOrAllowances after
      // reducing remainingFillableMakerAmount
      makerMinOfBalancesOrAllowances[order.order.maker] =
        remainingMakerMinOfBalancesOrAllowances.sub(
          BigNumber.from(extendedOrder.metaData.remainingFillableMakerAmount)
        )
    }
  })

  return fillableOrders
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
    '/pair?quoteToken=' +
    makerToken +
    '&baseToken=' +
    takerToken
  const url = urlPrefix + `&page=1&perPage=${perPage}`

  const res = await axios
    .get(url)
    .then(async function (response) {
      let orders: any[] = []
      // TODO: Capture bids and asks with one single call instead of two separate calls
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

  // // Get taker and maker token decimals to be used in takerTokenFeeAmount calcs
  // const takerTokenContract = new ethers.Contract(takerToken, ERC20ABI, provider)
  // const makerTokenContract = new ethers.Contract(makerToken, ERC20ABI, provider)

  // const takerTokenDecimals = await takerTokenContract.decimals()
  // const makerTokenDecimals = await makerTokenContract.decimals()

  // const takerTokenUnit = parseUnits('1', takerTokenDecimals)
  // const makerTokenUnit = parseUnits('1', makerTokenDecimals)

  // // Get actually fillable orders by checking the maker allowance. Reasons for this filter is that
  // // 0x may return orders that are not mutually fillable. This can happen if a maker
  // // revokes/reduces the allowance for the makerToken after the order creation.
  // const fillableOrders = await getFillableOrders(
  //   res,
  //   makerToken,
  //   exchangeProxy,
  //   chainId,
  //   provider,
  //   makerTokenUnit,
  //   takerTokenUnit
  // )

  // // Apply additional filters to ensure fillability of orders displayed in the orderbook
  // const filteredOrders = []

  // // Threshold for small orders. All orders with remainingFillableTakerAmount smaller than or equal to this value will be filtered out.
  // // NOTE: Choosing a minRemainingFillableTakerAmount of 100 allows to deduct a small buffer of 10 from takerAssetFillAmount without the risk of ending up with a negative amount to be filled.
  // // This buffer is required to account for order fill failures experienced when trying to set takerAssetFillAmount equal to or close to remainingFillableTakerAmount.
  // const minRemainingFillableTakerAmount = 100

  // // Max absolute deviation between actual fee and expected fee allowed; expressed as an integer in smallest unit of taker token
  // const toleranceTakerTokenFeeAmount = 1

  // // Apply filters
  // fillableOrders.forEach((order) => {
  //   // Calculate expected fee amount and that actually attached to the order
  //   const takerTokenFeeAmountExpected = BigNumber.from(
  //     BigNumber.from(order.order.takerAmount)
  //       .mul(parseUnits(tradingFee.toString(), takerTokenDecimals))
  //       .div(takerTokenUnit)
  //   )
  //   const takerTokenFeeAmountActual = BigNumber.from(
  //     order.order.takerTokenFeeAmount
  //   )
  //   if (
  //     BigNumber.from(order.metaData.remainingFillableTakerAmount).gt(
  //       minRemainingFillableTakerAmount
  //     ) && // Ensure some minimum amount for the order size to avoid any rounding related issues when dealing with small amounts
  //     order.order.taker === NULL_ADDRESS && // Ensure that orders are fillable by anyone and not reserved for a specific address
  //     order.order.feeRecipient === divaGovernanceAddress.toLowerCase() && // Ensure that the feeRecipient is DIVA Governance address
  //     takerTokenFeeAmountActual.gte(
  //       takerTokenFeeAmountExpected.sub(toleranceTakerTokenFeeAmount)
  //     ) &&
  //     takerTokenFeeAmountActual.lte(
  //       takerTokenFeeAmountExpected.add(toleranceTakerTokenFeeAmount)
  //     ) // Ensure correct fee is attached
  //   ) {
  //     filteredOrders.push(order)
  //   }
  // })

  // return filteredOrders

  return res
}

/**
 * A function to get pool information from the pool information array using the baseToken and quoteToken of the pool.
 * @param {PriceResponseType} poolResponse // orderbook price response
 * @param {PoolInfoType[]} poolInfoArray // pool information array
 * @returns {PoolInfoType}
 */
const getPoolInformation = (
  poolResponse: PriceResponseType,
  poolInfoArray: PoolInfoType[]
): PoolInfoType => {
  // Filter pool information by baseToken and quoteToken of the pool
  const poolInfo = poolInfoArray.filter(
    (pair: PoolInfoType) =>
      poolResponse.baseToken === pair.baseToken &&
      poolResponse.quoteToken === pair.quoteToken
  )[0]

  return poolInfo
}

/**
 * A function to get orders by order output type from order price information
 * @param {PriceOutputType} price // orderbook price information
 * @returns {OrderOutputType}
 */
const getOrderOutput = (price: PriceOutputType): OrderOutputType => {
  const poolId = price.poolId
  let orderType = 'buy'
  if (price.type !== 'Buy') {
    orderType = 'sell'
  }

  let bidExpiry = 0
  let bid = ''
  let bidnbrOptions = ''
  if (price.bid.order !== undefined) {
    const order = price.bid
    bidExpiry = getExpiryMinutesFromNow(order.order.expiry)
    // Calculate Bid amount
    const bidAmount = BigNumber.from(order.order.makerAmount)
      .mul(parseUnits('1', price.decimals))
      .div(BigNumber.from(order.order.takerAmount)) // result is in collateral token decimals

    // Value to display in the orderbook
    bid = formatUnits(bidAmount, price.decimals)

    // Display remainingFillableTakerAmount as the quantity in the orderbook
    bidnbrOptions = formatUnits(
      BigNumber.from(order.metaData.remainingFillableTakerAmount),
      price.decimals
    )
  }

  let askExpiry = 0
  let ask = ''
  let asknbrOptions = ''
  if (price.ask.order !== undefined) {
    const order = price.ask
    askExpiry = getExpiryMinutesFromNow(order.order.expiry)
    // Calculate Ask amount
    const askAmount = BigNumber.from(order.order.takerAmount)
      .mul(parseUnits('1', price.decimals))
      .div(BigNumber.from(order.order.makerAmount)) // result is in collateral token decimals

    // Value to display in the orderbook
    ask = formatUnits(askAmount, price.decimals)

    if (
      BigNumber.from(order.metaData.remainingFillableTakerAmount).lt(
        BigNumber.from(order.order.takerAmount)
      )
    ) {
      const remainingFillableMakerAmount = BigNumber.from(
        order.metaData.remainingFillableTakerAmount
      )
        .mul(BigNumber.from(order.order.makerAmount))
        .div(BigNumber.from(order.order.takerAmount))
      asknbrOptions = formatUnits(remainingFillableMakerAmount, price.decimals)
    } else {
      asknbrOptions = formatUnits(
        BigNumber.from(order.order.makerAmount),
        price.decimals
      )
    }
  }

  return {
    bidExpiry: bidExpiry + ' mins', // expiry time of best bid
    askExpiry: askExpiry + ' mins', // expiry time of best ask
    orderType, // order type
    poolId, // pool id
    bid, // best bid
    bidQuantity: bidnbrOptions, // best bid quantity
    ask, // best ask
    askQuantity: asknbrOptions, // best ask quantity
  }
}

export const getOrderbookPricesOutput = (
  priceResponse: any,
  poolInfoArray: PoolInfoType[]
) => {
  const output: OrderOutputType[] = []
  // Formatting data format for using market page tables
  priceResponse.records.map((poolPrice: PriceResponseType) => {
    const poolInfo = getPoolInformation(poolPrice, poolInfoArray)
    const type = poolInfo.poolId[0] === 'S' ? 'Sell' : 'Buy'
    const decimals = poolInfo.collateralTokenDecimals
    const price: PriceOutputType = {
      poolId: poolInfo.poolId, // pool id
      type: type, // pool type
      baseToken: poolPrice.baseToken, // pool baseToken
      quoteToken: poolPrice.quoteToken, // pool quoteToken
      bid: poolPrice.bids.length !== 0 ? poolPrice.bids[0] : {}, // best bid of pool
      ask: poolPrice.asks.length !== 0 ? poolPrice.asks[0] : {}, // best ask of pool
      decimals: decimals, // collateral token decimals of pool
    }

    output.push(getOrderOutput(price))
  })

  return output
}

/**
 * A function to get orderbook price using orderbook price endpoint
 * @param {OrderbookPriceRequest} req // orderbook price request
 * @returns {OrderOutputType[]}
 */
export const getOrderbookPrices = async (
  req: OrderbookPriceRequest
): Promise<OrderOutputType[]> => {
  // Generate an orderbook price endpoint
  let urlPrefix =
    config[req.chainId].orderbook + `/pairs?graphUrl=${req.graphUrl}`

  // Add createdBy by parameter to orderbook price endpoint
  if (req.createdBy !== undefined) {
    urlPrefix += `&createdBy=${req.createdBy}`
  }
  // Add taker by parameter to orderbook price endpoint
  if (req.taker !== undefined) {
    urlPrefix += `&taker=${req.taker}`
  }
  // Add feeRecipient by parameter to orderbook price endpoint
  if (req.feeRecipient !== undefined) {
    urlPrefix += `&feeRecipient=${req.feeRecipient}`
  }
  // Add takerTokenFee by parameter to orderbook price endpoint
  if (req.takerTokenFee !== undefined) {
    urlPrefix += `&takerTokenFee=${req.takerTokenFee}`
  }
  // Add threshold by parameter to orderbook price endpoint
  if (req.threshold !== undefined) {
    urlPrefix += `&threshold=${req.threshold}`
  }
  // Add count by parameter to orderbook price endpoint
  if (req.count !== undefined) {
    urlPrefix += `&count=${req.count}`
  }
  // Add 1 to the current page because the page parameter starts at 0.
  const url = urlPrefix + `&page=${req.page + 1}&perPage=${req.perPage}`

  // Get orderbook price response from orderbook price endpoint
  const prices: OrderOutputType[] = await axios
    .get(url)
    .then(async function (response) {
      const priceResponse: any = response.data

      const output = getOrderbookPricesOutput(priceResponse, req.poolInfo)

      return output
    })
    .catch((err) => {
      console.error(err)
      return []
    })

  return prices
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

export const getAddress = (address: string) => {
  return ethers.utils.getAddress(address)
}

/**
 * Prepare the data to be displayed in the orderbook (price, quantity and expires in)
 */
export const mapOrderData = (
  records: any[],
  decimals: number,
  orderType: number // 0 = BUY, 1 = SELL
) => {
  // Get orderbook (comes already filtered and clean-up; see OpenOrders.tsx)
  const orderbook: any = records.map((record: any) => {
    const order = record.order
    const metaData = record.metaData
    const orders: any = {}

    // Buy Limit (orderType = 0)
    if (orderType === 0) {
      orders.expiry = getExpiryMinutesFromNow(order.expiry)
      orders.orderType = 'buy'
      orders.id = 'buy' + records.indexOf(record as never)

      // Calculate Bid amount
      const bidAmount = BigNumber.from(order.makerAmount)
        .mul(parseUnits('1', decimals))
        .div(BigNumber.from(order.takerAmount)) // result is in collateral token decimals

      // Value to display in the orderbook
      orders.bid = formatUnits(bidAmount, decimals)

      // Display remainingFillableTakerAmount as the quantity in the orderbook
      orders.nbrOptions = formatUnits(
        BigNumber.from(metaData.remainingFillableTakerAmount),
        decimals
      )
    }

    // Sell Limit (orderType = 1)
    if (orderType === 1) {
      orders.expiry = getExpiryMinutesFromNow(order.expiry)
      orders.orderType = 'sell'
      orders.id = 'sell' + records.indexOf(record as never)

      // Calculate Ask amount
      const askAmount = BigNumber.from(order.takerAmount)
        .mul(parseUnits('1', decimals))
        .div(BigNumber.from(order.makerAmount)) // result is in collateral token decimals

      // Value to display in the orderbook
      orders.ask = formatUnits(askAmount, decimals)

      if (
        BigNumber.from(metaData.remainingFillableTakerAmount).lt(
          BigNumber.from(order.takerAmount)
        )
      ) {
        const remainingFillableMakerAmount = BigNumber.from(
          metaData.remainingFillableTakerAmount
        )
          .mul(BigNumber.from(order.makerAmount))
          .div(BigNumber.from(order.takerAmount))
        orders.nbrOptions = formatUnits(remainingFillableMakerAmount, decimals)
      } else {
        orders.nbrOptions = formatUnits(
          BigNumber.from(order.makerAmount),
          decimals
        )
      }
    }
    return orders
  })

  return orderbook
}

export const createTable = (buyOrders: any, sellOrders: any) => {
  // Get orderbook table length
  const buyOrdersCount = buyOrders !== 'undefined' ? buyOrders.length : 0
  const sellOrdersCount = sellOrders !== 'undefined' ? sellOrders.length : 0
  const tableLength =
    buyOrdersCount >= sellOrdersCount ? buyOrdersCount : sellOrdersCount

  const table: any = []
  if (tableLength === 0) {
    return table
  } else {
    for (let j = 0; j < tableLength; j++) {
      const buyOrder = buyOrders[j]
      const sellOrder = sellOrders[j]
      const row = {
        buyExpiry: buyOrder?.expiry == null ? '-' : buyOrder.expiry + ' mins',
        buyQuantity: buyOrder?.nbrOptions == null ? '' : buyOrder.nbrOptions,
        bid: buyOrder?.bid == null ? '' : buyOrder.bid,
        sellExpiry:
          sellOrder?.expiry == null ? '-' : sellOrder.expiry + ' mins',
        sellQuantity: sellOrder?.nbrOptions == null ? '' : sellOrder.nbrOptions,
        ask: sellOrder?.ask == null ? '' : sellOrder.ask,
      }
      table.push(row)
    }
    return table
  }
}

export const getResponse = (
  makerToken: string,
  firstOrdersBid: any[],
  secondOrdersBid: any[]
) => {
  let responseSell = []
  let responseBuy = []
  // Get responseBuy and responseSell using makerToken
  if (firstOrdersBid.length !== 0) {
    // If the bids for the first order is not empty
    const bidOrder = firstOrdersBid[0].order
    if (getAddress(bidOrder.makerToken) === getAddress(makerToken)) {
      responseBuy = secondOrdersBid
      responseSell = firstOrdersBid
    } else {
      responseBuy = firstOrdersBid
      responseSell = secondOrdersBid
    }
    // If the bids for the first order is empty and the bids for the second order is not empty
  } else if (secondOrdersBid.length !== 0) {
    const bidOrder = secondOrdersBid[0].order
    if (getAddress(bidOrder.makerToken) === getAddress(makerToken)) {
      responseBuy = firstOrdersBid
      responseSell = secondOrdersBid
    } else {
      responseBuy = secondOrdersBid
      responseSell = firstOrdersBid
    }
  }

  return {
    responseBuy,
    responseSell,
  }
}
