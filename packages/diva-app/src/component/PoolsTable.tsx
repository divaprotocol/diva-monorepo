import React, { useEffect, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import {
  Box,
  Button,
  Container,
  Grid,
  Input,
  Stack,
  TextField,
  AppBar,
  InputAdornment,
  MenuItem,
  Switch,
  Toolbar,
  Typography,
  useTheme,
  Menu,
  FormControlLabel,
} from '@mui/material'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import { LineSeries, XYPlot } from 'react-vis'
import { Search } from '@mui/icons-material'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@mui/styles'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline'
import PoolCard from './PoolCard'
import styled from 'styled-components'
import { setResponseBuy, setResponseSell } from '../Redux/TradeOption'
import { useDispatch } from 'react-redux'
import { getShortenedAddress } from '../Util/getShortenedAddress'
import { selectUserAddress } from '../Redux/appSlice'
import { useAppSelector } from '../Redux/hooks'
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
  isViewToggle?: boolean
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
  isViewToggle,
}: Props) {
  const history = useHistory()
  const currentAddress = history.location.pathname.split('/')
  const [search, setSearch] = useState('')
  const [selectedPoolsView, setSelectedPoolsView] = useState<'Grid' | 'Table'>(
    'Table'
  )
  const [creatorButtonLabel, setCreatorButtonLabel] = useState(
    getShortenedAddress(currentAddress[2])
  )
  const [underlyingLabel, setUnderlyingLabel] = useState('Underlying')
  const [creatorMenuValue, setCreatorMenuValue] = useState(null)
  const [underlyingValue, setUnderlyingValue] = useState(null)
  const [expiredClicked, setExpiredClicked] = useState(false)
  const classes = useStyles()
  const theme = useTheme()
  const userAddress = useAppSelector(selectUserAddress)
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

  const dispatch = useDispatch()

  const openRows = expiredClicked
    ? filteredRows.filter((v) => v.Status.includes('Open'))
    : filteredRows
  const handleExpiryPools = () => {
    if (expiredClicked) {
      setExpiredClicked(false)
    } else {
      setExpiredClicked(true)
    }
  }

  const handleUnderlyingInput = (e) => {
    setSearch(e.target.value)
    setUnderlyingLabel(e.target.value === '' ? 'Underlying' : e.target.value)
  }
  return (
    <Stack height="100%" width="100%" spacing={5}>
      <AppBar
        position="static"
        sx={{
          background: theme.palette.background.default,
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          {isViewToggle && (
            <Box
              sx={{
                marginLeft: 'auto',
              }}
            >
              <Button
                onClick={() => setSelectedPoolsView('Table')}
                color={selectedPoolsView === 'Table' ? 'primary' : 'inherit'}
              >
                <ViewHeadlineIcon />
              </Button>
              <Button
                onClick={() => setSelectedPoolsView('Grid')}
                color={selectedPoolsView === 'Grid' ? 'primary' : 'inherit'}
              >
                <ViewModuleIcon />
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
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
