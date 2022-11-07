import { MetamaskSubprovider } from '@0x/subproviders'
import { parseUnits } from 'ethers/lib/utils'
import { NULL_ADDRESS } from './Config'
import { utils } from './Config'
import { config } from '../constants'
import { divaGovernanceAddress, tradingFee } from '../constants'
import { getFutureExpiryInSeconds } from '../Util/utils'

export const buylimitOrder = async (orderData) => {
  const metamaskProvider = new MetamaskSubprovider(window.ethereum)

  const positionTokenUnit = parseUnits('1', orderData.collateralDecimals)

  const nbrOptionsToBuy = orderData.nbrOptions

  // Derive the collateralTokenAmount (makerAmount in Buy Limit) from the user's nbrOptionsToBuy input.
  const collateralTokenAmount = nbrOptionsToBuy
    .mul(orderData.limitPrice) // limitPrice is expressed as an integer with collateral token decimals
    .div(positionTokenUnit) // correction factor in integer multiplication

  // Calculate trading fee amount (expressed as an integer with position token decimals).
  // NOTE: The fee is paid in position token which is the taker token in Buy Limit. In the context of DIVA,
  // this has the implication that for deep-out-of the money position tokens, the trading fee may end up being zero for the feeRecipient.
  const positionTokenFeeAmount = nbrOptionsToBuy
    .mul(parseUnits(tradingFee.toString(), orderData.collateralDecimals)) // TODO: Revisit fee logic for trade mining program at a later stage
    .div(positionTokenUnit)

  // Get 0x API url to post order
  const networkUrl = config[orderData.chainId].order

  // Construct order object
  const order = new utils.LimitOrder({
    makerToken: orderData.makerToken,
    takerToken: orderData.takerToken,
    makerAmount: collateralTokenAmount.toString(),
    takerAmount: nbrOptionsToBuy.toString(),
    maker: orderData.maker,
    sender: NULL_ADDRESS,
    feeRecipient: divaGovernanceAddress,
    takerTokenFeeAmount: positionTokenFeeAmount.toString(),
    expiry: getFutureExpiryInSeconds(orderData.orderExpiry),
    salt: Date.now().toString(),
    chainId: orderData.chainId,
    verifyingContract: orderData.exchangeProxy,
  })

  // TODO: Export this part into a separate function
  try {
    const signature = await order.getSignatureWithProviderAsync(
      metamaskProvider,
      utils.SignatureType.EIP712 // Optional
    )
    const poolId = orderData.poolId
    const signedOrder = { ...order, signature, poolId }

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
  } catch (error) {
    console.error('error ' + JSON.stringify(error))
    alert('You need to sign the order')
  }
}
