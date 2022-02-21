import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'

export const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 137, 80001, 42],
})

export const walletconnect = new WalletConnectConnector({
  rpc: {
    3: 'https://ropsten.infura.io/v3/60ab76e16df54c808e50a79975b4779f',
  },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
})
