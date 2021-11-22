export enum Network {
  MAINNET = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GOERLI = 5,
  KOTTI = 6,
  KOVAN = 42,
  xDAI = 100,
}

export function chainIdtoName(networkId?: Network) {
  if (!networkId) return 'Mainnet'

  switch (Number(networkId)) {
    case 1:
      return 'Mainnet'
    case 3:
      return 'Ropsten'
    case 4:
      return 'Rinkeby'
    case 5:
      return 'Goerli'
    case 6:
      return 'Kotti'
    case 42:
      return 'Kovan'
    case 100:
      return 'xDai'
    default:
      return 'localhost'
  }
}
