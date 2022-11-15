// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
import { ethers } from 'ethers'
import ZEROX_ABI from '../abi/IZeroX.json'

export const cancelLimitOrder = async (orderData, chainId, provider) => {
  const signer = provider.getSigner()
  const exchangeProxyAddress =
    contractAddress.getContractAddressesForChainOrThrow(chainId).exchangeProxy
  const cancel = new ethers.Contract(exchangeProxyAddress, ZEROX_ABI, signer)

  delete orderData.order.signature
  const order = orderData.order
  try {
    const response = await cancel.cancelLimitOrder(order)
    //check the status of the transaction
    await provider.waitForTransaction(response.hash)
    return response
  } catch (err) {
    console.error('Error logged ' + JSON.stringify(err))
    return err
  }
}
