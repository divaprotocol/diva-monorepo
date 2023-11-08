import { BigNumber } from 'ethers'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
import { ethers } from 'ethers'
import ZEROX_ABI from '../abi/IZeroX.json'

export const sellMarketOrder = async (orderData) => {
  let filledOrder = {}
  const signer = orderData.provider.getSigner()

  // Connect to 0x exchange contract
  const address = contractAddress.getContractAddressesForChainOrThrow(
    orderData.chainId
  )
  const exchangeProxyAddress = address.exchangeProxy

  // Get existing BUY LIMIT orders to fill, already sorted by best price. Note that makerToken = collateral token and takerToken = position token.
  const orders = orderData.existingLimitOrders

  // User input
  let nbrOptionsToSell = orderData.nbrOptions

  // Initialize input arrays for batchFillLimitOrders function
  let takerAssetFillAmounts = []
  let signatures = []

  const fillOrderResponse = async (takerAssetFillAmounts, fillOrders) => {
    // Separate signatures and order data.
    // Used destructuing instead of signatures.push(order.signature) in combinatino with delete.signature
    // as signatures would end up undefined on user rejection of transaction and
    // as a result batchFillLimitOrders would throw an error.
    signatures = fillOrders.map(({ signature, ...rest }) => signature)
    fillOrders = fillOrders.map(({ signature, ...rest }) => rest)

    const exchange = new ethers.Contract(
      exchangeProxyAddress,
      ZEROX_ABI,
      signer
    )
    try {
      const response = await exchange.batchFillLimitOrders(
        fillOrders,
        signatures,
        takerAssetFillAmounts,
        true
      )
      //check the status of the transaction
      await orderData.provider.waitForTransaction(response.hash)
      return response
    } catch (err) {
      console.error('Error logged ' + JSON.stringify(err))
      return err
    }
  }

  let fillOrders = []
  orders.forEach((order) => {
    if (nbrOptionsToSell.gt(10)) {
      fillOrders.push(order)

      // Note: As opposed to BuyMarket.js, the position token amount to sell entered by the user (nbrOptionsToSell) represents the TAKER token amount in
      // Buy Limit (the orders the user is going to fill), hence no conversion to taker token amount is required.

      let takerAssetFillAmount

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
  filledOrder = await fillOrderResponse(takerAssetFillAmounts, fillOrders)
  return filledOrder
}
