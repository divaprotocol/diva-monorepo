import * as ContractAddresses from '@0x/contract-addresses'
import { MetamaskSubprovider } from '@0x/subproviders'
import * as utils from '@0x/protocol-utils'

export { utils }
export const CHAIN_ID = 3
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
export const contractAddresses =
  ContractAddresses.getContractAddressesForChainOrThrow(CHAIN_ID)
export const ROPSTEN = 'https://ropsten.api.0x.org/sra/v4/order'
export const metamaskProvider = new MetamaskSubprovider(
  window.web3.currentProvider
)
