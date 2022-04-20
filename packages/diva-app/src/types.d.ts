import { ExternalProvider, BaseProvider } from '@ethersproject/providers'
declare module '@mui/x-data-grid' {
  import { DataGrid as _DataGrid } from '@mui/x-data-grid/x-data-grid'

  export const DataGrid = _DataGrid
}

type MetamaskProvider = ExternalProvider &
  BaseProvider & {
    isConnected: () => boolean
    chainId: string
  }

declare global {
  interface Window {
    ethereum?: MetamaskProvider
    web3?: {
      currentProvider: any
    }
  }
}
