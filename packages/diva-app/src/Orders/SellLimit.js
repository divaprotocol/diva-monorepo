import { parseUnits, splitSignature } from 'ethers/lib/utils'
import { NULL_ADDRESS } from './Config'
import { utils } from './Config'
import { config } from '../constants'
import { TRADING_FEE_RECIPIENT, TRADING_FEE } from '../constants'
import { getFutureExpiryInSeconds } from '../Util/utils'
import { zeroXTypes, zeroXDomain } from '../lib/zeroX'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

export const sellLimitOrder = async (orderData) => {
  const { chainId } = orderData
  const signer = orderData.provider.getSigner()
  const ZeroXChainContractAddress =
    contractAddress.getContractAddressesForChainOrThrow(chainId).exchangeProxy

  const collateralTokenUnit = parseUnits('1', orderData.collateralDecimals)

  const nbrOptionsToSell = orderData.nbrOptions

  // Derive the collateralTokenAmount (takerAmount in Sell Limit) from the user's nbrOptionsToSell input.
  const collateralTokenAmount = nbrOptionsToSell
    .mul(orderData.limitPrice) // limitPrice is expressed as an integer with collateral token decimals
    .div(collateralTokenUnit) // correction factor in integer multiplication

  // Calculate trading fee amount (expressed as an integer with collateral token decimals)
  // Note that the fee is paid in collateral token which is the taker token in Sell Limit
  const collateralTokenFeeAmount = collateralTokenAmount
    .mul(parseUnits(TRADING_FEE.toString(), orderData.collateralDecimals))
    .div(collateralTokenUnit)

  // Get 0x API url to post order
  const networkUrl = config[orderData.chainId].order

  // Construct order object
  const order = new utils.LimitOrder({
    makerToken: orderData.makerToken,
    takerToken: orderData.takerToken,
    makerAmount: nbrOptionsToSell.toString(),
    takerAmount: collateralTokenAmount.toString(),
    maker: orderData.maker,
    sender: NULL_ADDRESS,
    feeRecipient: TRADING_FEE_RECIPIENT,
    takerTokenFeeAmount: collateralTokenFeeAmount.toString(),
    expiry: getFutureExpiryInSeconds(orderData.orderExpiry),
    salt: Date.now().toString(),
    chainId: orderData.chainId,
    verifyingContract: orderData.exchangeProxy,
    pool: '0x0000000000000000000000000000000000000000000000000000000000000000',
    taker: NULL_ADDRESS,
  })

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
