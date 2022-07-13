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
  const unit = parseUnits('1')
  const scaling = parseUnits('1', 18 - decimals)
  const collateralTokenUnit = parseUnits('1', decimals)

  // Slightly reduce nbrOptionsToBuy entered by the user to account for order fills when using exact/close to remainingFillableTakerAmount.
  // IMPORTANT: As minRemainingFillableTakerAmount = 100 (see OpenOrders.tsx), there is no risk of ending up with a negative
  // nbrOptionsToBuy as orders with less than 10 remaininigFillableTakerAmount are filtered out from the orderbook
  const buffer = BigNumber.from(10)
  let nbrOptionsToBuy = orderData.nbrOptions.sub(buffer) // TODO: reduce the takerAssetFillAmount instead of this input?

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
      console.log('fillOrders', fillOrders)
      // Expected rate is specific to an an order, hence the implied taker asset amount calcs need to be done for every single order and
      // cannot be put outside the forEach part.
      // Expected rate is expressed as an integer with collateral token decimals of type BigNumber.
      // TODO: Adjust BuyMarket.tsx for the change to collateral token decimals
      const expectedRate = order.expectedRate
      console.log('expectedRate', expectedRate.toString())
      console.log('nbrOptionsToBuy', nbrOptionsToBuy.toString())
      // The position token amount to buy entered by the user (nbrOptionsToBuy) represents the MAKER token amount in
      // Sell Limit (the orders the user is going to fill). As batchFillLimitOrder requires the taker asset amounts as input,
      // conversion to taker token amount via expectedRate is required.

      // Taker asset is the collateral token and impliedTakerAssetAmount is takerFillAmount derived from the users input.
      // IMPORTANT: impliedTakerAssetAmount could end up being 1 unit less than remainingTakerAssetFillableAmount.
      // E.g., impliedTakerAssetAmount = 5013272727 but remainingTakerAssetFillableAmount = 5013272728
      const impliedTakerAssetAmount = expectedRate
        .mul(nbrOptionsToBuy)
        .div(collateralTokenUnit)
        .sub(BigNumber.from(10)) // Account for problem with filling exact/close to exact remainingFillableTakerAmount; if 10 is remaining, those orders will be filtered out in OpenOrders.tsx
      console.log('impliedTakerAssetAmount', impliedTakerAssetAmount.toString())

      // DROPPING this logic as it doesn't matter if 1 is left as it will get filtered out from the orderbook
      // // It can happen that impliedTakerAssetAmount results in zero (e.g., price < 1 and quantity = 1e-18)
      // // or 1 unit less than remainingFillableTakerAmount due to rounding. Adjust for that accordingly
      // impliedTakerAssetAmount = BigNumber.from(
      //   order.remainingFillableTakerAmount
      // )
      //   .sub(impliedTakerAssetAmount)
      //   .eq(BigNumber.from(1))
      //   ? BigNumber.from(order.remainingFillableTakerAmount)
      //   : impliedTakerAssetAmount
      // const impliedTakerAssetAmount2 = impliedTakerAssetAmount.lt(order.metaData) ?
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
          .mul(scaling) // scale to 18 decimals
          .mul(unit) // multiply for high precision
          .div(expectedRate.mul(scaling)) // divide by expectedRate which has collateral token decimals and hence needs to be scaled up to 18 decimals
      }
      takerAssetFillAmounts.push(takerAssetFillAmount)
      nbrOptionsToBuy = nbrOptionsToBuy.sub(nbrOptionsFilled) // When nbrOptionsToBuy turns zero, it will not add any new orders to fillOrders array
    }
  })
  console.log('fillOrders', fillOrders)
  console.log('takerAssetFillAmounts', takerAssetFillAmounts)
  filledOrder = await fillOrderResponse(takerAssetFillAmounts, fillOrders)
  return filledOrder
}
