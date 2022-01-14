import { IZeroExContract } from '@0x/contract-wrappers'
import { BigNumber } from '@0x/utils'
import { CHAIN_ID } from './Config'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

export const buyMarketOrder = async (orderData) => {
  let filledOrder = {}
  const address = contractAddress.getContractAddressesForChainOrThrow(CHAIN_ID)
  const exchangeProxyAddress = address.exchangeProxy
  // Connect to 0x exchange contract
  const exchange = new IZeroExContract(exchangeProxyAddress, window.ethereum)
  const orders = orderData.existingLimitOrders
  let takerFillNbrOptions = new BigNumber(orderData.nbrOptions * 10 ** 18)
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
      .awaitTransactionSuccessAsync({ from: orderData.takerAccount })
      .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
    return response
  }

  const takerAssetAmount = (takerFillAmounts) => {
    const str = JSON.stringify(takerFillAmounts)
    const takerAssetFillAmount = JSON.parse(str, function (key, val) {
      return key === '' ? val : new BigNumber(val)
    })
    return takerAssetFillAmount
  }

  orders.forEach((order) => {
    if (takerFillNbrOptions > 0) {
      const expectedRate = new BigNumber(order.expectedRate)
      const takerFillAmount = takerFillNbrOptions.multipliedBy(expectedRate)
      const remainingFillableTakerAmount = new BigNumber(
        order.remainingFillableTakerAmount
      )
      if (takerFillAmount.isLessThanOrEqualTo(remainingFillableTakerAmount)) {
        takerAssetAmounts.push(takerFillAmount)
        const nbrOptionsFilled =
          remainingFillableTakerAmount.dividedBy(expectedRate)
        takerFillNbrOptions = new BigNumber(
          takerFillNbrOptions - nbrOptionsFilled
        )
        console.log('remaining options to fill ' + takerFillNbrOptions)
      } else {
        takerAssetAmounts.push(remainingFillableTakerAmount)
        const nbrOptionsFilled =
          remainingFillableTakerAmount.dividedBy(expectedRate)
        takerFillNbrOptions = new BigNumber(
          takerFillNbrOptions - nbrOptionsFilled
        )
        console.log('remaining options to fill ' + takerFillNbrOptions)
      }
    } else {
      const takerFillAmount = new BigNumber(0)
      takerAssetAmounts.push(takerFillAmount)
    }
  })

  const totalTakerAssetAmount = takerAssetAmount(takerAssetAmounts)
  filledOrder = await fillOrderResponse(totalTakerAssetAmount)
  return filledOrder
}
