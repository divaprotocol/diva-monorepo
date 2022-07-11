import React, { useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import {
  Box,
  Button,
  Container,
  Grid,
  Input,
  InputAdornment,
  Stack,
  TextField,
} from '@mui/material'
import { LineSeries, XYPlot } from 'react-vis'
import { Search } from '@mui/icons-material'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline'
import PoolCard from './PoolCard'
import styled from 'styled-components'

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
  const [selectedPoolsView, setSelectedPoolsView] = useState<'Grid' | 'Table'>(
    'Table'
  )
  const filteredRows =
    search != null && search.length > 0
      ? rows.filter((v) =>
          v.Underlying.toLowerCase().includes(search.toLowerCase())
        )
      : rows

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
            sx={{ minWidth: 420 }}
            label="Filter by creator"
            aria-label="Filter by creator"
            onChange={(e) => onCreatorChanged(e.target.value)}
          />
        ) : (
          <span />
        )}

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gridGap: '24px',
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Button
              sx={{
                padding: '0px',
                height: '36px',
                width: '10px',
              }}
              onClick={() => setSelectedPoolsView('Grid')}
            >
              <ViewModuleIcon
                sx={{
                  color:
                    selectedPoolsView === 'Grid' ? 'primary' : 'text.primary',
                }}
              />
            </Button>
            <Button
              sx={{
                padding: '0px',
                height: '36px',
              }}
              onClick={() => setSelectedPoolsView('Table')}
            >
              <ViewHeadlineIcon
                sx={{
                  color:
                    selectedPoolsView === 'Table' ? 'primary' : 'text.primary',
                }}
              />
            </Button>
          </Box>
        </Box>
      </Stack>
      {selectedPoolsView === 'Table' ? (
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
        <Box>
          <Grid
            container
            spacing={'76px'}
            rowSpacing={'42px'}
            justifyContent="center"
          >
            {filteredRows.map((row) => (
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
