import { parseUnits, splitSignature } from 'ethers/lib/utils'
import { NULL_ADDRESS } from './Config'
import { config } from '../constants'
import { TRADING_FEE_RECIPIENT, TRADING_FEE } from '../constants'
import { getFutureExpiryInSeconds } from '../Util/utils'
import { zeroXTypes, zeroXDomain } from '../lib/zeroX'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

export const buylimitOrder = async (orderData) => {
  const { chainId } = orderData
  const signer = orderData.provider.getSigner()
  const positionTokenUnit = parseUnits('1', orderData.collateralDecimals)
  const ZeroXChainContractAddress =
    contractAddress.getContractAddressesForChainOrThrow(chainId).exchangeProxy

  const nbrOptionsToBuy = orderData.nbrOptions

  // Derive the collateralTokenAmount (makerAmount in Buy Limit) from the user's nbrOptionsToBuy input.
  const collateralTokenAmount = nbrOptionsToBuy
    .mul(orderData.limitPrice) // limitPrice is expressed as an integer with collateral token decimals
    .div(positionTokenUnit) // correction factor in integer multiplication

  // Calculate trading fee amount (expressed as an integer with position token decimals).
  // NOTE: The fee is paid in position token which is the taker token in Buy Limit. In the context of DIVA,
  // this has the implication that for deep-out-of the money position tokens, the trading fee may end up being zero for the feeRecipient.
  const positionTokenFeeAmount = nbrOptionsToBuy
    .mul(parseUnits(TRADING_FEE.toString(), orderData.collateralDecimals)) // TODO: Revisit fee logic for trade mining program at a later stage
    .div(positionTokenUnit)

  // Get 0x API url to post order
  const networkUrl = config[orderData.chainId].order

  const order = {
    makerToken: orderData.makerToken,
    takerToken: orderData.takerToken,
    makerAmount: collateralTokenAmount.toString(),
    takerAmount: nbrOptionsToBuy.toString(),
    maker: orderData.maker,
    sender: NULL_ADDRESS,
    feeRecipient: TRADING_FEE_RECIPIENT,
    takerTokenFeeAmount: positionTokenFeeAmount.toString(),
    expiry: getFutureExpiryInSeconds(orderData.orderExpiry),
    salt: Date.now().toString(),
    chainId: orderData.chainId,
    verifyingContract: orderData.exchangeProxy,
    pool: '0x0000000000000000000000000000000000000000000000000000000000000000',
    taker: NULL_ADDRESS,
  }

  // TODO: Export this part into a separate function
  try {
    const signedTypedData = await signer._signTypedData(
      zeroXDomain({
        chainId: orderData.chainId,
        verifyingContract: ZeroXChainContractAddress,
      }),
      zeroXTypes,
      order
    )
    const { r, s, v } = splitSignature(signedTypedData)
    const signature = {
      v: v,
      r: r,
      s: s,
      signatureType: 2,
    }
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
