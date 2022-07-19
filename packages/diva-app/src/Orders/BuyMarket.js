import { IZeroExContract } from '@0x/contract-wrappers'
import { parseUnits } from 'ethers/lib/utils'
import { BigNumber } from 'ethers'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

export const buyMarketOrder = async (orderData) => {
  let filledOrder = {}

  // Connect to 0x exchange contract
  const address = contractAddress.getContractAddressesForChainOrThrow(
    orderData.chainId
  )
  const exchangeProxyAddress = address.exchangeProxy
  const exchange = new IZeroExContract(exchangeProxyAddress, window.ethereum)

  // Get existing SELL LIMIT orders to fill, already sorted by best price. Note that makerToken = position token and takerToken = collateral token.
  const orders = orderData.existingLimitOrders

  // Define variables for integer math
  const decimals = orderData.collateralDecimals
  const positionTokenUnit = parseUnits('1')
  const collateralTokenUnit = parseUnits('1', decimals)

  let nbrOptionsToBuy = orderData.nbrOptions

  // Initialize input arrays for batchFillLimitOrders function
  let takerAssetFillAmounts = []
  const signatures = []

  // Function to executed the 0x batchFillLimitOrders function
  const fillOrderResponse = async (takerAssetFillAmounts, fillOrders) => {
    fillOrders.map(function (order) {
      signatures.push(order.signature)
      delete order.signature
      return order
    })

    // Keep for debugging
    // const res = await exchange
    //   .getLimitOrderInfo(fillOrders[0])
    //   .callAsync({ from: orderData.maker })
    //   .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
    // console.log(
    //   'order 1 status (res.takerTokenFilledAmount): ',
    //   res.takerTokenFilledAmount.toString()
    // )
    // console.log(res)

    const response = await exchange
      .batchFillLimitOrders(fillOrders, signatures, takerAssetFillAmounts, true)
      .awaitTransactionSuccessAsync({ from: orderData.taker })
      .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
    return response
  }

  let fillOrders = []
  orders.forEach((order) => {
    if (nbrOptionsToBuy.gt(0)) {
      fillOrders.push(order)

      // Expected rate is specific to an an order, hence the implied taker asset amount calcs need to be done for every single order and
      // cannot be put outside the forEach part.
      // Expected rate is expressed as an integer with collateral token decimals of type BigNumber.
      // TODO: Adjust BuyMarket.tsx for the change to collateral token decimals
      const expectedRate = order.expectedRate

      // The position token amount to buy entered by the user (nbrOptionsToBuy) represents the MAKER token amount in
      // Sell Limit (the orders the user is going to fill). As batchFillLimitOrder requires the taker asset amounts as input,
      // conversion to taker token amount via expectedRate is required.
      // Taker asset is the collateral token and impliedTakerAssetAmount is takerFillAmount derived from the users input.
      // Note that a small amount (10) is deducted to ensure that the order can be filled as we experienced issues when trying
      // to fill an amount equal to or close to remainingFillableTakerAmount. Note that there is not risk of impliedTakerAssetAmount
      // turning negative as orders with remainingFillableTakerAmount <= 100 are filtered out in OpenOrders.tsx.
      // Note that because of this logic, orders will have a non-zero remainingFillableTakerAmount but as this will be <=100, they will
      // be filtered out on data load. An alternative logic could be to fill the missing amount in a second order but this option has not been implemented
      // as the additional gas costs incurred from filling another order might not be worth it.
      // let impliedTakerAssetAmount
      let impliedTakerAssetAmount = expectedRate
        .mul(nbrOptionsToBuy)
        .div(collateralTokenUnit)
      if (impliedTakerAssetAmount.gt(10)) {
        impliedTakerAssetAmount = impliedTakerAssetAmount.sub(
          BigNumber.from(10)
        )

        let takerAssetFillAmount
        let nbrOptionsFilled

        // Add elements to the takerAssetFillAmounts array which will be used as input in batchFillLimitOrders
        if (impliedTakerAssetAmount.lte(order.remainingFillableTakerAmount)) {
          takerAssetFillAmount = impliedTakerAssetAmount.toString()
          nbrOptionsFilled = nbrOptionsToBuy
        } else {
          takerAssetFillAmount = order.remainingFillableTakerAmount
          // Update nbrOptionsFilled and overwrite nbrOptionsToBuy with remaining number of position tokens to fill
          nbrOptionsFilled = BigNumber.from(takerAssetFillAmount)
            .mul(positionTokenUnit)
            .div(expectedRate) // result has 18 decimals
        }
        takerAssetFillAmounts.push(takerAssetFillAmount)
        nbrOptionsToBuy = nbrOptionsToBuy.sub(nbrOptionsFilled) // When nbrOptionsToBuy turns zero, it will not add any new orders to fillOrders array
      }
    }
  })
  filledOrder = await fillOrderResponse(takerAssetFillAmounts, fillOrders)
  return filledOrder
}
