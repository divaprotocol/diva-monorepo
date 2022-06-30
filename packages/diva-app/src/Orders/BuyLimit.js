import { MetamaskSubprovider } from '@0x/subproviders'
import { parseUnits } from 'ethers/lib/utils'
import { NULL_ADDRESS } from './Config'
import { utils } from './Config'
import { config } from '../constants'
import { divaGovernanceAddress, tradingFee } from '../constants'
import { convertExponentialToDecimal } from '../component/Trade/Orders/OrderHelper'
import { getFutureExpiryInSeconds } from '../Util/utils'

export const buylimitOrder = async (orderData) => {
  const metamaskProvider = new MetamaskSubprovider(window.ethereum)

  // Define variables for integer math
  const decimals = orderData.collateralDecimals
  const unit = parseUnits('1')
  const scaling = parseUnits('1', 18 - decimals)

  // User input converted from decimal number into an integer with 18 decimals of type BigNumber
  const nbrOptionsToBuy = parseUnits(
    convertExponentialToDecimal(orderData.nbrOptions)
  )

  // Collateral token amount to give up / pay
  // TODO: In BuyLimit.tsx, adjust limitPrice to type BigNumber and in collateral token decimals
  const makerAmount = nbrOptionsToBuy.mul(orderData.limitPrice).div(unit) // mul(scaling).div(scaling) cancel out

  const takerAmount = parseUnits(orderData.nbrOptions.toString())
  const takerFeeAmount = takerAmount
    .mul(parseUnits(tradingFee.toString()))
    .div(parseUnits('1'))

  // Get 0x API url to post order
  const networkUrl = config[orderData.chainId].order

  // Construct order object
  const order = new utils.LimitOrder({
    makerToken: orderData.makerToken,
    takerToken: orderData.takerToken,
    makerAmount: makerAmount.toString(),
    takerAmount: nbrOptionsToBuy.toString(),
    maker: orderData.makerAccount,
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
  } catch (error) {
    console.error('error ' + JSON.stringify(error))
    alert('You need to sign the order')
  }
}
