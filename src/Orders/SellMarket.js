import { IZeroExContract } from '@0x/contract-wrappers'
import { BigNumber } from '@0x/utils'
import { parseEther } from 'ethers/lib/utils'
import { CHAIN_ID } from './Config'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

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
      const expectedRate = order.expectedRate
      const makerFillAmount = makerFillNbrOptions * expectedRate
      const remainingFillableTakerAmount = order.remainingFillableTakerAmount
      if (makerFillAmount <= remainingFillableTakerAmount) {
        makerAssetAmounts.push(makerFillNbrOptions)
        //const nbrOptionsFilled = makerFillAmount / expectedRate
        makerFillNbrOptions = 0
      } else {
        makerAssetAmounts.push(remainingFillableTakerAmount)
        //const nbrOptionsFilled = remainingFillableTakerAmount / expectedRate
        makerFillNbrOptions = makerFillNbrOptions - remainingFillableTakerAmount
      }
    } else {
      makerAssetAmounts.push('0')
    }
  })
  filledOrder = await fillOrderResponse(makerAssetAmounts)
  return filledOrder
}
