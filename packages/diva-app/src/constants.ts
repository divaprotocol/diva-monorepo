import ethereumLogoUrl from './Images/ethereum-logo.png'
import polygonMaticLogo from './Images/polygon-matic-logo.svg'
import arbitrumLogoUrl from './Images/arbitrum_logo.svg'
import divaLogo from './Images/logo.svg'
import divaSidebarLogo from './Images/diva-sidebar-logo.svg'
import divaTextLogo from './Images/diva_logo_text.svg'
import { Add, Person, ShowChartOutlined } from '@mui/icons-material'
import metamaskLogo from './Images/meta-mask-logo.png'
import walletConnectLogo from './Images/wallet-connect-logo.png'
import { WhitelistCollateralToken } from './lib/queries'

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

type DataProviders = {
  dataFeeds: {
    active: boolean
    referenceAssetUnified: string
  }[]
  id: string
  name: string
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
  readonly isCustomReferenceAssetAllowed: boolean
  readonly isCustomCollateralAssetAllowed: boolean
  readonly isCustomDataProviderAllowed: boolean
  readonly referenceAssets: string[]
  readonly adminAddresses?: string[]
  readonly collateralTokens?: WhitelistCollateralToken[]
  readonly dataProviders?: DataProviders[]
}

export const projectId = '9f5f0ef1c7544c029b0aa9ca622759c3'

