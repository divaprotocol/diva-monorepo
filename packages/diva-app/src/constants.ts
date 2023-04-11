import ethereumLogoUrl from './Images/ethereum-logo.png'
import polygonMaticLogo from './Images/polygon-matic-logo.svg'
import arbitrumLogoUrl from './Images/arbitrum_logo.svg'
import divaLogo from './Images/logo.svg'
import divaSidebarLogo from './Images/diva-sidebar-logo.svg'
import divaTextLogo from './Images/diva_logo_text.svg'
import { Add, Person, ShowChartOutlined } from '@mui/icons-material'
import TaskIcon from '@mui/icons-material/Task'
import metamaskLogo from './Images/meta-mask-logo.png'
import walletConnectLogo from './Images/wallet-connect-logo.png'

const CREATE_POOL_OFFER_STRUCT = [
  { type: 'address', name: 'maker' },
  { type: 'address', name: 'taker' },
  { type: 'uint256', name: 'makerCollateralAmount' },
  { type: 'uint256', name: 'takerCollateralAmount' },
  { type: 'bool', name: 'makerIsLong' },
  { type: 'uint256', name: 'offerExpiry' },
  { type: 'uint256', name: 'minimumTakerFillAmount' },
  { type: 'string', name: 'referenceAsset' },
  { type: 'uint96', name: 'expiryTime' },
  { type: 'uint256', name: 'floor' },
  { type: 'uint256', name: 'inflection' },
  { type: 'uint256', name: 'cap' },
  { type: 'uint256', name: 'gradient' },
  { type: 'address', name: 'collateralToken' },
  { type: 'address', name: 'dataProvider' },
  { type: 'uint256', name: 'capacity' },
  { type: 'address', name: 'permissionedERC721Token' },
  { type: 'uint256', name: 'salt' },
]

