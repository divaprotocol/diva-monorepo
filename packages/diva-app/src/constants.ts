type SingleConfig = {
  name: string
  divaAddress: string
  balanceCheckAddress: string
  whitelistAddress: string
  divaSubgraph: string
  whitelistSubgraph: string
  zeroxSubgraph: string
  allOrders: string
  order: string
}

export const projectId = '9f5f0ef1c7544c029b0aa9ca622759c3'

export const config: { [key: number]: SingleConfig } = {
  // 1: {
  //   name: 'Mainnet',
  //   divaAddress: '0xebBAA31B1Ebd727A1a42e71dC15E304aD8905211',
  //   whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
  //   divaSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-ropsten',
  //   whitelistSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-ropsten',
  //   zeroxSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/zerox-exchange-proxy-ropsten',
  //   allOrders: 'https://ropsten.api.0x.org/orderbook/v1/orders/',
  //   order: 'https://ropsten.api.0x.org/orderbook/v1/order/',
  // },
  3: {
    name: 'Ropsten',
    divaAddress: '0xebBAA31B1Ebd727A1a42e71dC15E304aD8905211',
    balanceCheckAddress: '0xD713aeC2156709A6AF392bb84018ACc6b44f1885',
    whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-ropsten',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-ropsten',
    zeroxSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/zerox-exchange-proxy-ropsten',
    allOrders: 'https://ropsten.api.0x.org/orderbook/v1/orders/',
    order: 'https://ropsten.api.0x.org/orderbook/v1/order/',
  },
  // 4: {
  //   name: 'Rinkeby',
  //   divaAddress: '0x3481C73363b52a26068b1C7006CEF98670FEE514',
  //   whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
  //   divaSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-rinkeby',
  //   whitelistSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-rinkeby',
  //   zeroxSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/zerox-exchange-proxy-rinkeby',
  //   allOrders: 'https://rinkeby.api.0x.org/orderbook/v1/orders/',
  //   order: 'https://rinkeby.api.0x.org/orderbook/v1/order/',
  // },
  // 137: {
  //   name: 'Matic',
  //   divaAddress: '0x131b154c13c7F2Ac4A0cC7798389A90B536F19f0',
  //   whitelistAddress: '0x3bcBFBd63f0387fF1b72a4C580fA7758C04B718d',
  //   divaSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-polygon',
  //   whitelistSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-polygon',
  //   zeroxSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/zerox-exchange-proxy-polygon',
  //   allOrders: 'https://polygon.api.0x.org/orderbook/v1/orders/',
  //   order: 'https://polygon.api.0x.org/orderbook/v1/order/',
  // },
  // 42: {
  //   name: 'Kovan',
  //   divaAddress: '0x69E0577cAd908D9098F36dfbC4Ec36ad09920F4b',
  //   whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
  //   divaSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-kovan',
  //   whitelistSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-kovan',
  //   zeroxSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/zerox-exchange-proxy-kovan',
  //   allOrders: 'https://kovan.api.0x.org/orderbook/v1/orders/',
  //   order: 'https://kovan.api.0x.org/orderbook/v1/order/',
  // },
  // 80001: {
  //   name: 'Mumbai',
  //   divaAddress: '0x625aBcb0C7371d6691796E972089d75eD356523b',
  //   whitelistAddress: '0x5a4385BAf615A35f79787A5cEDFb7ac44Fb26D7e',
  //   divaSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-mumbai',
  //   whitelistSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-mumbai',
  //   zeroxSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/zerox-exchange-proxy-mumbai',
  //   allOrders: 'https://mumbai.api.0x.org/orderbook/v1/orders/',
  //   order: 'https://mumbai.api.0x.org/orderbook/v1/order/',
  // },
}

export const whitelistedPoolCreatorAddress =
  '0xBb0F479895915F80f6fEb5BABcb0Ad39a0D7eF4E'
