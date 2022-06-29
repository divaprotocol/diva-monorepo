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
  const orders = orderData.existingLimitOrders

  let takerFillNbrOptions = parseUnits(
    convertExponentialToDecimal(orderData.nbrOptions)
  ) // user input * 1e18; note that this part needs adjustment when we move to smart contracts v1.0.0
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
      .awaitTransactionSuccessAsync({ from: orderData.maker })
      .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
    return response
  }

  let fillOrders = []
  orders.forEach((order) => {
    const remainingNumber = BigNumber.from(order.remainingFillableTakerAmount)
    if (
      takerFillNbrOptions.gt(0) &&
      remainingNumber.gt(1) // those are filtered out from the orderbook so should not be fillable
    ) {
      fillOrders.push(order)

      if (takerFillNbrOptions.lte(remainingNumber)) {
        // equality in lte consciously removed due to 0x issue filling amounts equal to remainingFillableTakerAmount
        takerAssetAmounts.push(takerFillNbrOptions.toString())
        takerFillNbrOptions = parseUnits('0') // "trick" to skip the remaining forEach loop
      } else {
        // Adjust takerAssetAmounts by deducting 1 to account for existing 0x issue:
        // https://ethereum.stackexchange.com/questions/130227/0x-batchfilllimitorders-not-working-with-small-remainingfillabletakeramount
        takerAssetAmounts.push(
          BigNumber.from(order.remainingFillableTakerAmount)
            .sub(BigNumber.from(1))
            .toString()
        )
        // Update the remaining amount to be filled; type: BigNumber
        // Note that 1 is add back due to adjust for the deduction in takerAssetAmounts
        takerFillNbrOptions = takerFillNbrOptions
          .sub(remainingNumber)
          .add(BigNumber.from(1))
      }
    }
  })
  filledOrder = await fillOrderResponse(takerAssetAmounts, fillOrders)
  return filledOrder
}
