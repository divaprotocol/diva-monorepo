type SingleConfig = {
  name: string
  divaAddress: string
  whitelistAddress: string
  divaSubgraph: string
  whitelistSubgraph: string
  allOrders: string
  order: string
}

export const projectId = 'e3ea5575a42b4de7be15d7c197c12045'

export const config: { [key: number]: SingleConfig } = {
  1: {
    name: 'Mainnet',
    divaAddress: '0x07F0293a07703c583F4Fb4ce3aC64043732eF3bf',
    whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-ropsten',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-ropsten',
    allOrders: 'https://ropsten.api.0x.org/orderbook/v1/orders/',
    order: 'https://ropsten.api.0x.org/orderbook/v1/order/',
  },
  3: {
    name: 'Ropsten',
    divaAddress: '0x07F0293a07703c583F4Fb4ce3aC64043732eF3bf',
    whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-ropsten',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-ropsten',
    allOrders: 'https://ropsten.api.0x.org/orderbook/v1/orders/',
    order: 'https://ropsten.api.0x.org/orderbook/v1/order/',
  },
  4: {
    name: 'Rinkeby',
    divaAddress: '0xa1fa77354D7810A6355583b566E5adB29C3f7733',
    whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-rinkeby',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-rinkeby',
    allOrders: 'https://rinkeby.api.0x.org/orderbook/v1/orders/',
    order: 'https://rinkeby.api.0x.org/orderbook/v1/order/',
  },
  137: {
    name: 'Matic',
    divaAddress: '0x27FaBaed614059b98e7f1e79D872e13aa65640a8',
    whitelistAddress: '0x3bcBFBd63f0387fF1b72a4C580fA7758C04B718d',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-polygon',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-polygon',
    allOrders: 'https://polygon.api.0x.org/orderbook/v1/orders/',
    order: 'https://polygon.api.0x.org/orderbook/v1/order/',
  },
  42: {
    name: 'Kovan',
    divaAddress: '0x607228ebB95aa097648Fa8b24dF8807684BBF101',
    whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-kovan',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-kovan',
    allOrders: 'https://kovan.api.0x.org/orderbook/v1/orders/',
    order: 'https://kovan.api.0x.org/orderbook/v1/order/',
  },
  80001: {
    name: 'Mumbai',
    divaAddress: '0xf2Ea8e23E1EaA2e5D280cE6b397934Ba7f30EF6B',
    whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-mumbai',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-mumbai',
    allOrders: 'https://mumbai.api.0x.org/orderbook/v1/orders/',
    order: 'https://mumbai.api.0x.org/orderbook/v1/order/',
  },
}

export const whitelistedPoolCreatorAddress =
  '0xBb0F479895915F80f6fEb5BABcb0Ad39a0D7eF4E'
