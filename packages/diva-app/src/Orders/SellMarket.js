import { IZeroExContract } from '@0x/contract-wrappers'
import { BigNumber } from 'ethers'
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

  // Get existing BUY LIMIT orders to fill, already sorted by best price. Note that makerToken = collateral token and takerToken = position token.
  const orders = orderData.existingLimitOrders

  // User input converted from decimal number into an integer with 18 decimals of type BigNumber
  let nbrOptionsToSell = orderData.nbrOptions

  // Initialize input arrays for batchFillLimitOrders function
  let takerAssetFillAmounts = []
  const signatures = []

  const fillOrderResponse = async (takerAssetFillAmounts, fillOrders) => {
    fillOrders.map(function (order) {
      signatures.push(order.signature)
      delete order.signature
      return order
    })

    const response = await exchange
      .batchFillLimitOrders(fillOrders, signatures, takerAssetFillAmounts, true)
      .awaitTransactionSuccessAsync({ from: orderData.taker })
      .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
    return response
  }

  let fillOrders = []
  orders.forEach((order) => {
    if (nbrOptionsToSell.gt(10)) {
      fillOrders.push(order)

      // Note: As opposed to BuyMarket.js, the position token amount to sell entered by the user (nbrOptionsToSell) represents the TAKER token amount in
      // Buy Limit (the orders the user is going to fill), hence no conversion to taker token amount is required.

      let takerAssetFillAmount
      console.log('nbrOptionsToSell', nbrOptionsToSell.toString())
      console.log(
        'order.remainingFillableTakerAmount',
        order.remainingFillableTakerAmount.toString()
      )
      // takerAssetFillAmount = Min(nbrOptionsToSell, order.remainingFillableTakerAmount)
      if (nbrOptionsToSell.lte(order.remainingFillableTakerAmount)) {
        takerAssetFillAmount = nbrOptionsToSell.toString()
      } else {
        takerAssetFillAmount = order.remainingFillableTakerAmount
      }
      // Add the takerAssetFillAmount to the takerAssetFillAmounts array.
      // Slightly reduce the amount to account for issues experienced when trying to fill an amount equal to or close to remainingFillableTakerAmount.
      // The offset should not exceed minRemainingFillableTakerAmount in OpenOrders.tsx (currently set to 100).
      // Note that because of this logic, orders will have a non-zero remainingFillableTakerAmount but as this will be <=100, they will
      // be filtered out on data load. An alternative logic could be to fill the missing amount in a second order but this option has not been implemented
      // as the additional gas costs incurred from filling another order might not be worth it.
      takerAssetFillAmounts.push(
        BigNumber.from(takerAssetFillAmount).sub(BigNumber.from(10)).toString()
      )

      // Update the remaining amount to be filled.
      // Note that nbrOptionsToSell = 0 if equal to order.remainingFillableTakerAmount. Hence, it won't enter the if statement at the beginning of the forEach part.
      nbrOptionsToSell = nbrOptionsToSell.sub(takerAssetFillAmount)
    }
  })
  console.log('fillOrders', fillOrders)
  console.log('takerAssetFillAmounts', takerAssetFillAmounts)
  // Keep for debugging
  const res = await exchange
    .getLimitOrderInfo(fillOrders[0])
    .callAsync({ from: orderData.maker })
    .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
  console.log(
    'order 1 status (res.takerTokenFilledAmount): ',
    res.takerTokenFilledAmount.toString()
  )
  console.log('order1 takerAmount', fillOrders[0].takerAmount.toString())
  console.log(
    'order 1 remainingFillableTakerAmount',
    fillOrders[0].remainingFillableTakerAmount.toString()
  )
  console.log(
    'order 1 takerAmount - filled',
    BigNumber.from(fillOrders[0].takerAmount)
      .sub(BigNumber.from(res.takerTokenFilledAmount.toString()))
      .toString()
  )
  // Order 2
  // const res2 = await exchange
  //   .getLimitOrderInfo(fillOrders[1])
  //   .callAsync({ from: orderData.maker })
  //   .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
  // console.log(
  //   'order 2 status (res2.takerTokenFilledAmount): ',
  //   res2.takerTokenFilledAmount.toString()
  // )
  // console.log('order 2 takerAmount', fillOrders[1].takerAmount.toString())
  // console.log(
  //   'order 2 remainingFillableTakerAmount',
  //   fillOrders[1].remainingFillableTakerAmount.toString()
  // )
  // console.log(
  //   'order 2 takerAmount - filled',
  //   BigNumber.from(fillOrders[1].takerAmount)
  //     .sub(BigNumber.from(res2.takerTokenFilledAmount.toString()))
  //     .toString()
  // )
  // // Order 3
  // const res3 = await exchange
  //   .getLimitOrderInfo(fillOrders[2])
  //   .callAsync({ from: orderData.maker })
  //   .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
  // console.log(
  //   'order 3 status (res2.takerTokenFilledAmount): ',
  //   res3.takerTokenFilledAmount.toString()
  // )
  // console.log('order 3 takerAmount', fillOrders[2].takerAmount.toString())
  // console.log(
  //   'order 3 remainingFillableTakerAmount',
  //   fillOrders[2].remainingFillableTakerAmount.toString()
  // )
  // console.log(
  //   'order 3 takerAmount - filled',
  //   BigNumber.from(fillOrders[2].takerAmount)
  //     .sub(BigNumber.from(res3.takerTokenFilledAmount.toString()))
  //     .toString()
  // )

  // console.log(res)
  filledOrder = await fillOrderResponse(takerAssetFillAmounts, fillOrders)
  return filledOrder
}
