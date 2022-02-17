// import { IZeroExContract } from '@0x/contract-wrappers'
import { formatUnits, parseEther } from 'ethers/lib/utils'
import zeroXAddresses from '@0x/contract-addresses/addresses.json'

export const sellMarketOrder = async (orderData: any, chainId: string) => {
  let filledOrder = {}
  // const address = contractAddress.getContractAddressesForChainOrThrow(CHAIN_ID)
  const exchangeProxyAddress = zeroXAddresses[chainId].exchangeProxy
  // Connect to 0x exchange contract
  const exchange = {} as any // TODO: new IZeroExContract(exchangeProxyAddress, window.ethereum)
  const orders = orderData.existingLimitOrders
  let makerFillNbrOptions = parseEther(orderData.nbrOptions.toString())
  const makerAssetAmounts = []
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

  orders.forEach((order) => {
    if (makerFillNbrOptions.gt(0)) {
      const makerFillOptions = makerFillNbrOptions.mul(parseEther('1'))
      const makerFillOptionsNumber = Number(
        formatUnits(makerFillOptions, orderData.collateralDecimals)
      )
      const makerNbrOptionsNumber = Number(formatUnits(makerFillNbrOptions))
      const remainingFillableTakerAmount = parseEther(
        order.remainingFillableTakerAmount.toString()
      )
      const remainingNumber = remainingFillableTakerAmount.div(parseEther('1'))
      const remainingAmountNumber = Number(formatUnits(remainingNumber))
      if (makerNbrOptionsNumber <= remainingAmountNumber) {
        makerAssetAmounts.push(makerFillOptionsNumber)
        makerFillNbrOptions = parseEther('0')
      } else {
        makerAssetAmounts.push(order.remainingFillableTakerAmount)
        makerFillNbrOptions = makerFillNbrOptions.sub(remainingNumber)
      }
    } else {
      makerAssetAmounts.push('0')
    }
  })
  filledOrder = await fillOrderResponse(makerAssetAmounts)
  return filledOrder
}
