import { IZeroExContract } from '@0x/contract-wrappers'
import { formatUnits, parseEther, parseUnits } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'

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

  // Get existing SELL LIMIT Orders where makerToken = position token and takerToken = collateral token
  const orders = orderData.existingLimitOrders

  // Define variables for integer math
  const decimals = orderData.collateralDecimals
  const scaling = parseUnits('1', 18 - decimals)
  const collateralUnit = parseUnits('1', decimals)

  // User input converted from decimal number into an integer with collateral decimals
  let takerFillNbrOptions = parseUnits(
    orderData.nbrOptions.toString(),
    decimals
  )

  // Initialize input arrays for batchFillLimitOrders function
  let takerAssetAmounts = []
  const signatures = []

  // Function to executed the 0x batchFillLimitOrders function
  const fillOrderResponse = async (takerAssetFillAmounts) => {
    orders.map(function (order) {
      signatures.push(order.signature)
      delete order.signature
      return order
    })
    const response = await exchange
      .batchFillLimitOrders(orders, signatures, takerAssetFillAmounts, true) // takerAssetFillAmounts should be an array of stringified integer numbers
      .awaitTransactionSuccessAsync({ from: orderData.takerAccount })
      .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
    return response
  }

  orders.forEach((order) => {
    if (takerFillNbrOptions.gt(0)) {
      // Convert expected rate (of type number) into an integer with collateral token decimals
      const expectedRate = parseUnits(order.expectedRate.toString(), decimals)

      // Calculate taker fill amount implied by user input and expected rate; expressed as an integer with collateral token decimals.
      const takerFillAmount = expectedRate
        .mul(takerFillNbrOptions)
        .div(collateralUnit)

      // Convert string into BigNumber; already expressed in collateral token decimals
      const remainingFillableTakerAmount = BigNumber.from(
        order.remainingFillableTakerAmount
      )

      // const remainingTakerFillNbrOptions = takerFillNbrOptions

      // Add elements to the takerAssetAmounts array which will be used as input in batchFillLimitOrders
      if (takerFillAmount.lte(remainingFillableTakerAmount)) {
        // Add element
        takerAssetAmounts.push(takerFillAmount.toString())

        // Update nbrOptionsFilled and overwrite takerFillNbrOptions with remaining number of position tokens to fill
        const nbrOptionsFilled = remainingFillableTakerAmount
          .mul(collateralUnit)
          .div(expectedRate)
        takerFillNbrOptions = takerFillNbrOptions.sub(nbrOptionsFilled) // This will drop to zero and hence will not enter this if block anymore but will add '0' for the remaining orders
        console.log('takerFillNbrOptions')
        console.log(takerFillNbrOptions)
        // Why is this 0 "trick" not here?
      } else {
        // const remainingAmountNumber = Number(
        //   formatUnits(remainingFillableTakerAmount, decimals)
        // ) // He converts with 1e18 inflated number back to 18 decimals (if collateral token has also 18 decimals, else result with have more decimals, e.g. 30 decimals in case of 6 decimal token)
        takerAssetAmounts.push(remainingFillableTakerAmount.toString()) // bigBumber scaled to 18 decimals if 18 decimal collateral token is used, or more otherwise; BETTER:

        const nbrOptionsFilled = remainingFillableTakerAmount
          .mul(collateralUnit)
          .div(expectedRate)
        takerFillNbrOptions = takerFillNbrOptions.sub(nbrOptionsFilled)
      }
    } else {
      takerAssetAmounts.push('0')
    }
  })
  console.log('takerAssetAmounts')
  console.log(takerAssetAmounts)
  // Filter out the orders that have takerAssetAmounts = 0

  filledOrder = await fillOrderResponse(takerAssetAmounts)
  return filledOrder
}
