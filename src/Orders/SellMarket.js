import { IZeroExContract } from '@0x/contract-wrappers'
import { BigNumber } from '@0x/utils'
import { formatUnits, parseEther } from 'ethers/lib/utils'
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

  /*orders.forEach((order) => {
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
  console.log('maker asset amount ' + JSON.stringify(makerAssetAmounts))
  filledOrder = await fillOrderResponse(makerAssetAmounts)
  return filledOrder
}*/

  orders.forEach((order) => {
    const nbrOptions = orderData.nbrOptions
    if (makerFillNbrOptions > 0) {
      const expectedRate = parseEther(order.expectedRate.toString())
      //const makerFillAmount = expectedRate.mul(makerFillNbrOptions)

      const makerFillOption = makerFillNbrOptions.mul(parseEther('1'))
      const makerFillOptionNumber = Number(
        formatUnits(makerFillOption, orderData.collateralDecimals)
      )
      const makerNbrOptionsNumber = Number(formatUnits(makerFillNbrOptions))
      const remainingFillableTakerAmount = parseEther(
        order.remainingFillableTakerAmount.toString()
      )
      const remainingNumber = remainingFillableTakerAmount.div(parseEther('1'))
      const remainingAmountNumber = Number(formatUnits(remainingNumber))
      //if (makerFillNbrOptions.lte(remainingFillableTakerAmount)) {
      if (makerNbrOptionsNumber <= remainingAmountNumber) {
        makerAssetAmounts.push(makerFillOptionNumber)
        //const nbrOptionsFilled = makerFillAmount / expectedRate
        makerFillNbrOptions = parseEther('0')
      } else {
        makerAssetAmounts.push(order.remainingFillableTakerAmount)
        //const nbrOptionsFilled = remainingFillableTakerAmount / expectedRate
        makerFillNbrOptions = makerFillNbrOptions.sub(remainingNumber)
        //makerFillNbrOptions = makerFillNbrOptions.div(parseEther('1'))
      }
    } else {
      makerAssetAmounts.push('0')
    }
  })
  console.log('makerAmounts ' + JSON.stringify(makerAssetAmounts))
  filledOrder = await fillOrderResponse(makerAssetAmounts)
  console.log('filled order ' + JSON.stringify(filledOrder))
  return filledOrder
}
