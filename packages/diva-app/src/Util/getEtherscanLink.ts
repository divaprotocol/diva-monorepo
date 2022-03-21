const ETHERSCAN_PREFIXES: { [chainId: number]: string } = {
  [1]: '',
  [3]: 'ropsten.',
  [4]: 'rinkeby.',
  [5]: 'goerli.',
  [42]: 'kovan.',
}

export enum EtherscanLinkType {
  TRANSACTION = 'transaction',
  ADDRESS = 'address',
}

export function getEtherscanLink(
  chainId = 3,
  address: string,
  type: EtherscanLinkType
): string {
  const prefix = `https://${ETHERSCAN_PREFIXES[chainId] ?? ''}etherscan.io`

  switch (type) {
    case EtherscanLinkType.TRANSACTION:
      return `${prefix}/tx/${address}`
    case EtherscanLinkType.ADDRESS:
      return `${prefix}/address/${address}`
    default:
      return `${prefix}`
  }
}
