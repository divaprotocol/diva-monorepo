import { IZeroExContract } from '@0x/contract-wrappers'
import { BigNumber } from '@0x/utils'
import { formatEther, formatUnits, parseEther } from 'ethers/lib/utils'
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
  let takerFillNbrOptions = parseEther(orderData.nbrOptions.toString())
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

  orders.forEach((order) => {
    if (takerFillNbrOptions > 0) {
      const expectedRate = parseEther(order.expectedRate.toString())
      let takerFillAmount = expectedRate.mul(takerFillNbrOptions)
      const takerFillAmountNumber = Number(
        formatUnits(takerFillAmount, orderData.collateralDecimals)
      )
      const remainingFillableTakerAmount = parseEther(
        order.remainingFillableTakerAmount.toString()
      )
      if (takerFillAmount.lte(remainingFillableTakerAmount)) {
        takerAssetAmounts.push(takerFillAmountNumber)
        const nbrOptionsFilled = remainingFillableTakerAmount.div(expectedRate)
        takerFillNbrOptions = takerFillNbrOptions.sub(nbrOptionsFilled)
      } else {
        const remainingAmountNumber = Number(
          formatUnits(
            remainingFillableTakerAmount,
            orderData.collateralDecimals
          )
        )
        takerAssetAmounts.push(remainingAmountNumber)
        const nbrOptionsFilled = remainingFillableTakerAmount.div(expectedRate)
        takerFillNbrOptions = takerFillNbrOptions.sub(nbrOptionsFilled)
      }
    } else {
      takerAssetAmounts.push('0')
    }
  })
  console.log('taker asset amount ' + JSON.stringify(takerAssetAmounts))
  filledOrder = await fillOrderResponse(takerAssetAmounts)
  console.log('filled order ' + JSON.stringify(filledOrder))
  return filledOrder
}

/*import { IZeroExContract } from '@0x/contract-wrappers'
import { BigNumber } from '@0x/utils'
import { parseEther } from 'ethers/lib/utils'
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
  let takerFillNbrOptions = parseEther(orderData.nbrOptions.toString())
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

  orders.forEach((order) => {
    if (takerFillNbrOptions > 0) {
      const expectedRate = order.expectedRate
      const takerFillAmount = takerFillNbrOptions * expectedRate
      const remainingFillableTakerAmount = order.remainingFillableTakerAmount
      if (takerFillAmount <= remainingFillableTakerAmount) {
        takerAssetAmounts.push(takerFillAmount.toString())
        const nbrOptionsFilled = remainingFillableTakerAmount / expectedRate
        takerFillNbrOptions = takerFillNbrOptions - nbrOptionsFilled
      } else {
        takerAssetAmounts.push(remainingFillableTakerAmount.toString())
        const nbrOptionsFilled = remainingFillableTakerAmount / expectedRate
        takerFillNbrOptions = takerFillNbrOptions - nbrOptionsFilled
      }
    } else {
      takerAssetAmounts.push('0')
    }
  })
  filledOrder = await fillOrderResponse(takerAssetAmounts)
  return filledOrder
}*/
