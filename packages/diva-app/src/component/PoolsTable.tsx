import React, { useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import { Box, Input, InputAdornment } from '@mui/material'
import { LineSeries, XYPlot } from 'react-vis'
import { Search } from '@mui/icons-material'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import localCoinImages from '../Util/localCoinImages.json'
const assetLogoPath = '/images/coin-logos/'

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
    <Box
      sx={{
        height: 'calc(100% - 1em)',
        display: 'flex',
        flexGrow: 1,
        flexDirection: 'column',
        paddingTop: '2em',
        paddingLeft: '4em',
        paddingRight: '4em',
      }}
    >
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
          placeholder="Filter asset"
          aria-label="Filter asset"
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
    </Box>
  )
}
