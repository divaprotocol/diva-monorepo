type SingleConfig = {
  name: string
  divaAddress: string
  whitelistAddress: string
  divaSubgraph: string
  whitelistSubgraph: string
}

export const config: { [key: number]: SingleConfig } = {
  3: {
    name: 'Ropsten',
    divaAddress: '0x6455A2Ae3c828c4B505b9217b51161f6976bE7cf',
    whitelistAddress: '0x50D327C638B09d0A434185d63E7193060E6271B2',
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
    whitelistAddress: '0x9293ff9733AC7666A8251564C083191c3DA8BE19',
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
