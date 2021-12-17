import { GridColDef } from '@mui/x-data-grid/x-data-grid'
import { Button, Stack } from '@mui/material'
import { useWeb3React } from '@web3-react/core'
import { ConnectWalletButton } from '../Wallet/ConnectWalletButton'
import { SideMenu } from './SideMenu'
import PoolsTable, { OptionImageCell } from '../PoolsTable'

const SubmitCell = () => {
  return <Button variant="contained">Submit value</Button>
}

const columns: GridColDef[] = [
  {
    field: 'Icon',
    align: 'right',
    disableReorder: true,
    disableColumnMenu: true,
    headerName: '',
    renderCell: (cell) => <OptionImageCell assetName={cell.value} />,
  },
  {
    field: 'Underlying',
    flex: 1,
  },
  { field: 'Strike', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Inflection', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Cap', align: 'right', headerAlign: 'right', type: 'number' },
  {
    field: 'Expiry',
    minWidth: 170,
    align: 'right',
    headerAlign: 'right',
    type: 'dateTime',
  },
  {
    field: 'finalValue',
    align: 'right',
    headerAlign: 'right',
    headerName: 'Final Value',
  },
  {
    field: 'Status',
    align: 'right',
    headerAlign: 'right',
  },
  {
    field: 'subPeriod',
    align: 'right',
    headerAlign: 'right',
    headerName: 'Submission period ends in',
    minWidth: 200,
  },
  {
    field: 'submitValue',
    align: 'right',
    headerAlign: 'right',
    headerName: '',
    minWidth: 200,
    renderCell: SubmitCell,
  },
]

export function Dashboard() {
  const { account } = useWeb3React()

  return account ? (
    <Stack
      direction="row"
      sx={{
        height: '100%',
      }}
    >
      <SideMenu />
      <PoolsTable columns={columns} />
    </Stack>
  ) : (
    <ConnectWalletButton />
  )
}
