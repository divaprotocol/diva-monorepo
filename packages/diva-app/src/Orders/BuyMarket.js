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

  // Get existing SELL LIMIT orders to fill. Note that makerToken = position token and takerToken = collateral token.
  const orders = orderData.existingLimitOrders

  // Define variables for integer math
  const decimals = orderData.collateralDecimals
  const unit = parseUnits('1')
  const scaling = parseUnits('1', 18 - decimals)

  // User input converted from decimal number into an integer with 18 decimals
  let takerFillNbrOptions = parseUnits(
    convertExponentialToDecimal(orderData.nbrOptions)
  )

  // Initialize input arrays for batchFillLimitOrders function
  let takerAssetAmounts = []
  const signatures = []

  // Function to executed the 0x batchFillLimitOrders function
  const fillOrderResponse = async (takerAssetFillAmounts, fillOrders) => {
    fillOrders.map(function (order) {
      signatures.push(order.signature)
      delete order.signature
      return order
    })
    console.log(
      'takerAssetAmounts (inside fillOrderResponse)',
      takerAssetAmounts
    )
    const response = await exchange
      .batchFillLimitOrders(fillOrders, signatures, takerAssetFillAmounts, true) // takerAssetFillAmounts should be an array of stringified integer numbers
      .awaitTransactionSuccessAsync({ from: orderData.takerAccount })
      .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
    return response
  }

  let fillOrders = []
  orders.forEach((order) => {
    if (takerFillNbrOptions.gt(0)) {
      fillOrders.push(order)
      // Convert expected rate (of type number) into an integer with 18 decimals
      const expectedRate = order.expectedRate

      // Calculate taker fill amount implied by user input and expected rate; expressed as an integer with collateral token decimals.
      const takerFillAmount = expectedRate
        .mul(takerFillNbrOptions)
        .div(unit)
        .div(scaling)

      // Convert string into BigNumber; already expressed in collateral token decimals
      const remainingFillableTakerAmount = BigNumber.from(
        order.remainingFillableTakerAmount
      )

      // Add elements to the takerAssetAmounts array which will be used as input in batchFillLimitOrders
      if (takerFillAmount.lte(remainingFillableTakerAmount)) {
        takerAssetAmounts.push(takerFillAmount.toString())
      } else {
        takerAssetAmounts.push(order.remainingFillableTakerAmount.toString())
      }

      // Update nbrOptionsFilled and overwrite takerFillNbrOptions with remaining number of position tokens to fill
      const nbrOptionsFilled = remainingFillableTakerAmount
        .mul(scaling) // scale to 18 decimals
        .mul(unit) // multiply for high precision
        .div(expectedRate) // divide by expectedRate which has 18 decimals
      console.log('nbrOptionsFilled', nbrOptionsFilled.toString())
      takerFillNbrOptions = takerFillNbrOptions.sub(nbrOptionsFilled) // This will drop to zero and hence will not enter this if block anymore but will add '0' for the remaining orders
    }
  })
  console.log('takerAssetAmounts', takerAssetAmounts)
  filledOrder = await fillOrderResponse(takerAssetAmounts, fillOrders)
  return filledOrder
}
