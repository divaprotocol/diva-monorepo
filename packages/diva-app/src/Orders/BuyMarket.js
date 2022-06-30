import { IZeroExContract } from '@0x/contract-wrappers'
import { parseUnits } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
import { convertExponentialToDecimal } from '../component/Trade/Orders/OrderHelper'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

export const buyMarketOrder = async (orderData) => {
  let filledOrder = {}

  // Connect to 0x exchange contract
  const address = contractAddress.getContractAddressesForChainOrThrow(
    orderData.chainId
  )
  const exchangeProxyAddress = address.exchangeProxy
  const exchange = new IZeroExContract(exchangeProxyAddress, window.ethereum)

  // Get existing SELL LIMIT orders to fill, already sorted by best price. Note that makerToken = position token and takerToken = collateral token.
  const orders = orderData.existingLimitOrders

  // Define variables for integer math
  const decimals = orderData.collateralDecimals
  const unit = parseUnits('1')
  const scaling = parseUnits('1', 18 - decimals)

  // User input converted from decimal number into an integer with 18 decimals of type BigNumber
  let nbrOptionsToBuy = parseUnits(
    convertExponentialToDecimal(orderData.nbrOptions)
  )

  // Initialize input arrays for batchFillLimitOrders function
  let takerAssetFillAmounts = []
  const signatures = []

  // Function to executed the 0x batchFillLimitOrders function
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
    if (nbrOptionsToBuy.gt(0)) {
      fillOrders.push(order)

      // Expected rate is an integer with collateral token decimals of type BigNumber; 18 decimals
      const expectedRate = order.expectedRate // QUESTION: expectedRate having collateral token decimals might have been more intuitive

      // The position token amount to buy entered by the user (nbrOptionsToBuy) represents the MAKER token amount in
      // Sell Limit (the orders the user is going to fill), hence conversion to taker token amount via expectedRate is required as this
      // serves as the input in batchFillLimitOrders function.
      // Taker asset is the collateral token and impliedTakerAssetAmount is expressed as an integer with collateral token decimals.
      const impliedTakerAssetAmount = expectedRate
        .mul(nbrOptionsToBuy)
        .div(unit)
        .div(scaling)

      let takerAssetFillAmount

      // Add elements to the takerAssetFillAmounts array which will be used as input in batchFillLimitOrders
      if (impliedTakerAssetAmount.lte(order.remainingFillableTakerAmount)) {
        takerAssetFillAmount = impliedTakerAssetAmount.toString()
        nbrOptionsToBuy = parseUnits('0') // To prevent that it enters the if statement at the beginning of the forEach part (could happen due to rounding issues)
      } else {
        takerAssetFillAmount = order.remainingFillableTakerAmount
      }
      takerAssetFillAmounts.push(takerAssetFillAmount)

      // Update nbrOptionsFilled and overwrite nbrOptionsToBuy with remaining number of position tokens to fill
      const nbrOptionsFilled = BigNumber.from(takerAssetFillAmount)
        .mul(scaling) // scale to 18 decimals
        .mul(unit) // multiply for high precision
        .div(expectedRate) // divide by expectedRate which has 18 decimals
      console.log('nbrOptionsFilled', nbrOptionsFilled.toString())
      nbrOptionsToBuy = nbrOptionsToBuy.sub(nbrOptionsFilled) // This will drop to zero and hence will not enter this if block anymore but will add '0' for the remaining orders
    }
  })
  console.log('takerAssetFillAmounts', takerAssetFillAmounts)
  filledOrder = await fillOrderResponse(takerAssetFillAmounts, fillOrders)
  return filledOrder
}
