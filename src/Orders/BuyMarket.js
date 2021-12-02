/**
 * Component to batch fill limit order
 *
 * Preparation:
 * To make this example work, you need to have two different ERC20 tokens on Polygon in your wallet and MATIC to pay for gas.
 * The makerToken (0xc03ce...) used in this example is a custom ERC20 token that was minted on Polygon. The takerToken (0x2791B...) is USDC on Polygon
 *
 * Notes:
 * - batchFillLimitOrder requires prior authorization of the 0x exchange contract to transfer maker and taker tokens.
 *   Use the ApproveMaker and ApproveTaker components to set the respective allowances.
 *
 *
 * Functionality:
 * TODO: Order response array is sorted by price before execution
 * TODO: Checks remainingFillableTakerAmount
 *
 * Resources/Links:
 * Check batchFillLimitOrder function defintion in: node_modules\@0x\contract-wrappers\lib\src\generated-wrappers\i_zero_ex.d.ts
 *
 * Trouble shooting:
 * 1. MetaMask - RPC Error: Invalid parameters: must provide an Ethereum address.
 * -> Reason: You are trying to fill the order with the same account that created it
 * 2. MetaMask - RPC Error: Provided chainId "137" must match the active chainId "3"
 * -> Your MetaMask wallet is not connected to the right chain
 * 3. Uncaught (in promise) Error: Expected revertIfIncomplete to be of type boolean, encountered: undefined
 * -> You are missing the fourth parameter in batchFillLimitOrder function (check function definition)
 */

import { IZeroExContract } from '@0x/contract-wrappers'
import { BigNumber } from '@0x/utils'
import * as qs from 'qs'
//import * as ERC20 from './ERC20.json'
import { CHAIN_ID } from './Config'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

export const buyMarketOrder = async (orderData) => {
  //const abi = orderData.ERC20_ABI
  const address = contractAddress.getContractAddressesForChainOrThrow(CHAIN_ID)
  const exchangeProxyAddress = address.exchangeProxy // 0xdef1c0ded9bec7f1a1670819833240f027b25eff (same for most chains including Mainnet, Ropsten and Polygon)
  // Connect to 0x exchange contract
  const exchange = new IZeroExContract(exchangeProxyAddress, window.ethereum)

  //let web3 = orderData.provider
  // Define parameters for API call (format: https://polygon.api.0x.org/orderbook/v1/orders?makerToken=0xc03ce38bc55836a4ef61ab570253cd7bfff3af44&takerToken=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174)
  const params = {
    makerToken: orderData.makerToken, // Polygon ERC20: 0xc03ce38bc55836a4ef61ab570253cd7bfff3af44, Ropsten ERC20: 0x32de47Fc9bc48F4c56f9649440532081466036A2
    takerToken: orderData.takerToken, // Collateral token: Polygon USDC: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174, Ropsten DAI: 0xaD6D458402F60fD3Bd25163575031ACDce07538D
  }

  // Issue API request and fetch JSON response
  const res = await fetch(
    `https://ropsten.api.0x.org/orderbook/v1/orders?${qs.stringify(params)}`
  )
  console.log(
    'url ' +
      `https://ropsten.api.0x.org/orderbook/v1/orders?${qs.stringify(params)}`
  )
  const resJSON = await res.json()
  console.log('Response ' + JSON.stringify(resJSON))
  // Fetch first order object in records JSON object array
  let orders = []
  let signatures = []
  let responseOrder
  try {
    responseOrder = resJSON['records']
    // Separate signature from the rest of the response object as they are required as separate inputs in fillLimitOrder (see below)
    const aux = responseOrder.map((item) => item.order)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    orders = aux.map(({ signature, ...rest }) => rest)
    signatures = aux.map(({ signature }) => signature)
  } catch (err) {
    alert('No orders found')
    console.log(err)
    return
  }

  // Set taker amount
  //const makerAmount = responseOrder.makerAmount
  //const takerAmount = responseOrder.takerAmount
  //expected rate
  //const expectedRate = takerAmount / makerAmount
  //const youPay = expectedRate * orderData.nbrOptions
  const takerFillNbrOptions = new BigNumber(orderData.nbrOptions * 10 ** 18)

  // const takerFillAmount2 = new BigNumber(200)
  //   const takerFillAmount3 = new BigNumber(300)

  // Serialize an array of three BigNumbers
  const str = JSON.stringify([takerFillNbrOptions])
  // Return an array of three BigNumbers
  const takerAssetFillAmounts = JSON.parse(str, function (key, val) {
    return key === '' ? val : new BigNumber(val)
  })

  console.log(takerAssetFillAmounts)

  // TODO Handle sum(takerAssetAmountFillAmounts) > remainingFillable amount

  // Batch fill limit order
  await exchange
    .batchFillLimitOrders(orders, signatures, takerAssetFillAmounts, true)
    .awaitTransactionSuccessAsync({ from: orderData.takerAccount })
    .catch((err) => console.error(err))
}
