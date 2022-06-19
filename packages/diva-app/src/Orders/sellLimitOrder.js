import { MetamaskSubprovider } from '@0x/subproviders'
import { parseEther, parseUnits } from 'ethers/lib/utils'
import { NULL_ADDRESS } from './Config'
import { utils } from './Config'
import { config } from '../constants'
import { isFloat, decimalPlaces } from '../component/Trade/Orders/OrderHelper'

export const sellLimitOrder = async (orderData) => {
  const getFutureExpiryInSeconds = () => {
    return Math.floor(Date.now() / 1000 + orderData.orderExpiry * 60).toString()
  }

  const metamaskProvider = new MetamaskSubprovider(window.ethereum)

  const makerAmount = parseEther(orderData.nbrOptions.toString())
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

  const takerAmount = parseUnits(
    amount.toString(),
    orderData.collateralDecimals
  )
  const networkUrl = config[orderData.chainId].order
  const order = new utils.LimitOrder({
    makerToken: orderData.makerToken,
    takerToken: orderData.takerToken,
    makerAmount: makerAmount.toString(),
    takerAmount: takerAmount.toString(),
    maker: orderData.maker,
    sender: NULL_ADDRESS,
    feeRecipient: '0xBb0F479895915F80f6fEb5BABcb0Ad39a0D7eF4E',
    expiry: getFutureExpiryInSeconds(),
    salt: Date.now().toString(),
    chainId: orderData.chainId,
    verifyingContract: orderData.exchangeProxy,
  })

  try {
    const signature = await order.getSignatureWithProviderAsync(
      metamaskProvider,
      utils.SignatureType.EIP712 // Optional
    )
    const signedOrder = { ...order, signature }
    console.log(
      JSON.stringify({ signedOrder, typedData: order.getEIP712TypedData() })
    )
    const resp = await fetch(networkUrl, {
      method: 'POST',
      body: JSON.stringify(signedOrder),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (resp.status === 200) {
      alert('Order successfully created')
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
    return resp
  } catch (e) {
    console.error(e)
    alert('You need to sign the order')
  }
}
