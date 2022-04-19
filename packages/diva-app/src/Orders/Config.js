import { MetamaskSubprovider } from '@0x/subproviders'
import * as utils from '@0x/protocol-utils'

export { utils }
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
export const metamaskProvider = new MetamaskSubprovider(
  window.web3.currentProvider
)
