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
    divaAddress: '0x6455A2Ae3c828c4B505b9217b51161f6976bE7cf',
    whitelistAddress: '0xc7B292b054A53C661dCEbC704F6fc2b1D8073cf7',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-ropsten',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-ropsten',
  },
  3: {
    name: 'Ropsten',
    divaAddress: '0x6455A2Ae3c828c4B505b9217b51161f6976bE7cf',
    whitelistAddress: '0xc7B292b054A53C661dCEbC704F6fc2b1D8073cf7',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-ropsten',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-ropsten',
  },
  4: {
    name: 'Rinkeby',
    divaAddress: '0x5EB926AdbE39029be962acD8D27130073C50A0e5',
    whitelistAddress: '0xF1a36B324AB5d549824a805ccd04Fa4d2e598E6b',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-rinkeby',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-rinkeby',
  },
  137: {
    name: 'Matic',
    divaAddress: '0xD7D5f9442f97245605D99cAeD72d27D40b94251C',
    whitelistAddress: 'n/a',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-matic',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-matic',
  },
  42: {
    name: 'Kovan',
    divaAddress: '0xa8450f6cDbC80a07Eb593E514b9Bd5503c3812Ba',
    whitelistAddress: '0xe3343218CAa73AE523D40936D64E7f335AfDe8f9',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-kovan',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-kovan',
  },
  80001: {
    name: 'Mumbai',
    divaAddress: '0xCDc415B8DEA4d348ccCa42Aa178611F1dbCD2f69',
    whitelistAddress: '0xcA65fcD37fA8BA5f79f5CB3E68F4fCD426ccE5ef',
    divaSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-mumbai',
    whitelistSubgraph:
      'https://api.thegraph.com/subgraphs/name/divaprotocol/diva-whitelist-mumbai',
  },
}

export const createdByFilterAddressForMarket =
  '0x47566c6c8f70e4f16aa3e7d8eed4a2bdb3f4925b'
