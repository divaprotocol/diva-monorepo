// import { IZeroExContract } from '@0x/contract-wrappers'
import { formatUnits, parseEther } from 'ethers/lib/utils'
import zeroXAdresses from '@0x/contract-addresses'

export const buyMarketOrder = async (orderData: any, chainId: string) => {
  let filledOrder = {}
  // Connect to 0x exchange contract
  const exchangeProxyAddress = zeroXAdresses[chainId].exchangeProxy
  const exchange = {} as any // TODO: replace new IZeroExContract(exchangeProxyAddress, window.ethereum)
  const orders = orderData.existingLimitOrders
  let takerFillNbrOptions = parseEther(orderData.nbrOptions.toString())
  const takerAssetAmounts = []
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
      .catch((err) => {
        console.error('Error logged ' + JSON.stringify(err))
        return null
      })
    return response
  }

  orders.forEach((order) => {
    if (takerFillNbrOptions != null && takerFillNbrOptions.gt(0)) {
      const expectedRate = parseEther(order.expectedRate.toString())
      const takerFillAmount = expectedRate.mul(takerFillNbrOptions)
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
  filledOrder = await fillOrderResponse(takerAssetAmounts)
  return filledOrder
}
