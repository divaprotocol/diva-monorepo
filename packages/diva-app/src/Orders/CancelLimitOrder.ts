import { MetamaskSubprovider } from '@0x/subproviders'
import { IZeroExContract } from '@0x/contract-wrappers'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

export const cancelLimitOrder = async (orderData, chainId) => {
  delete orderData.order.signature
  const order = orderData.order
  const address = contractAddress.getContractAddressesForChainOrThrow(chainId)
  const exchangeProxyAddress = address.exchangeProxy
  const supportedProvider = new MetamaskSubprovider(window.web3.currentProvider)
  const exchange = new IZeroExContract(
    exchangeProxyAddress,
    supportedProvider,
    {
      from: order.maker,
    }
  )

  const response = await exchange
    .cancelLimitOrder(order)
    .awaitTransactionSuccessAsync()
    .catch(async (err) => console.error('Error logged ' + JSON.stringify(err)))
  return response
}