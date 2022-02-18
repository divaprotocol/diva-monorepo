import zeroXAdresses from '@0x/contract-addresses/addresses.json'
import ZERO_X_ABI from '../abi/ZERO_X.json'
import { ethers, FixedNumber } from 'ethers'

export const buyMarketOrder = async (
  orderData: any,
  chainId: string,
  provider: any
) => {
  let filledOrder = {}

  // Connect to 0x exchange contract
  const signer = provider.getSigner()
  const exchangeProxyAddress = zeroXAdresses[chainId].exchangeProxy
  const contract = new ethers.Contract(
    exchangeProxyAddress,
    ZERO_X_ABI as any,
    signer
  )

  console.log(orderData)

  const orders = orderData.existingLimitOrders
  let takerFillNbrOptions = FixedNumber.from(String(orderData.nbrOptions))
  const takerAssetAmounts = []
  const signatures = []
  const fillOrderResponse = async (takerAssetFillAmounts) => {
    orders.map(function (order) {
      signatures.push(order.signature)
      delete order.signature
      return order
    })
    console.log({ orders, signatures, takerAssetFillAmounts })
    const tx = await contract.batchFillLimitOrders(
      orders,
      signatures,
      takerAssetFillAmounts,
      true
    )

    const val = await tx.wait()

    return val
  }

  orders.forEach((order) => {
    if (takerFillNbrOptions != null) {
      console.log(order)
      const expectedRate = FixedNumber.from(order.expectedRate.toString())
      const takerFillAmount = expectedRate.mulUnsafe(
        FixedNumber.from(takerFillNbrOptions.toString())
      )
      const remainingFillableTakerAmount = FixedNumber.from(
        order.remainingFillableTakerAmount.toString()
      )
      if (takerFillAmount > remainingFillableTakerAmount) {
        takerAssetAmounts.push(takerFillAmount)
        const nbrOptionsFilled =
          remainingFillableTakerAmount.divUnsafe(expectedRate)
        takerFillNbrOptions = takerFillNbrOptions.subUnsafe(
          FixedNumber.from(String(nbrOptionsFilled))
        )
      } else {
        takerAssetAmounts.push(remainingFillableTakerAmount)
        const nbrOptionsFilled =
          remainingFillableTakerAmount.divUnsafe(expectedRate)
        takerFillNbrOptions = takerFillNbrOptions.subUnsafe(
          FixedNumber.from(String(nbrOptionsFilled))
        )
      }
    }
  })
  try {
    filledOrder = await fillOrderResponse(takerAssetAmounts)
  } catch (err) {
    console.error(err)
  }

  return filledOrder
}
