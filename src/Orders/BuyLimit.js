import { contractAddresses } from './Config'
import { NULL_ADDRESS } from './Config'
import { utils } from './Config'
import { metamaskProvider } from './Config'
import { ROPSTEN } from './Config'

export const buylimitOrder = async (orderData) => {
  const getFutureExpiryInSeconds = () => {
    return Math.floor(Date.now() / 1000 + orderData.orderExpiry * 60).toString()
  }

  const order = new utils.LimitOrder({
    makerToken: orderData.makerToken,
    takerToken: orderData.takerToken,
    makerAmount: (
      orderData.nbrOptions *
      orderData.limitPrice *
      10 ** orderData.collateralDecimals
    ).toString(), // NOTE: This is 1 WEI, 1 ETH would be 1000000000000000000
    takerAmount: (orderData.nbrOptions * 10 ** 18).toString(), // NOTE this is 0.001 ZRX. 1 ZRX would be 1000000000000000000
    maker: orderData.makerAccount,
    sender: NULL_ADDRESS,
    expiry: getFutureExpiryInSeconds(),
    salt: Date.now().toString(),
    chainId: orderData.chainId,
    verifyingContract: contractAddresses.exchangeProxy,
  })

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
  } catch (error) {
    console.error('error ' + JSON.stringify(error))
    alert('You need to sign the order')
  }
}
