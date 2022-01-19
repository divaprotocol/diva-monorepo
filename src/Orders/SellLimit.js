import { contractAddresses } from './Config'
import { NULL_ADDRESS } from './Config'
import { CHAIN_ID } from './Config'
import { utils } from './Config'
import { metamaskProvider } from './Config'
import { ROPSTEN } from './Config'

export const sellLimitOrder = async (orderData) => {
  const getFutureExpiryInSeconds = () => {
    return Math.floor(Date.now() / 1000 + orderData.orderExpiry * 60).toString()
  }

  const order = new utils.LimitOrder({
    makerToken: orderData.makerToken,
    takerToken: orderData.takerToken,
    makerAmount: (orderData.nbrOptions * 10 ** 18).toString(),
    takerAmount: (
      orderData.nbrOptions *
      orderData.limitPrice *
      10 ** orderData.collateralDecimals
    ).toString(),
    maker: orderData.maker,
    sender: NULL_ADDRESS,
    expiry: getFutureExpiryInSeconds(),
    salt: Date.now().toString(),
    chainId: CHAIN_ID,
    verifyingContract: contractAddresses.exchangeProxy,
  })

  console.log('Sell ' + JSON.stringify(order))
  try {
    const signature = await order.getSignatureWithProviderAsync(
      metamaskProvider,
      utils.SignatureType.EIP712 // Optional
    )
    const signedOrder = { ...order, signature }
    const resp = await fetch(ROPSTEN, {
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
  } catch (e) {
    alert('You need to sign the order')
  }
}
