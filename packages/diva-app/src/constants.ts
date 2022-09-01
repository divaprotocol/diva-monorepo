import ethereumLogoUrl from './Images/ethereum-logo.png'
import polygonMaticLogo from './Images/polygon-matic-logo.svg'
import arbitrumLogoUrl from './Images/arbitrum_logo.svg'
import divaLogo from './Images/logo.svg'
import divaSidebarLogo from './Images/diva-sidebar-logo.svg'
import divaTextLogo from './Images/diva_logo_text.svg'
import { Add, Person, ShowChartOutlined } from '@mui/icons-material'
import TaskIcon from '@mui/icons-material/Task'

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
  readonly exchangeProxy: string
  readonly whitelistAddress: string
  readonly divaSubgraph: string
  readonly whitelistSubgraph: string
  readonly allOrders: string
  readonly order: string
  readonly orderbook: string
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
    exchangeProxy: '',
    whitelistAddress: '',
    divaSubgraph: '',
    whitelistSubgraph: '',
    allOrders: '',
    order: '',
    orderbook: '',
    explorer: 'https://etherscan.io/',
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isSupported: false,
  },
  [SupportedChainId.ROPSTEN]: {
    name: 'Ropsten',
    divaAddress: '0xebBAA31B1Ebd727A1a42e71dC15E304aD8905211',
    balanceCheckAddress: '0xD713aeC2156709A6AF392bb84018ACc6b44f1885',
    exchangeProxy: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
    whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-ropsten',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-ropsten',
    allOrders: 'https://ropsten.api.0x.org/orderbook/v1/orders/',
    order: 'https://ropsten.api.0x.org/orderbook/v1/order/',
    orderbook: 'https://ropsten.api.0x.org/orderbook/v1',
    explorer: 'https://ropsten.etherscan.io/',
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: 'Ropsten Ether', symbol: 'ropETH', decimals: 18 },
    isSupported: false,
  },
  [SupportedChainId.GOERLI]: {
    divaAddress: '0x8f138cfC5de71FCde7FdeCd87EAC6Aa6A536Bf85',
    balanceCheckAddress: '0x9293ff9733AC7666A8251564C083191c3DA8BE19',
    exchangeProxy: '0xf91bb752490473b8342a3e964e855b9f9a2a668e',
    whitelistAddress: '0x017aA6E15e406b85b8b1dF322e39444D819C8F43',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-goerli',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-goerli',
    allOrders: 'http://18.206.87.23/orderbook/v1/orders/',
    order: 'http://18.206.87.23/orderbook/v1/order/',
    orderbook: 'http://18.206.87.23/orderbook/v1',
    explorer: 'https://goerli.etherscan.io/',
    name: 'Görli',
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: 'Görli Ether', symbol: 'görETH', decimals: 18 },
    isSupported: true,
  },
  [SupportedChainId.POLYGON]: {
    name: 'Polygon',
    divaAddress: '',
    balanceCheckAddress: '',
    exchangeProxy: '',
    whitelistAddress: '',
    divaSubgraph: '',
    whitelistSubgraph: '',
    allOrders: '',
    order: '',
    orderbook: '',
    explorer: 'https://polygonscan.com/',
    logoUrl: polygonMaticLogo,
    nativeCurrency: { name: 'Polygon Matic', symbol: 'MATIC', decimals: 18 },
    isSupported: false,
  },
  [SupportedChainId.POLYGON_MUMBAI]: {
    name: 'Mumbai',
    divaAddress: '',
    balanceCheckAddress: '',
    exchangeProxy: '',
    whitelistAddress: '',
    divaSubgraph: '',
    whitelistSubgraph: '',
    allOrders: '',
    order: '',
    orderbook: '',
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
    name: 'Arbitrum',
    divaAddress: '',
    balanceCheckAddress: '',
    exchangeProxy: '',
    whitelistAddress: '',
    divaSubgraph: '',
    whitelistSubgraph: '',
    allOrders: '',
    order: '',
    orderbook: '',
    explorer: 'https://arbiscan.io/',
    logoUrl: arbitrumLogoUrl,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isSupported: false,
  },
}

// array of all chains id
export const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[] = Object.values(
  SupportedChainId
).filter((id) => typeof id === 'number') as SupportedChainId[]

// current supported chain
export const CURRENT_SUPPORTED_CHAIN_ID = [SupportedChainId.GOERLI]

export const divaGovernanceAddress =
  '0xBb0F479895915F80f6fEb5BABcb0Ad39a0D7eF4E' // creator of pools on Main Markets page and trading fee recipient

export const tradingFee = 0.01 // 1%

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export const ICONS_URL = {
  diva: divaLogo,
  divaSidebarLogo: divaSidebarLogo,
  divaTextLogo: divaTextLogo,
}

export const APP_BAR_ITEMS = [
  {
    label: 'Markets',
    to: '/',
    icon: ShowChartOutlined,
    isRoot: true,
  },
  {
    label: 'My Dashboard',
    to: '/dashboard/mypositions',
    icon: Person,
  },
  {
    label: 'Create',
    to: '/Create',
    icon: Add,
  },
  {
    label: 'Testnet Tasks',
    to: '/tasks',
    icon: TaskIcon,
  },
]