export const config: { [key: number]: SingleConfig } = {
  [SupportedChainId.MAINNET]: {
    name: 'Ethereum',
    divaAddress: '0x2C9c47E7d254e493f02acfB410864b9a86c28e1D',
    balanceCheckerAddress: '0x5A8f3607162FCbB44a286044ED777EEd4d131e09',
    exchangeProxy: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
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
    referenceAssets: ['BTC/USD', 'ETH/USD'],
    isCustomReferenceAssetAllowed: false,
    isCustomCollateralAssetAllowed: false,
    isCustomDataProviderAllowed: false,
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
    referenceAssets: ['BTC/USD', 'ETH/USD'],
    isCustomReferenceAssetAllowed: false,
    isCustomCollateralAssetAllowed: false,
    isCustomDataProviderAllowed: false,
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
    referenceAssets: ['BTC/USD', 'ETH/USD'],
    isCustomReferenceAssetAllowed: true,
    isCustomCollateralAssetAllowed: true,
    isCustomDataProviderAllowed: true,
  },
  [SupportedChainId.POLYGON]: {
    name: 'Polygon',
    divaAddress: '0x2C9c47E7d254e493f02acfB410864b9a86c28e1D',
    balanceCheckerAddress: '0xA83ea2A711D6f3c3F53be275bB40ab60b246c677',
    exchangeProxy: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
    whitelistAddress: '0x3bcBFBd63f0387fF1b72a4C580fA7758C04B718d',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-protocol-v1-polygon',
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
    isCustomReferenceAssetAllowed: false,
    isCustomCollateralAssetAllowed: false,
    isCustomDataProviderAllowed: false,
    referenceAssets: ['BTC/USD', 'ETH/USD', 'TRB/USD'],
    collateralTokens: [
      {
        id: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        name: 'USDT',
        symbol: 'USDT',
        decimals: 6,
      },
      {
        id: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        name: 'USDC',
        symbol: 'USDC',
        decimals: 6,
      },
      {
        id: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
        name: 'WETH',
        symbol: 'WETH',
        decimals: 18,
      },
      {
        id: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
        name: 'WBTC',
        symbol: 'WBTC',
        decimals: 8,
      },
      {
        id: '0x39e896451487f03dC2489AcAef1788C787885d35',
        name: 'PILOT',
        symbol: 'PILOT',
        decimals: 18,
      },
    ],
    adminAddresses: [
      '0x3E50a9F4DC9CCF7aFaBb7337cf57D63dFa12acc0',
      '0x1062CCC9F9a4bBcf565799683b6c00eA525ECb9F',
    ],
    dataProviders: [
      {
        id: '0x7950db13cc37774614b0aa406e42a4c4f0bf26a6',
        name: 'Tellor',
        dataFeeds: [
          {
            active: true,
            referenceAssetUnified: 'BTC/USD',
          },
          {
            active: true,
            referenceAssetUnified: 'ETH/USD',
          },
          {
            active: true,
            referenceAssetUnified: 'TRB/USD',
          },
        ],
      },
    ],
  },
  [SupportedChainId.POLYGON_MUMBAI]: {
    name: 'Mumbai',
    divaAddress: '0x2C9c47E7d254e493f02acfB410864b9a86c28e1D',
    balanceCheckerAddress: '0x12d998fEC98158dD816eD6EB49CF33e31765fd32',
    exchangeProxy: '0xf471d32cb40837bf24529fcf17418fc1a4807626',
    whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-protocol-v1-mumbai',
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
    isCustomReferenceAssetAllowed: true,
    isCustomCollateralAssetAllowed: true,
    isCustomDataProviderAllowed: true,
    collateralTokens: [
      {
        id: '0xf5d5Ea0a5E86C543bEC01a9e4f513525365a86fD',
        name: 'DIVA USD',
        symbol: 'dUSD',
        decimals: 18,
      },
      {
        id: '0x91F13B8da062f9a042dbD37D2e61FBfAcEB267aC',
        name: 'WAGMI18',
        symbol: 'WAGMI18',
        decimals: 18,
      },
    ],
    referenceAssets: ['BTC/USD', 'ETH/USD', 'TRB/USD'],
    dataProviders: [
      {
        id: '0x7950db13cc37774614b0aa406e42a4c4f0bf26a6',
        name: 'Tellor',
        dataFeeds: [
          {
            active: true,
            referenceAssetUnified: 'BTC/USD',
          },
          {
            active: true,
            referenceAssetUnified: 'ETH/USD',
          },
          {
            active: true,
            referenceAssetUnified: 'TRB/USD',
          },
        ],
      },
      {
        id: '0x0625855A4D292216ADEFA8043cDc69a6c99724C9',
        name: 'Tellor Playground',
        dataFeeds: [
          {
            active: true,
            referenceAssetUnified: 'BTC/USD',
          },
          {
            active: true,
            referenceAssetUnified: 'ETH/USD',
          },
          {
            active: true,
            referenceAssetUnified: 'TRB/USD',
          },
        ],
      },
    ],
  },
  [SupportedChainId.ARBITRUM_ONE]: {
    name: 'Arbitrum',
    divaAddress: '0x2C9c47E7d254e493f02acfB410864b9a86c28e1D',
    balanceCheckerAddress: '0x5A8f3607162FCbB44a286044ED777EEd4d131e09',
    exchangeProxy: '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
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
    referenceAssets: ['BTC/USD', 'ETH/USD'],
    isCustomReferenceAssetAllowed: false,
    isCustomCollateralAssetAllowed: false,
    isCustomDataProviderAllowed: false,
  },
}

// array of all chain ids
export const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[] = Object.values(
  SupportedChainId
).filter((id) => typeof id === 'number') as SupportedChainId[]

// current supported chain
export const CURRENT_SUPPORTED_CHAIN_ID = [
  SupportedChainId.POLYGON,
  SupportedChainId.POLYGON_MUMBAI,
]

// Pools created by this address to be displayed as default on the Markets page
export const DEFAULT_MARKETS_CREATED_BY =
  '0x3E50a9F4DC9CCF7aFaBb7337cf57D63dFa12acc0'

// Trading fee recipient
export const TRADING_FEE_RECIPIENT =
  '0x1062CCC9F9a4bBcf565799683b6c00eA525ECb9F'

// Trading fee; 0.01 corresponds to 1%
export const TRADING_FEE = 0.01

// TODO Think about merging tradingFee and DEFAULT_TAKER_TOKEN_FEE
export const DEFAULT_TAKER_TOKEN_FEE = 1000 // 1000 = 1%

export const DEFAULT_THRESHOLD = 100

export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export const MARKETS_PREVIEW_CHAIN_ID = 137

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
]

// wallet images
export const WALLET_IMAGES = {
  metamask: metamaskLogo,
  walletConnect: walletConnectLogo,
}
