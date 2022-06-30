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

      // Expected rate is specific to an an order, hence the implied taker asset amount calcs need to be done for every single order and
      // cannot be put outside the forEach part.
      // Expected rate is expressed as an integer with collateral token decimals of type BigNumber.
      // TODO: Adjust BuyMarket.tsx for the change to collateral token decimals
      const expectedRate = order.expectedRate

      // The position token amount to buy entered by the user (nbrOptionsToBuy) represents the MAKER token amount in
      // Sell Limit (the orders the user is going to fill). As batchFillLimitOrder requires the taker asset amounts as input,
      // conversion to taker token amount via expectedRate is required.
      // Taker asset is the collateral token and impliedTakerAssetAmount is expressed as an integer with collateral token decimals.
      const impliedTakerAssetAmount = expectedRate
        .mul(scaling) // scale up to 18 decimals
        .mul(nbrOptionsToBuy)
        .div(unit) // "correct" for integer multiplication
        .div(scaling) // scale down to collateral token decimals

      let takerAssetFillAmount
      let nbrOptionsFilled

      // Add elements to the takerAssetFillAmounts array which will be used as input in batchFillLimitOrders
      if (impliedTakerAssetAmount.lte(order.remainingFillableTakerAmount)) {
        takerAssetFillAmount = impliedTakerAssetAmount.toString()
        nbrOptionsFilled = nbrOptionsToBuy
      } else {
        takerAssetFillAmount = order.remainingFillableTakerAmount
        // Update nbrOptionsFilled and overwrite nbrOptionsToBuy with remaining number of position tokens to fill
        nbrOptionsFilled = BigNumber.from(takerAssetFillAmount)
          .mul(scaling) // scale to 18 decimals
          .mul(unit) // multiply for high precision
          .div(expectedRate.mul(scaling)) // divide by expectedRate which has collateral token decimals and hence needs to be scaled up to 18 decimals
      }
      takerAssetFillAmounts.push(takerAssetFillAmount)
      console.log('nbrOptionsFilled', nbrOptionsFilled.toString())
      nbrOptionsToBuy = nbrOptionsToBuy.sub(nbrOptionsFilled) // When nbrOptionsToBuy turns zero, it will not add any new orders to fillOrders array
    }
  })
  console.log('takerAssetFillAmounts', takerAssetFillAmounts)
  filledOrder = await fillOrderResponse(takerAssetFillAmounts, fillOrders)
  return filledOrder
}
