import { IZeroExContract } from '@0x/contract-wrappers'
import { parseEther, formatUnits } from 'ethers/lib/utils'
import { BigNumber } from '@ethersproject/bignumber/lib/bignumber'
import { convertExponentialToDecimal } from '../component/Trade/Orders/OrderHelper'
// 0.000000000000000001

// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

export const sellMarketOrder = async (orderData) => {
  let filledOrder = {}
  const address = contractAddress.getContractAddressesForChainOrThrow(
    orderData.chainId
  )
  const exchangeProxyAddress = address.exchangeProxy
  // Connect to 0x exchange contract
  const exchange = new IZeroExContract(exchangeProxyAddress, window.ethereum)
  const orders = orderData.existingLimitOrders // Existing BUY LIMIT orders where makerToken = collateral token and takerToken = position token
  let takerFillNbrOptions = parseEther(
    convertExponentialToDecimal(orderData.nbrOptions).toString()
  ) // user input * 1e18; note that this part needs adjustment when we move to smart contracts v1.0.0
  let takerAssetAmounts = []
  const signatures = []

  const fillOrderResponse = async (takerAssetFillAmounts, fillOrders) => {
    fillOrders.map(function (order) {
      console.log('Signature')
      console.log(order.signature)
      signatures.push(order.signature)
      delete order.signature
      return order
    })
    console.log('batchFill inputs')
    console.log(fillOrders)
    console.log(signatures)
    console.log(takerAssetFillAmounts)
    const response = await exchange
      .batchFillLimitOrders(fillOrders, signatures, takerAssetFillAmounts, true)
      .awaitTransactionSuccessAsync({ from: orderData.maker })
      .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
    return response
  }

  let fillOrders = []
  orders.forEach((order) => {
    if (takerFillNbrOptions.gt(0)) {
      fillOrders.push(order) // QUESTION: Why?
      const remainingNumber = BigNumber.from(order.remainingFillableTakerAmount)
      if (takerFillNbrOptions.lte(remainingNumber)) {
        takerAssetAmounts.push(takerFillNbrOptions.toString())
        takerFillNbrOptions = parseEther('0') // "trick" to skip the remaining forEach loop
      } else {
        takerAssetAmounts.push(
          BigNumber.from(order.remainingFillableTakerAmount)
            .sub(BigNumber.from(1))
            .toString()
        )
        //takerAssetAmounts.push(order.remainingFillableTakerAmount)
        takerFillNbrOptions = takerFillNbrOptions.sub(remainingNumber) // Update the remaining amount to be filled; type: BigNumber
      }
    }
  })
  console.log(takerAssetAmounts)
  console.log(JSON.stringify(fillOrders))
  filledOrder = await fillOrderResponse(takerAssetAmounts, fillOrders)
  return filledOrder
}
