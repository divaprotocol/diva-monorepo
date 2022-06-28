import React, { useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import {
  AppBar,
  Box,
  Button,
  Input,
  InputAdornment,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useTheme,
} from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { LineSeries, XYPlot } from 'react-vis'
import { Search } from '@mui/icons-material'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import { getShortenedAddress } from '../Util/getShortenedAddress'
import { divaGovernanceAddress } from '../constants'
import { useWhitelist } from '../hooks/useWhitelist'

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
  const [creatorButtonLabel, setCreatorButtonLabel] = useState('Creator')
  const [underlyingLabel, setUnderlyingLabel] = useState('Underlying')
  const [creatorMenuValue, setCreatorMenuValue] = useState(null)
  const [underlyingValue, setUnderlyingValue] = useState(null)

  const classes = useStyles()
  const theme = useTheme()
  const CreatorMenuOpen = Boolean(creatorMenuValue)
  const UnderlyingMenuOpen = Boolean(underlyingValue)
  const handleCreatorInput = (e) => {
    onCreatorChanged(e.target.value)
    setCreatorButtonLabel(
      e.target.value === '' ? 'Creator' : getShortenedAddress(e.target.value)
    )
  }
  const filteredRows =
    search != null && search.length > 0
      ? rows.filter((v) =>
          v.Underlying.toLowerCase().includes(search.toLowerCase())
        )
      : rows

  const handleUnderlyingInput = (e) => {
    setSearch(e.target.value)
    setUnderlyingLabel(e.target.value === '' ? 'Underlying' : e.target.value)
  }
  return (
    <Stack height="100%" width="100%" spacing={5}>
      <AppBar
        position="static"
        sx={{ background: theme.palette.background.default, boxShadow: 'none' }}
      >
        <Toolbar>
          <Typography>Filters:</Typography>
          <Box>
            <Button
              id="creator-filter-button"
              aria-controls={CreatorMenuOpen ? 'creator-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={CreatorMenuOpen ? 'true' : undefined}
              endIcon={<ArrowDropDownIcon />}
              sx={{
                color: '#ffffff',
                fontSize: '16px',
                textTransform: 'capitalize',
              }}
              onClick={(e) => {
                setCreatorMenuValue(e.currentTarget)
              }}
            >
              {creatorButtonLabel}
            </Button>
            <Menu
              id="creator-filter-menu"
              anchorEl={creatorMenuValue}
              open={CreatorMenuOpen}
              onClose={() => setCreatorMenuValue(null)}
            >
              <MenuItem sx={{ width: '300px', height: '50px' }}>
                <Input
                  value={null}
                  placeholder="Enter the address"
                  aria-label="Filter creator"
                  sx={{ width: '300px', height: '50px' }}
                  onChange={handleCreatorInput}
                  startAdornment={
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  }
                />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  onCreatorChanged(divaGovernanceAddress)
                  setCreatorButtonLabel(
                    getShortenedAddress(divaGovernanceAddress)
                  )
                  setCreatorMenuValue(null)
                }}
              >
                Diva Governance
              </MenuItem>
            </Menu>
          </Box>
          <Box>
            <Button
              id="underlying-filter-button"
              aria-controls={UnderlyingMenuOpen ? 'creator-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={UnderlyingMenuOpen ? 'true' : undefined}
              endIcon={<ArrowDropDownIcon />}
              sx={{
                color: '#ffffff',
                fontSize: '16px',
                textTransform: 'capitalize',
              }}
              onClick={(e) => {
                setUnderlyingValue(e.currentTarget)
              }}
            >
              {underlyingLabel}
            </Button>
            <Menu
              id="underlying-Menu"
              anchorEl={underlyingValue}
              open={UnderlyingMenuOpen}
              onClose={() => setUnderlyingValue(null)}
            >
              <MenuItem sx={{ width: '300px', height: '50px' }}>
                <Input
                  value={search}
                  placeholder="Filter underlying"
                  aria-label="Filter underlying"
                  sx={{ width: '300px', height: '50px' }}
                  onChange={handleUnderlyingInput}
                  startAdornment={
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  }
                />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
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
    </Stack>
  )
}
