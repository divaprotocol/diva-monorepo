import { IZeroExContract } from '@0x/contract-wrappers'
import { parseUnits } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
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

  // Get existing BUY LIMIT orders to fill. Note that makerToken = collateral token and takerToken = position token.
  const orders = orderData.existingLimitOrders // QUESTION: Are these sorted? -> see useEffect in SellMarket.tsx

  // Define variables for integer math
  const decimals = orderData.collateralDecimals

  // User input converted from decimal number into an integer with 18 decimals
  let takerFillNbrOptions = parseUnits(
    convertExponentialToDecimal(orderData.nbrOptions),
    decimals
  )

  // Initialize input arrays for batchFillLimitOrders function
  let takerAssetAmounts = []
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
    // Convert string into BigNumber; already expressed in collateral token decimals
    const remainingFillableTakerAmount = BigNumber.from(
      order.remainingFillableTakerAmount
    )
    if (takerFillNbrOptions.gt(0)) {
      fillOrders.push(order)

      if (takerFillNbrOptions.lte(remainingFillableTakerAmount)) {
        takerAssetAmounts.push(takerFillNbrOptions.toString())
      } else {
        takerAssetAmounts.push(order.remainingFillableTakerAmount)
      }
      // Update the remaining amount to be filled
      takerFillNbrOptions = takerFillNbrOptions.sub(
        remainingFillableTakerAmount
      )
    }
  })
  filledOrder = await fillOrderResponse(takerAssetAmounts, fillOrders)
  return filledOrder
}
