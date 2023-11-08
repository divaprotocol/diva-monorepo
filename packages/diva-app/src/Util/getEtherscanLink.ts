import { config } from '../constants'

export enum EtherscanLinkType {
  TRANSACTION = 'transaction',
  ADDRESS = 'address',
}

export function getExploreLink(
  chainId = 5, // QUESTION Is this the default value?
  address: string,
  type: EtherscanLinkType
): string {
  const prefix = config[chainId].explorer

  switch (type) {
    case EtherscanLinkType.TRANSACTION:
      return `${prefix}/tx/${address}`
    case EtherscanLinkType.ADDRESS:
      return `${prefix}/token/${address}`
    default:
      return `${prefix}`
  }
}
