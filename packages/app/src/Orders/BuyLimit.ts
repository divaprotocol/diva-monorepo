import { parseEther, parseUnits } from 'ethers/lib/utils'
import { utils, NULL_ADDRESS } from './config'
import { metamaskProvider } from './config'
import { API0X } from './config'
import zeroXAddresses from '@0x/contract-addresses/addresses.json'

export const buylimitOrder = async (orderData: any, chainId: string) => {
  const getFutureExpiryInSeconds = () => {
    return Math.floor(Date.now() / 1000 + orderData.orderExpiry * 60).toString()
  }

  const isFloat = (number) => {
    return number != '' && !isNaN(number) && Math.round(number) != number
  }
  const decimalPlaces = (number) => {
    return number.toString().split('.')[1].length
  }

  const nbrOptionsDecimals = isFloat(orderData.nbrOptions)
    ? decimalPlaces(orderData.nbrOptions)
    : 0
  const limitPriceDecimals = isFloat(orderData.limitPrice)
    ? decimalPlaces(orderData.limitPrice)
    : 0

  const totalDecimalPlaces = nbrOptionsDecimals + limitPriceDecimals
  /**Floating point multiplication some times give erronious results
   * for example. 1.1 * 1.5 = 1.65 however the javascript multiplication give
   * 1.6500000000000001 as a result. The 1 digit at the end cause lot of issues
   * to resolve this problem we need to calculate the total number of digit by
   * addition of individual floating point number
   */
  const amount = Number(orderData.nbrOptions * orderData.limitPrice).toFixed(
    totalDecimalPlaces
  )
  const makerAmount = parseUnits(
    amount.toString(),
    orderData.collateralDecimals
  )
  const takerAmount = parseEther(orderData.nbrOptions.toString())
  const order = new utils.LimitOrder({
    makerToken: orderData.makerToken,
    takerToken: orderData.takerToken,
    makerAmount: makerAmount.toString() as any,
    takerAmount: takerAmount.toString() as any,
    maker: orderData.makerAccount,
    sender: NULL_ADDRESS,
    expiry: getFutureExpiryInSeconds() as any,
    salt: Date.now().toString() as any,
    chainId: orderData.chainId,
    verifyingContract: zeroXAddresses[chainId].exchangeProxy,
  })

  try {
    const signature = await order.getSignatureWithProviderAsync(
      orderData.provider,
      utils.SignatureType.EIP712 // Optional
    )
    const signedOrder = { ...order, signature }
    const resp = await fetch(API0X, {
      method: 'POST',
      body: JSON.stringify(signedOrder),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (resp.status === 200) {
      alert('Successfully posted order to SRA')
    } else {
      const body = await resp.json()
      alert(
        `ERROR(status code ${resp.status}): ${JSON.stringify(
          body,
          undefined,
          2
        )}`
      )
    }
  } catch (error) {
    console.error('error ' + JSON.stringify(error))
    alert('You need to sign the order')
  }
}
