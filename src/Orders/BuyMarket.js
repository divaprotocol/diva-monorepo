import { IZeroExContract } from '@0x/contract-wrappers'
import { BigNumber } from '@0x/utils'
//import * as qs from 'qs'
import { CHAIN_ID } from './Config'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

export const buyMarketOrder = async (orderData) => {
  const address = contractAddress.getContractAddressesForChainOrThrow(CHAIN_ID)
  const exchangeProxyAddress = address.exchangeProxy
  // Connect to 0x exchange contract
  const exchange = new IZeroExContract(exchangeProxyAddress, window.ethereum)
  const orders = orderData.existingLimitOrders
  let signatures = []
  const result = async (takerAssetFillAmounts) => {
    const response = await exchange
      .batchFillLimitOrders(orders, signatures, takerAssetFillAmounts, true)
      .awaitTransactionSuccessAsync({ from: orderData.takerAccount })
      .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
    return response
  }

  if (orderData.existingLimitOrders.length === 1) {
    const order = orderData.existingLimitOrders[0]
    const takerFillNbrOptions = new BigNumber(orderData.nbrOptions * 10 ** 18)
    const expectedRate = new BigNumber(order.takerAmount / order.makerAmount)
    const takerFillAmount = takerFillNbrOptions.multipliedBy(expectedRate)
    const str = JSON.stringify([takerFillAmount])
    const takerAssetFillAmounts = JSON.parse(str, function (key, val) {
      return key === '' ? val : new BigNumber(val)
    })
    if (orderData.nbrOptions === 1) {
      orders.map(function (order) {
        signatures.push(order.signature)
        delete order.signature
        return order
      })
      const filledOrder = await result(takerAssetFillAmounts)
      console.log('Response ' + JSON.stringify(filledOrder))
      if ('logs' in filledOrder) {
        const logs = filledOrder.logs
        const event = logs.map((eventData) => {
          return eventData.event
        })
        return event
      }
    }

    if (orderData.existingLimitOrders.length > 1) {
      if (orderData.nbrOptions === 1) {
        orders.map(function (order) {
          signatures.push(order.signature)
          delete order.signature
          return order
        })
        result()
      }
      if (orderData.nbrOptions <= orders.length) {
        for (let i = 0; i < orderData.nbrOptions; i++) {
          orders[i].map(function (order) {
            signatures.push(order.signature)
            delete order.signature
            return order
          })
          result()
        }
      }
    }
  }
  // TODO Handle sum(takerAssetAmountFillAmounts) > remainingFillable amount
  console.log('Orders ' + JSON.stringify(orders))
  console.log('signatures ' + JSON.stringify(orderData.limitOrderSignatures))
  // Batch fill limit order
}
