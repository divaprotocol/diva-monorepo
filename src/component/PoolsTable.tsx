import React, { useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid/x-data-grid'
import { Box, Input, InputAdornment } from '@mui/material'
import { LineSeries, XYPlot } from 'react-vis'
import { LocalGasStation, Search } from '@mui/icons-material'
import { useHistory } from 'react-router-dom'
import { Pool } from '../lib/queries'
import { useCoinIcon } from '../hooks/useCoinIcon'
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

const CoinPlaceHolder = (asset: string) => {
  return (
    <svg width="30" height="30">
      <circle cx="15" cy="15" r="15" fill="#060" />
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        fill="white"
        fontSize="20px"
        fontFamily="Arial"
        dy=".3em"
      >
        {asset.charAt(0)}
      </text>
    </svg>
  )
}

const existsLocally = (file: string) => localCoinImages.includes(file)

export const CoinImage = ({ assetName }: { assetName: string }) => {
  const assets = assetName.split('/')
  const coinIconLeft = useCoinIcon(assets[0])
  const coinIconRight = useCoinIcon(assets[1])

  if (assets.length === 1 && assets[0].includes('Gas')) {
    return <LocalGasStation />
  } else if (assets.length === 1) {
    if (existsLocally(assets[0] + '.png')) {
      return (
        <img
          alt={assets[0]}
          src={assetLogoPath + assets[0] + '.png'}
          style={{ height: 30 }}
        />
      )
    } else {
      return CoinPlaceHolder(assets[0])
    }
  } else if (assets.length === 2) {
    if (coinIconLeft === '') {
      if (coinIconRight === '') {
        return (
          <>
            <svg width="60" height="30">
              <circle cx="20" cy="15" r="15" stroke="black" fill="#060" />
              <text
                x="33%"
                y="55%"
                textAnchor="middle"
                fill="white"
                fontSize="20px"
                fontFamily="Arial"
                dy=".3em"
              >
                {assets[0].charAt(0)}
              </text>
              <circle cx="40" cy="15" r="15" stroke="black" fill="#060" />
              <text
                x="66%"
                y="55%"
                textAnchor="middle"
                fill="white"
                fontSize="20px"
                fontFamily="Arial"
                dy=".3em"
              >
                {assets[1].charAt(0)}
              </text>
            </svg>
          </>
        )
      } else {
        return (
          <>
            {CoinPlaceHolder(assets[0])}
            <img alt={assets[1]} src={coinIconRight} style={{ height: 30 }} />
          </>
        )
      }
    } else {
      if (coinIconLeft === '') {
        return (
          <>
            <img alt={assets[0]} src={coinIconLeft} style={{ height: 30 }} />
            {CoinPlaceHolder(assets[1])}
          </>
        )
      } else {
        return (
          <>
            <img
              alt={`${assets[0]}`}
              src={coinIconLeft}
              style={{ marginRight: '-.5em', height: 30 }}
            />
            <img alt={assets[1]} src={coinIconRight} style={{ height: 30 }} />
          </>
        )
      }
    }
  } else {
    return <>'n/a'</>
  }
}

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
  rows: GridRowModel[]
}

export default function PoolsTable({ columns, disableRowClick, rows }: Props) {
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
        columns={columns}
        onRowClick={
          disableRowClick
            ? undefined
            : (row) => {
                history.push(`${row.id}`)
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
