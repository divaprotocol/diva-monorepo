import { contractAddresses } from './Config'
import { parseEther, parseUnits } from 'ethers/lib/utils'
import { NULL_ADDRESS } from './Config'
import { CHAIN_ID } from './Config'
import { utils } from './Config'
import { metamaskProvider } from './Config'
import { ROPSTEN, POLYGON } from './Config'
import { IZeroExContract } from '@0x/contract-wrappers'
import { MetamaskSubprovider } from '@0x/subproviders'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

export const sellLimitOrder = async (orderData) => {
  const getFutureExpiryInSeconds = () => {
    return Math.floor(Date.now() / 1000 + orderData.orderExpiry * 60).toString()
  }

  const isFloat = (number) => {
    return number != '' && !isNaN(number) && Math.round(number) != number
  }
  const decimalPlaces = (number) => {
    return number.toString().split('.')[1].length
  }
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

  const order = new utils.LimitOrder({
    makerToken: orderData.makerToken,
    takerToken: orderData.takerToken,
    makerAmount: makerAmount.toString(),
    takerAmount: takerAmount.toString(),
    maker: orderData.maker,
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
    const resp = await fetch(POLYGON, {
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
    alert('You need to sign the order')
  }
}

/**
 * 
 * const response = await exchange
      .batchFillLimitOrders(orders, signatures, takerAssetFillAmounts, true)
      .awaitTransactionSuccessAsync({ from: orderData.maker })
      .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
    return response} orderData 
    orders.map(function (order) {
      signatures.push(order.signature)
      delete order.signature
      return order
    })
 */

export const cancelSellLimitOrder = async (orderData) => {
  delete orderData.order.signature
  let order = orderData.order
  //order = JSON.stringify(order)

  const address = contractAddress.getContractAddressesForChainOrThrow(CHAIN_ID)
  const exchangeProxyAddress = address.exchangeProxy

  const supportedProvider = new MetamaskSubprovider(window.web3.currentProvider)

  const exchange = new IZeroExContract(
    exchangeProxyAddress,
    supportedProvider,
    {
      from: order.maker,
    }
  )
  //const exchange = new IZeroExContract(exchangeProxyAddress, window.ethereum)
  console.log('order maker' + order)
  const response = await exchange
    .cancelLimitOrder(order)
    .awaitTransactionSuccessAsync()
    .catch((err) => console.error('Error logged ' + JSON.stringify(err)))
  console.log('response ' + JSON.stringify(response))
  alert('order canceled')
  /*if (!('logs' in response)) {
    alert('order could not be filled')
    return
  } else {
    response.logs.forEach((eventData) => {
      if (!('event' in eventData)) {
        return
      } else {
        if (eventData.event === 'OrderCancelled') {
          alert('Order Canceled ')
        } else {
          alert('order could not be canceled')
        }
      }
    })
  }*/
}
