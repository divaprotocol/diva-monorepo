type SingleConfig = {
  name: string
  divaAddress: string
  whitelistAddress: string
  divaSubgraph: string
  whitelistSubgraph: string
}

export const projectId = 'e3ea5575a42b4de7be15d7c197c12045'

export const config: { [key: number]: SingleConfig } = {
  1: {
    name: 'Ropsten',
    divaAddress: '0xBb0F479895915F80f6fEb5BABcb0Ad39a0D7eF4E',
    whitelistAddress: '0x2A5c18f001719f4663ab8d3E65E3E54182376B20',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-ropsten-staging',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-ropsten-staging',
  },
  3: {
    name: 'Ropsten',
    divaAddress: '0xBb0F479895915F80f6fEb5BABcb0Ad39a0D7eF4E',
    whitelistAddress: '0x2A5c18f001719f4663ab8d3E65E3E54182376B20',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-ropsten-staging',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-ropsten-staging',
  },
  4: {
    name: 'Rinkeby',
    divaAddress: '0xa1fa77354D7810A6355583b566E5adB29C3f7733',
    whitelistAddress: '0x2A5c18f001719f4663ab8d3E65E3E54182376B20',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-rinkeby',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-rinkeby',
  },
  137: {
    name: 'Matic',
    divaAddress: '0x27FaBaed614059b98e7f1e79D872e13aa65640a8',
    whitelistAddress: '0x47d3EF37b7750498061D26bE4351369d2749DfeD',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-matic',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-matic',
  },
  42: {
    name: 'Kovan',
    divaAddress: '0x607228ebB95aa097648Fa8b24dF8807684BBF101',
    whitelistAddress: '0x2A5c18f001719f4663ab8d3E65E3E54182376B20',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-kovan',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-kovan',
  },
  80001: {
    name: 'Mumbai',
    divaAddress: '0xf2Ea8e23E1EaA2e5D280cE6b397934Ba7f30EF6B',
    whitelistAddress: '0x2A5c18f001719f4663ab8d3E65E3E54182376B20',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-mumbai',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-mumbai',
  },
}

export const createdByFilterAddressForMarket =
  '0x47566c6c8f70e4f16aa3e7d8eed4a2bdb3f4925b'
