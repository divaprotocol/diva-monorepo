import { IZeroExContract } from '@0x/contract-wrappers'
import { parseUnits } from 'ethers/lib/utils'
import { convertExponentialToDecimal } from '../component/Trade/Orders/OrderHelper'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

export const sellMarketOrder = async (orderData) => {
  let filledOrder = {}

  // Connect to 0x exchange contract
  const address = contractAddress.getContractAddressesForChainOrThrow(
    orderData.chainId
  )
  const exchangeProxyAddress = address.exchangeProxy
  const exchange = new IZeroExContract(exchangeProxyAddress, window.ethereum)

  // Get existing BUY LIMIT orders to fill, already sorted by best price. Note that makerToken = collateral token and takerToken = position token.
  const orders = orderData.existingLimitOrders

  // User input converted from decimal number into an integer with 18 decimals of type BigNumber
  let nbrOptionsToSell = orderData.nbrOptions

  // Initialize input arrays for batchFillLimitOrders function
  let takerAssetFillAmounts = []
  const signatures = []

  const fillOrderResponse = async (takerAssetFillAmounts, fillOrders) => {
    fillOrders.map(function (order) {
      signatures.push(order.signature)
      delete order.signature
      return order
    })
    const response = await exchange
      .batchFillLimitOrders(fillOrders, signatures, takerAssetFillAmounts, true)
      .awaitTransactionSuccessAsync({ from: orderData.taker })
      .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
    return response
  }

  let fillOrders = []
  orders.forEach((order) => {
    if (nbrOptionsToSell.gt(0)) {
      fillOrders.push(order)

      // Note: As opposed to BuyMarket.js, the position token amount to sell entered by the user (nbrOptionsToSell) represents the TAKER token amount in
      // Buy Limit (the orders the user is going to fill), hence no conversion to taker token amount is required.

      let takerAssetFillAmount

      // takerAssetFillAmount = Min(nbrOptionsToSell, order.remainingFillableTakerAmount)
      if (nbrOptionsToSell.lte(order.remainingFillableTakerAmount)) {
        takerAssetFillAmount = nbrOptionsToSell.toString()
      } else {
        takerAssetFillAmount = order.remainingFillableTakerAmount
      }
      takerAssetFillAmounts.push(takerAssetFillAmount)

      // Update the remaining amount to be filled.
      // Note that nbrOptionsToSell = 0 if equal to order.remainingFillableTakerAmount. Hence, it won't enter the if statement at the beginning of the forEach part.
      nbrOptionsToSell = nbrOptionsToSell.sub(takerAssetFillAmount)
    }
  })
  filledOrder = await fillOrderResponse(takerAssetFillAmounts, fillOrders)
  return filledOrder
}