export const CREATE_POOL_TYPE = {
  OfferCreateContingentPool: CREATE_POOL_OFFER_STRUCT,
}

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
  readonly balanceCheckerAddress: string
  readonly exchangeProxy: string
  readonly whitelistAddress: string
  readonly divaSubgraph: string
  readonly whitelistSubgraph: string
  readonly allOrders: string
  readonly order: string
  readonly offer: string
  readonly orderbook: string
  readonly explorer: string
  readonly websocket: string
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
    balanceCheckerAddress: '',
    exchangeProxy: '',
    whitelistAddress: '',
    divaSubgraph: '',
    whitelistSubgraph: '',
    allOrders: '',
    order: '',
    offer: '',
    orderbook: '',
    websocket: '',
    explorer: 'https://etherscan.io/',
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isSupported: false,
  },
  [SupportedChainId.ROPSTEN]: {
    name: 'Ropsten',
    divaAddress: '',
    balanceCheckerAddress: '0xD713aeC2156709A6AF392bb84018ACc6b44f1885',
    exchangeProxy: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
    whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-ropsten',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-ropsten',
    allOrders: 'https://ropsten.api.0x.org/orderbook/v1/orders/',
    order: 'https://ropsten.api.0x.org/orderbook/v1/order/',
    offer: '',
    orderbook: 'https://ropsten.api.0x.org/orderbook/v1',
    websocket: '',
    explorer: 'https://ropsten.etherscan.io/',
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: 'Ropsten Ether', symbol: 'ropETH', decimals: 18 },
    isSupported: true,
  },
  [SupportedChainId.GOERLI]: {
    divaAddress: '0xa6E26dbA7aA0d065b3C866Bb61B4AeF3Bb9d4874', // 26.02.2023
    balanceCheckerAddress: '0x9293ff9733AC7666A8251564C083191c3DA8BE19',
    exchangeProxy: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
    whitelistAddress: '0x017aA6E15e406b85b8b1dF322e39444D819C8F43',
    divaSubgraph:
      'https://api.studio.thegraph.com/query/14411/diva-goerli-230226/0.0.1',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-goerli',
    allOrders: 'https://goerli.eip712api.xyz/0x/orderbook/v1/orders/',
    order: 'https://goerli.eip712api.xyz/0x/orderbook/v1/order/',
    orderbook: 'https://goerli.eip712api.xyz/0x/orderbook/v1',
    offer: 'https://goerli.eip712api.xyz/diva/offer/v1/',
    websocket: 'wss://goerli.eip712api.xyz/websocket',
    explorer: 'https://goerli.etherscan.io/',
    name: 'Görli',
    logoUrl: ethereumLogoUrl,
    nativeCurrency: { name: 'Görli Ether', symbol: 'görETH', decimals: 18 },
    isSupported: true,
  },
  [SupportedChainId.POLYGON]: {
    name: 'Polygon',
    divaAddress: '0x60f5A0c12457761558f5d9933f5924fE8907eBcf',
    balanceCheckerAddress: '0xA83ea2A711D6f3c3F53be275bB40ab60b246c677',
    exchangeProxy: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
    whitelistAddress: '0x3bcBFBd63f0387fF1b72a4C580fA7758C04B718d',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-polygon-230226',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-polygon', // TODO: add entries
    allOrders: 'https://polygon.eip712api.xyz/0x/orderbook/v1/orders/',
    order: 'https://polygon.eip712api.xyz/0x/orderbook/v1/order/',
    orderbook: 'https://polygon.eip712api.xyz/0x/orderbook/v1',
    offer: 'https://polygon.eip712api.xyz/diva/offer/v1/',
    websocket: 'wss://polygon.eip712api.xyz/websocket',
    explorer: 'https://polygonscan.com/',
    logoUrl: polygonMaticLogo,
    nativeCurrency: { name: 'Polygon Matic', symbol: 'MATIC', decimals: 18 },
    isSupported: true,
  },
  [SupportedChainId.POLYGON_MUMBAI]: {
    name: 'Mumbai',
    divaAddress: '0xa761003C34936b760473eD993B2B6208aB07782E',
    balanceCheckerAddress: '0x12d998fEC98158dD816eD6EB49CF33e31765fd32',
    exchangeProxy: '0xf471d32cb40837bf24529fcf17418fc1a4807626',
    whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-mumbai-230226',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-mumbai', // TODO: add entries
    allOrders: 'https://mumbai.eip712api.xyz/0x/orderbook/v1/orders/',
    order: 'https://mumbai.eip712api.xyz/0x/orderbook/v1/order/',
    orderbook: 'https://mumbai.eip712api.xyz/0x/orderbook/v1',
    offer: 'https://mumbai.eip712api.xyz/diva/offer/v1/',
    websocket: 'wss://mumbai.eip712api.xyz/websocket',
    explorer: 'https://mumbai.polygonscan.com/',
    logoUrl: polygonMaticLogo,
    nativeCurrency: {
      name: 'Polygon Mumbai Matic',
      symbol: 'mMATIC',
      decimals: 18,
    },
    isSupported: true,
  },
  [SupportedChainId.ARBITRUM_ONE]: {
    name: 'Arbitrum',
    divaAddress: '',
    balanceCheckerAddress: '',
    exchangeProxy: '',
    whitelistAddress: '',
    divaSubgraph: '',
    whitelistSubgraph: '',
    allOrders: '',
    order: '',
    offer: '',
    orderbook: '',
    websocket: '',
    explorer: 'https://arbiscan.io/',
    logoUrl: arbitrumLogoUrl,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    isSupported: false,
  },
}

// array of all chain ids
export const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[] = Object.values(
  SupportedChainId
).filter((id) => typeof id === 'number') as SupportedChainId[]

// current supported chain
export const CURRENT_SUPPORTED_CHAIN_ID = [
  SupportedChainId.GOERLI,
  SupportedChainId.POLYGON,
  SupportedChainId.POLYGON_MUMBAI,
]

// DIVA Governance address which is the default creator of pools on Markets page and trading fee recipient
export const DIVA_GOVERNANCE_ADDRESS =
  '0xBb0F479895915F80f6fEb5BABcb0Ad39a0D7eF4E'

// Trading fee; 0.01 corresponds to 1%
export const TRADING_FEE = 0.01

// TODO Think about merging tradingFee and DEFAULT_TAKER_TOKEN_FEE
export const DEFAULT_TAKER_TOKEN_FEE = 1000 // 1000 = 1%

export const DEFAULT_THRESHOLD = 100

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
    label: 'App Training',
    to: '/tasks',
    icon: TaskIcon,
  },
]

// wallet images
export const WALLET_IMAGES = {
  metamask: metamaskLogo,
  walletConnect: walletConnectLogo,
}
