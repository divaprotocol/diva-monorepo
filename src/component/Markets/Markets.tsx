import { GridColDef } from '@mui/x-data-grid/x-data-grid'
import PoolsTable, { OptionImageCell, PayoffCell } from '../PoolsTable'

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
    minWidth: 150,
    flex: 1,
  },
  {
    field: 'PayoffProfile',
    headerName: 'Payoff Profile',
    disableReorder: true,
    disableColumnMenu: true,
    minWidth: 120,
    renderCell: (cell) => <PayoffCell data={cell.value} />,
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
  { field: 'Sell', align: 'right', headerAlign: 'right' },
  { field: 'Buy', align: 'right', headerAlign: 'right' },
  { field: 'MaxYield', align: 'right', headerAlign: 'right' },
  {
    field: 'TVL',
    align: 'right',
    headerAlign: 'right',
    type: 'number',
    minWidth: 300,
  },
]

export default function App() {
  return <PoolsTable columns={columns} />
}
