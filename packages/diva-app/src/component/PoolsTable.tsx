import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import { Box, Grid, Stack } from '@mui/material'
import { LineSeries, XYPlot } from 'react-vis'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import PoolCard from './PoolCard'
import { setResponseBuy, setResponseSell } from '../Redux/TradeOption'
import { useDispatch } from 'react-redux'

const useStyles = makeStyles({
  root: {
    '&.MuiDataGrid-root .MuiDataGrid-cell:focus': {
      outline: 'none',
    },
  },
})

export const PayoffCell = ({ data }: { data: any }) => {
  return (
    <Box height={50}>
      <XYPlot width={100} height={80} style={{ fill: 'none' }}>
        <LineSeries data={data} />
      </XYPlot>
    </Box>
  )
}

type Props = {
  columns: GridColDef[]
  disableRowClick?: boolean
  loading?: boolean
  rows: GridRowModel[]
  onPageChange?: (page: number, details: any) => void
  page: number
  rowCount?: number
  selectedPoolsView?: string
}

export default function PoolsTable({
  columns,
  disableRowClick,
  rows,
  loading,
  page,
  rowCount,
  onPageChange,
  selectedPoolsView,
}: Props) {
  const history = useHistory()
  const classes = useStyles()
  const dispatch = useDispatch()

  return (
    <Stack height="100%" width="100%">
      {selectedPoolsView === 'Table' ? (
        <DataGrid
          className={classes.root}
          rows={rows}
          pagination
          columns={columns}
          loading={loading}
          rowCount={rowCount}
          paginationMode={rowCount != null ? 'server' : 'client'}
          onPageChange={onPageChange}
          page={page}
          onRowClick={
            disableRowClick
              ? undefined
              : (row) => {
                  // Invalidate cache responses before navigating to trades page.
                  // This ensures that the orderbook does not have empty rows included after switching from a market
                  // with non-empty orderbook rows
                  dispatch(setResponseSell([]))
                  dispatch(setResponseBuy([]))
                  history.push(`../../${row.id}`)
                }
          }
          componentsProps={{
            row: {
              style: {
                cursor: 'pointer',
              },
            },
          }}
        />
      ) : (
        <Box className={classes.root}>
          <Grid
            container
            spacing={'76px'}
            rowSpacing={'42px'}
            justifyContent="center"
          >
            {rows.map((row) => (
              <Grid item key={row.Id}>
                <PoolCard row={row} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Stack>
  )
}
