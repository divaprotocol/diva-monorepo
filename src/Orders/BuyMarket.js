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
  //const signatures = orderData.limitOrderSignatures
  //const takerFillNbrOptions = new BigNumber(orderData.nbrOptions * 10 ** 18)
  //const str = JSON.stringify([takerFillNbrOptions])
  //const takerAssetFillAmounts = JSON.parse(str, function (key, val) {
  //  return key === '' ? val : new BigNumber(val)
  //})

  const result = async (takerAssetFillAmounts) => {
    await exchange
      .batchFillLimitOrders(orders, signatures, takerAssetFillAmounts, true)
      .awaitTransactionSuccessAsync({ from: orderData.takerAccount })
      .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
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
      return result(takerAssetFillAmounts)
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

  /**
   * orderData.existingLimitOrders.map(function (order) {
      signatures.push(order.signature)
      delete order.signature
      return order
    })
   */
  /*const params = {
    makerToken: orderData.makerToken,
    takerToken: orderData.takerToken,
  }

  const res = await fetch(
    `https://ropsten.api.0x.org/orderbook/v1/orders?${qs.stringify(params)}`
  )
  const resJSON = await res.json()
  console.log('Response ' + JSON.stringify(resJSON))
  // Fetch first order object in records JSON object array
  let orders = []
  let signatures = []
  let responseOrder
  try {
    responseOrder = resJSON['records']
    //remove signature from response
    const aux = responseOrder.map((item) => item.order)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    orders = aux.map(({ signature, ...rest }) => rest)
    signatures = aux.map(({ signature }) => signature)
  } catch (err) {
    alert('No orders found')
    console.log(err)
    return
  }

  //expected rate
  //const expectedRate = takerAmount / makerAmount
  //const youPay = expectedRate * orderData.nbrOptions
  const takerFillNbrOptions = new BigNumber(orderData.nbrOptions * 10 ** 18)
  const str = JSON.stringify([takerFillNbrOptions])
  // Return an array of three BigNumbers
  const takerAssetFillAmounts = JSON.parse(str, function (key, val) {
    return key === '' ? val : new BigNumber(val)
  })*/

  //console.log('taker asset fill amounts' + takerAssetFillAmounts)

  // TODO Handle sum(takerAssetAmountFillAmounts) > remainingFillable amount
  console.log('Orders ' + JSON.stringify(orders))
  console.log('signatures ' + JSON.stringify(orderData.limitOrderSignatures))
  // Batch fill limit order
}
