import ethereumLogoUrl from './Images/ethereum-logo.png'
import polygonMaticLogo from './Images/polygon-matic-logo.svg'
import arbitrumLogoUrl from './Images/arbitrum_logo.svg'

export enum SupportedChainId {
  ROPSTEN = 3,
  MAINNET = 1,
  GOERLI = 5,
  POLYGON = 137,
  POLYGON_MUMBAI = 80001,
  ARBITRUM_ONE = 42161,
}

type SingleConfig = {
  readonly name: string
  readonly divaAddress: string
  readonly balanceCheckAddress: string
  readonly whitelistAddress: string
  readonly divaSubgraph: string
  readonly whitelistSubgraph: string
  readonly allOrders: string
  readonly order: string
  readonly explorer: string
  readonly logoUrl: string
  readonly nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  readonly isSupported: boolean
}

export const projectId = '9f5f0ef1c7544c029b0aa9ca622759c3'

export const config: { [key: number]: SingleConfig } = {
  [SupportedChainId.MAINNET]: {
    name: 'Ethereum',
    divaAddress: '',
    balanceCheckAddress: '',
    whitelistAddress: '',
    divaSubgraph: '',
    whitelistSubgraph: '',
    allOrders: '',
    order: '',
    explorer: 'https://etherscan.io/',
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isSupported: false,
  },
  [SupportedChainId.ROPSTEN]: {
    name: 'Ropsten',
    divaAddress: '0xebBAA31B1Ebd727A1a42e71dC15E304aD8905211',
    balanceCheckAddress: '0xD713aeC2156709A6AF392bb84018ACc6b44f1885',
    whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-ropsten',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-ropsten',
    allOrders: 'https://ropsten.api.0x.org/orderbook/v1/orders/',
    order: 'https://ropsten.api.0x.org/orderbook/v1/order/',
    explorer: 'https://ropsten.etherscan.io/',
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: 'Ropsten Ether', symbol: 'ropETH', decimals: 18 },
    isSupported: true,
  },
  [SupportedChainId.GOERLI]: {
    divaAddress: '',
    balanceCheckAddress: '',
    whitelistAddress: '',
    divaSubgraph: '',
    whitelistSubgraph: '',
    allOrders: '',
    order: '',
    explorer: 'https://goerli.etherscan.io/',
    name: 'Görli',
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: 'Görli Ether', symbol: 'görETH', decimals: 18 },
    isSupported: false,
  },
  [SupportedChainId.POLYGON]: {
    name: 'Polygon',
    divaAddress: '',
    balanceCheckAddress: '',
    whitelistAddress: '',
    divaSubgraph: '',
    whitelistSubgraph: '',
    allOrders: '',
    order: '',
    explorer: 'https://polygonscan.com/',
    logoUrl: polygonMaticLogo,
    nativeCurrency: { name: 'Polygon Matic', symbol: 'MATIC', decimals: 18 },
    isSupported: false,
  },
  [SupportedChainId.POLYGON_MUMBAI]: {
    name: 'Mumbai',
    divaAddress: '',
    balanceCheckAddress: '',
    whitelistAddress: '',
    divaSubgraph: '',
    whitelistSubgraph: '',
    allOrders: '',
    order: '',
    explorer: 'https://mumbai.polygonscan.com/',
    logoUrl: polygonMaticLogo,
    nativeCurrency: {
      name: 'Polygon Mumbai Matic',
      symbol: 'mMATIC',
      decimals: 18,
    },
    isSupported: false,
  },
  [SupportedChainId.ARBITRUM_ONE]: {
    explorer: 'https://arbiscan.io/',
    name: 'Arbitrum',
    logoUrl: arbitrumLogoUrl,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    divaAddress: '',
    whitelistAddress: '',
    divaSubgraph: '',
    whitelistSubgraph: '',
    allOrders: '',
    order: '',
    balanceCheckAddress: '',
    isSupported: false,
  },
  // 4: {
  //   name: 'Rinkeby',
  //   divaAddress: '0x3481C73363b52a26068b1C7006CEF98670FEE514',
  //   whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
  //   divaSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-rinkeby',
  //   whitelistSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-rinkeby',
  //   allOrders: 'https://rinkeby.api.0x.org/orderbook/v1/orders/',
  //   order: 'https://rinkeby.api.0x.org/orderbook/v1/order/',
  // },
  // 42: {
  //   name: 'Kovan',
  //   divaAddress: '0x69E0577cAd908D9098F36dfbC4Ec36ad09920F4b',
  //   whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
  //   divaSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-kovan',
  //   whitelistSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-kovan',
  //   allOrders: 'https://kovan.api.0x.org/orderbook/v1/orders/',
  //   order: 'https://kovan.api.0x.org/orderbook/v1/order/',
  // },
}

// array of all chains id
export const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[] = Object.values(
  SupportedChainId
).filter((id) => typeof id === 'number') as SupportedChainId[]

// current supported chain
export const CURRENT_SUPPORTED_CHAIN_ID = [SupportedChainId.ROPSTEN]

export const divaGovernanceAddress =
  '0xBb0F479895915F80f6fEb5BABcb0Ad39a0D7eF4E' // creator of pools on Main Markets page and trading fee recipient
