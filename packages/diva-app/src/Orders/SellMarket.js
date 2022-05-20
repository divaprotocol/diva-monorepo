import { IZeroExContract } from '@0x/contract-wrappers'
import { parseEther } from 'ethers/lib/utils'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

export const sellMarketOrder = async (orderData) => {
  let filledOrder = {}
  const address = contractAddress.getContractAddressesForChainOrThrow(
    orderData.chainId
  )
  const exchangeProxyAddress = address.exchangeProxy
  // Connect to 0x exchange contract
  const exchange = new IZeroExContract(exchangeProxyAddress, window.ethereum)
  const orders = orderData.existingLimitOrders // Existing BUY LIMIT orders where makerToken = collateral token and takerToken = position token
  let takerFillNbrOptions = parseEther(orderData.nbrOptions.toString()) // user input * 1e18; note that this part needs adjustment when we move to smart contracts v1.0.0
  let takerAssetAmounts = []
  const signatures = []

  const fillOrderResponse = async (takerAssetFillAmounts) => {
    orders.map(function (order) {
      signatures.push(order.signature)
      delete order.signature
      return order
    })
    const response = await exchange
      .batchFillLimitOrders(orders, signatures, takerAssetFillAmounts, true)
      .awaitTransactionSuccessAsync({ from: orderData.maker })
      .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
    return response
  }

  orders.forEach((order) => {
    if (takerFillNbrOptions.gt(0)) {
      const remainingNumber = order.remainingFillableTakerAmount

      if (takerFillNbrOptions.lte(remainingNumber)) {
        takerAssetAmounts.push(takerFillNbrOptions.toString())
        takerFillNbrOptions = parseEther('0') // "trick" to skip the remaining forEach loop
      } else {
        takerAssetAmounts.push(order.remainingFillableTakerAmount)
        takerFillNbrOptions = takerFillNbrOptions.sub(remainingNumber) // Update the remaining amount to be filled; type: BigNumber
      }
    } else {
      takerAssetAmounts.push('0') // "trick" to skip the remaining forEach loop
    }
  })
  filledOrder = await fillOrderResponse(takerAssetAmounts)
  return filledOrder
}
