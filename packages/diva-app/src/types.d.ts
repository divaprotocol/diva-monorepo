import { ExternalProvider, BaseProvider } from '@ethersproject/providers'

type MetamaskProvider = ExternalProvider &
  BaseProvider & {
    isConnected: () => boolean
    chainId: string
    request: any
  }

declare global {
  interface Window {
    ethereum?: MetamaskProvider
    web3?: {
      currentProvider: any
    }
  }
}
