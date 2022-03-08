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

const CoinPlaceHolderFirst = (asset: string) => {
  return (
    <svg width="30" height="30" overflow="visible">
      <circle cx="20" cy="15" z="1" r="15" stroke="black" fill="#00CCF3" />
      <text
        x="33%"
        y="55%"
        textAnchor="middle"
        fill="white"
        fontSize="20px"
        dy=".2em"
        dx=".4em"
      >
        {asset.charAt(0)}
      </text>
    </svg>
  )
}

const CoinPlaceHolderSecond = (asset: string) => {
  return (
    <svg width="30" height="30" overflow="visible">
      <circle
        cx="20"
        cy="15"
        dx="-0.5em"
        z="2"
        r="15"
        stroke="black"
        fill="#00CCF3"
      />
      <text
        x="66%"
        y="55%"
        textAnchor="middle"
        fill="white"
        fontSize="20px"
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
      return CoinPlaceHolderFirst(assets[0])
    }
  } else if (assets.length === 2) {
    if (coinIconLeft === '') {
      if (coinIconRight === '') {
        return (
          <>
            <svg width="60" height="30">
              <circle
                cx="20"
                cy="15"
                z="1"
                r="15"
                stroke="black"
                fill="#00CCF3"
              />
              <text
                x="33%"
                y="55%"
                textAnchor="middle"
                fill="white"
                fontSize="20px"
                dy=".3em"
              >
                {assets[0].charAt(0)}
              </text>
              <circle
                cx="45"
                cy="15"
                z="2"
                r="15"
                stroke="black"
                fill="#00CCF3"
              />
              <text
                x="75%"
                y="55%"
                textAnchor="middle"
                fill="white"
                fontSize="20px"
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
            {CoinPlaceHolderFirst(assets[0])}
            <img
              alt={assets[1]}
              src={coinIconRight}
              style={{
                // overflow: 'visible',
                height: 30,
              }}
            />
          </>
        )
      }
    } else {
      if (coinIconRight === '') {
        return (
          <>
            <img
              alt={assets[0]}
              src={coinIconLeft}
              style={{ marginRight: '-0.5em', height: 30 }}
            />
            {CoinPlaceHolderSecond(assets[1])}
          </>
        )
      } else {
        return (
          <>
            <img
              alt={`${assets[0]}`}
              src={coinIconLeft}
              style={{
                marginRight: '-0.5em',
                // paddingRight: '-.5em',
                height: 30,
              }}
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
  onPageChange?: (page: number, details: any) => void
  page: number
  rowCount?: number
}

export default function PoolsTable({
  columns,
  disableRowClick,
  rows,
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
        rowCount={rowCount}
        onPageChange={onPageChange}
        page={page}
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
