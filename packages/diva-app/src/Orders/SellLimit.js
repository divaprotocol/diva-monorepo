import { MetamaskSubprovider } from '@0x/subproviders'
import { parseUnits } from 'ethers/lib/utils'
import { NULL_ADDRESS } from './Config'
import { utils } from './Config'
import { config } from '../constants'
import { divaGovernanceAddress, tradingFee } from '../constants'
import { getFutureExpiryInSeconds } from '../Util/utils'

export const sellLimitOrder = async (orderData) => {
  const metamaskProvider = new MetamaskSubprovider(window.ethereum)

  const collateralTokenUnit = parseUnits('1', orderData.collateralDecimals)
  const positionTokenUnit = parseUnits('1')

  const nbrOptionsToSell = orderData.nbrOptions

  // Derive the collateralTokenAmount (takerAmount in Sell Limit) from the user's nbrOptionsToSell input.
  const collateralTokenAmount = nbrOptionsToSell
    .mul(orderData.limitPrice) // limitPrice is expressed as an integer with collateral token decimals
    .div(positionTokenUnit) // correction factor in integer multiplication

  // Calculate trading fee amount (expressed as an integer with collateral token decimals)
  // Note that the fee is paid in collateral token which is the taker token in Sell Limit
  const collateralTokenFeeAmount = collateralTokenAmount
    .mul(parseUnits(tradingFee.toString(), orderData.collateralDecimals)) // TODO: Revisit fee logic for trade mining program at a later stage
    .div(collateralTokenUnit)

  // Get 0x API url to post order
  const networkUrl = config[orderData.chainId].order

  console.log('ordeorderData.limitPricer', orderData.limitPrice.toString())
  console.log('makerAmount', nbrOptionsToSell.toString())
  console.log('takerAmount', collateralTokenAmount.toString())

  // Construct order object
  const order = new utils.LimitOrder({
    makerToken: orderData.makerToken,
    takerToken: orderData.takerToken,
    makerAmount: nbrOptionsToSell.toString(),
    takerAmount: collateralTokenAmount.toString(),
    maker: orderData.maker,
    sender: NULL_ADDRESS,
    feeRecipient: divaGovernanceAddress,
    takerTokenFeeAmount: collateralTokenFeeAmount.toString(),
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
  } catch (error) {
    console.error('error ' + JSON.stringify(error))
    alert('You need to sign the order')
  }
}
