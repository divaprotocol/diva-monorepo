import React, { useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import { Box, Input, InputAdornment, Stack } from '@mui/material'
import { LineSeries, XYPlot } from 'react-vis'
import { Search } from '@mui/icons-material'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@mui/styles'

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
}

export default function PoolsTable({
  columns,
  disableRowClick,
  rows,
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
  const classes = useStyles()

  return (
    <Stack height="100%" width="100%">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'end',
          flexDirection: 'column',
          paddingBottom: '1em',
        }}
      >
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
      </Box>
      <DataGrid
        className={classes.root}
        rows={filteredRows}
        pagination
        columns={columns}
        loading={loading}
        rowCount={rowCount}
        onPageChange={onPageChange}
        page={page}
        onRowClick={
          disableRowClick
            ? undefined
            : (row) => {
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
