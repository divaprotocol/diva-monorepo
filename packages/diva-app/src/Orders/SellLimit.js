import { MetamaskSubprovider } from '@0x/subproviders'
import { parseUnits } from 'ethers/lib/utils'
import { NULL_ADDRESS } from './Config'
import { utils } from './Config'
import { config } from '../constants'
import { divaGovernanceAddress, tradingFee } from '../constants'
import { convertExponentialToDecimal } from '../component/Trade/Orders/OrderHelper'
import { getFutureExpiryInSeconds } from '../Util/utils'

export const sellLimitOrder = async (orderData) => {
  const metamaskProvider = new MetamaskSubprovider(window.ethereum)

  // Define variables for integer math
  const decimals = orderData.collateralDecimals
  const unit = parseUnits('1')
  const scaling = parseUnits('1', 18 - decimals)

  // User input converted from decimal number into an integer with 18 decimals of type BigNumber
  const nbrOptionsToSell = parseUnits(
    convertExponentialToDecimal(orderData.nbrOptions)
  )

  // Collateral token amount to receive
  // TODO: In SellLimit.tsx, adjust limitPrice to type BigNumber and in collateral token decimals
  const takerAmount = nbrOptionsToSell
    .mul(orderData.limitPrice) // limitPrice is expressed as an integer with collateral token decimals
    .mul(scaling) // scale up to 18 decimals
    .div(unit) // "correct" for integer multiplication

  // Calculate trading fee amount (in collateral token decimals)
  const takerFeeAmount = takerAmount
    .mul(parseUnits(tradingFee.toString(), orderData.collateralDecimals))
    .div(parseUnits('1', orderData.collateralDecimals))

  // Get 0x API url to post order
  const networkUrl = config[orderData.chainId].order

  // Construct order object
  const order = new utils.LimitOrder({
    makerToken: orderData.makerToken,
    takerToken: orderData.takerToken,
    makerAmount: nbrOptionsToSell.toString(),
    takerAmount: takerAmount.toString(),
    maker: orderData.maker,
    sender: NULL_ADDRESS,
    feeRecipient: divaGovernanceAddress,
    takerTokenFeeAmount: takerFeeAmount.toString(),
    expiry: getFutureExpiryInSeconds(orderData.orderExpiry),
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
