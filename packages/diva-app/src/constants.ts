type SingleConfig = {
  name: string
  divaAddress: string
  balanceCheckAddress: string
  whitelistAddress: string
  divaSubgraph: string
  whitelistSubgraph: string
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
  //   allOrders: 'https://ropsten.api.0x.org/orderbook/v1/orders/',
  //   order: 'https://ropsten.api.0x.org/orderbook/v1/order/',
  // },
  5: {
    name: 'Goerli',
    divaAddress: '0x8f138cfC5de71FCde7FdeCd87EAC6Aa6A536Bf85',
    balanceCheckAddress: '0x9293ff9733AC7666A8251564C083191c3DA8BE19',
    whitelistAddress: '0x017aA6E15e406b85b8b1dF322e39444D819C8F43',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-goerli',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-goerli',
    allOrders: 'https://goerli.api.0x.org/orderbook/v1/orders/',
    order: 'https://goerli.api.0x.org/orderbook/v1/order/',
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
  // 137: {
  //   name: 'Matic',
  //   divaAddress: '0x131b154c13c7F2Ac4A0cC7798389A90B536F19f0',
  //   whitelistAddress: '0x3bcBFBd63f0387fF1b72a4C580fA7758C04B718d',
  //   divaSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-polygon',
  //   whitelistSubgraph:
  //     'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-polygon',
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
  //   allOrders: 'https://mumbai.api.0x.org/orderbook/v1/orders/',
  //   order: 'https://mumbai.api.0x.org/orderbook/v1/order/',
  // },
}

export const divaGovernanceAddress =
  '0xBb0F479895915F80f6fEb5BABcb0Ad39a0D7eF4E' // creator of pools on Main Markets page and trading fee recipient
