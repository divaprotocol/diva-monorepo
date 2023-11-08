import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import { Box, CircularProgress, Grid, Stack } from '@mui/material'
import { LineSeries, XYPlot } from 'react-vis'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import PoolCard from './PoolCard'
import { setResponseBuy, setResponseSell } from '../Redux/TradeOption'
import { useDispatch } from 'react-redux'
import useTheme from '@mui/material/styles/useTheme'
import { useCallback, useMemo } from 'react'

type Props = {
  columns: GridColDef[]
  disableRowClick?: boolean
  loading?: boolean
  rows: GridRowModel[]
  onPageChange?: (page: number, details: any) => void
  page: number
  rowCount?: number
  selectedPoolsView?: string
  handleRowClick?: (row: any) => void
}

const useStyles = makeStyles(() => ({
  progress: {
    margin: '0 auto',
    marginTop: 2,
  },
  root: {
    '&.MuiDataGrid-root .MuiDataGrid-cell:focus': {
      outline: 'none',
    },
  },
  noResults: {
    color: 'white',
    textAlign: 'center',
    marginTop: 2,
  },
  gridContainer: {
    justifyContent: 'center',
  },
}))

export const PayoffCell = ({ data }: { data: any }) => {
  return (
    <Box height={50}>
      <XYPlot width={100} height={80} style={{ fill: 'none' }}>
        <LineSeries data={data} />
      </XYPlot>
    </Box>
  )
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
  handleRowClick,
}: Props) {
  const history = useHistory()
  const classes = useStyles()
  const dispatch = useDispatch()
  const theme = useTheme()

  const handleRowClickDefault = useCallback(
    (row) => {
      // Invalidate cache responses before navigating to trades page.
      // This ensures that the orderbook does not have empty rows included after switching from a market
      // with non-empty orderbook rows
      console.log('default function is staring')
      dispatch(setResponseSell([]))
      dispatch(setResponseBuy([]))
      history.push(`../../${row.id}`)
    },
    [dispatch, history]
  )

  const renderLoading = useMemo(
    () => <CircularProgress className={classes.progress} />,
    [classes.progress]
  )
  const renderNoResults = useMemo(
    () => <Box className={classes.noResults}>No results found.</Box>,
    [classes.noResults]
  )

  const renderResults = useMemo(
    () => (
      <Grid
        container
        spacing={theme.spacing(9.5)}
        rowSpacing={theme.spacing(5.25)}
        className={classes.gridContainer}
      >
        {rows.map((row) => (
          <Grid item key={row.id}>
            <PoolCard row={row} />
          </Grid>
        ))}
      </Grid>
    ),
    [classes.gridContainer, rows]
  )

  const RenderDataGrid = useMemo(
    () => (
      <DataGrid
        className={classes.root}
        rows={rows}
        pagination
        columns={columns}
        loading={loading}
        rowCount={rowCount}
        paginationMode={rowCount ? 'server' : 'client'}
        onPageChange={onPageChange}
        page={page}
        onRowClick={
          disableRowClick
            ? undefined
            : handleRowClick
            ? handleRowClick
            : handleRowClickDefault
        }
        componentsProps={{
          row: {
            style: {
              cursor: 'pointer',
            },
          },
        }}
      />
    ),
    [
      classes.root,
      rows,
      columns,
      loading,
      rowCount,
      onPageChange,
      page,
      disableRowClick,
      handleRowClick,
    ]
  )

  return (
    <Stack height="100%" width="100%">
      {selectedPoolsView === 'Table' ? (
        RenderDataGrid
      ) : (
        <>
          {loading
            ? renderLoading
            : rows.length === 0
            ? renderNoResults
            : renderResults}
        </>
      )}
    </Stack>
  )
}
