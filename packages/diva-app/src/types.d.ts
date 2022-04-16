import { ExternalProvider } from '@ethersproject/providers'
declare module '@mui/x-data-grid' {
  import { DataGrid as _DataGrid } from '@mui/x-data-grid/x-data-grid'

  export const DataGrid = _DataGrid
}

declare global {
  interface Window {
    ethereum: ExternalProvider | undefined
    hell: string
  }
}
