import { IZeroExContract } from '@0x/contract-wrappers'
import { formatUnits, parseEther } from 'ethers/lib/utils'
import { CHAIN_ID } from './Config'
import contractAddress from '@0x/contract-addresses'

export const sellMarketOrder = async (orderData) => {
  let filledOrder = {}
  const address = contractAddress.getContractAddressesForChainOrThrow(CHAIN_ID)
  const exchangeProxyAddress = address.exchangeProxy
  // Connect to 0x exchange contract
  const exchange = new IZeroExContract(exchangeProxyAddress, window.ethereum)
  const orders = orderData.existingLimitOrders
  let makerFillNbrOptions = parseEther(orderData.nbrOptions.toString())
  let makerAssetAmounts = []
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
    if (makerFillNbrOptions > 0) {
      const makerFillOptions = makerFillNbrOptions.mul(parseEther('1'))
      const makerFillOptionsNumber = Number(
        formatUnits(makerFillOptions, orderData.collateralDecimals)
      )
      const makerNbrOptionsNumber = Number(formatUnits(makerFillNbrOptions))
      const remainingFillableTakerAmount = parseEther(
        order.remainingFillableTakerAmount.toString()
      )
      const remainingNumber = remainingFillableTakerAmount.div(parseEther('1'))
      const remainingAmountNumber = Number(formatUnits(remainingNumber))
      if (makerNbrOptionsNumber <= remainingAmountNumber) {
        makerAssetAmounts.push(makerFillOptionsNumber)
        makerFillNbrOptions = parseEther('0')
      } else {
        makerAssetAmounts.push(order.remainingFillableTakerAmount)
        makerFillNbrOptions = makerFillNbrOptions.sub(remainingNumber)
      }
    } else {
      makerAssetAmounts.push('0')
    }
  })
  filledOrder = await fillOrderResponse(makerAssetAmounts)
  return filledOrder
}
