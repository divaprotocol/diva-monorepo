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
  console.log(' orders ' + JSON.stringify(orders))
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

  const order = orderData.existingLimitOrders[0]
  const takerFillNbrOptions = new BigNumber(orderData.nbrOptions * 10 ** 18)
  const expectedRate = new BigNumber(order.expectedRate)
  const takerFillAmount = takerFillNbrOptions.multipliedBy(expectedRate)
  const remainingFillableTakerAmount = order.remainingFillableTakerAmount
  const takerAssetAmount = (takerFillAmount) => {
    const str = JSON.stringify([takerFillAmount])
    const takerAssetFillAmounts = JSON.parse(str, function (key, val) {
      return key === '' ? val : new BigNumber(val)
    })
    return takerAssetFillAmounts
  }

  if (takerFillAmount <= remainingFillableTakerAmount) {
    const takerAssetFillAmount = takerAssetAmount(takerFillAmount)
    filledOrder = await fillOrderResponse(takerAssetFillAmount)
  } else {
    const takerAssetFillAmount = takerAssetAmount(remainingFillableTakerAmount)
    filledOrder = await fillOrderResponse(takerAssetFillAmount)
  }

  return filledOrder

  // TODO Handle sum(takerAssetAmountFillAmounts) > remainingFillable amount
  // Batch fill limit order
}
