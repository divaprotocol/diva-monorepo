import React, { useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import { Box, Input, InputAdornment, Stack, TextField } from '@mui/material'
import { LineSeries, XYPlot } from 'react-vis'
import { Search } from '@mui/icons-material'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
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
  creatorAddress?: string
  onCreatorChanged?: (createdBy: string) => void
  page: number
  rowCount?: number
}

export default function PoolsTable({
  columns,
  disableRowClick,
  rows,
  onCreatorChanged,
  creatorAddress,
  loading,
  page,
  rowCount,
  onPageChange,
}: Props) {
  const history = useHistory()
  const [search, setSearch] = useState('')
  const filteredRows =
    search != null && search.length > 0
      ? rows.filter((v) =>
          v.Underlying.toLowerCase().includes(search.toLowerCase())
        )
      : rows
  const dispatch = useDispatch()
  const classes = useStyles()

  return (
    <Stack height="100%" width="100%" spacing={5}>
      <Stack
        direction="row"
        alignItems="end"
        spacing={4}
        justifyContent="space-between"
      >
        {onCreatorChanged != null ? (
          <TextField
            value={creatorAddress}
            placeholder="0x..."
            label="Filter by creator"
            aria-label="Filter by creator"
            onChange={(e) => onCreatorChanged(e.target.value)}
          />
        ) : (
          <span />
        )}

        <Input
          value={search}
          placeholder="Filter underlying"
          aria-label="Filter underlying"
          onChange={(e) => setSearch(e.target.value)}
          startAdornment={
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          }
        />
      </Stack>
      <DataGrid
        className={classes.root}
        rows={filteredRows}
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
                //Invalidate cache responses before navigating to trades page.
                //This will fix the following issue
                //Fix issue with empty rows in orderbook (e.g., when you open up L94 and then switch to the first product in the list)
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
    </Stack>
  )
}
