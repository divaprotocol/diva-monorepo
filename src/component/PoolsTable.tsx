import React, { useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid/x-data-grid'
import { getDateTime } from '../Util/Dates'
import { Box, Input, InputAdornment } from '@mui/material'
import { generatePayoffChartData } from '../Graphs/DataGenerator'
import { LineSeries, XYPlot } from 'react-vis'
import { LocalGasStation, Search } from '@mui/icons-material'
import { useHistory } from 'react-router-dom'
import { Pool, queryPools } from '../lib/queries'
import { request } from 'graphql-request'
import { useQuery } from 'react-query'
import { formatUnits } from 'ethers/lib/utils'
import { getIconSrc } from '../Util/getIconSrc'
import { existsSync } from 'fs'

const assetLogoPath = '/images/coin-logos/'

const circlePlaceholder = (asset: string) => {
  return (
    <svg width="30" height="30">
      <circle cx="15" cy="15" r="15" fill="#060" />
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        fill="white"
        font-size="20px"
        font-family="Arial"
        dy=".3em"
      >
        {asset.charAt(0)}
      </text>
    </svg>
  )
}

export const OptionImageCell = ({ assetName }: { assetName: string }) => {
  const assets = assetName.split('/')
  if (assets.length === 1 && assets[0].includes('Gas')) {
    return <LocalGasStation />
  } else if (assets.length === 1) {
    if (existsSync(assetLogoPath + assets[0] + '.png')) {
      return (
        <img
          alt={assets[0]}
          src={assetLogoPath + assets[0] + '.png'}
          style={{ height: 30 }}
        />
      )
    } else {
      return circlePlaceholder(assets[0])
    }
  } else if (assets.length === 2) {
    if (getIconSrc(assets[0]) === '') {
      if (getIconSrc(assets[1]) === '') {
        return (
          <>
            {circlePlaceholder(assets[0])}
            {circlePlaceholder(assets[1])}
          </>
        )
      } else {
        return (
          <>
            {circlePlaceholder(assets[0])}
            <img
              alt={assets[1]}
              src={getIconSrc(assets[1])}
              style={{ height: 30 }}
            />
          </>
        )
      }
    } else {
      if (getIconSrc(assets[1]) === '') {
        return (
          <>
            <img
              alt={assets[0]}
              src={getIconSrc(assets[0])}
              style={{ height: 30 }}
            />
            {circlePlaceholder(assets[1])}
          </>
        )
      } else {
        return (
          <>
            <img
              alt={`${assets[0]}`}
              src={getIconSrc(assets[0])}
              style={{ marginRight: '-.5em', height: 30 }}
            />
            <img
              alt={assets[1]}
              src={getIconSrc(assets[1])}
              style={{ height: 30 }}
            />
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
  filter?: (pool: Pool) => boolean
}

export default function PoolsTable({ columns, filter }: Props) {
  const history = useHistory()
  const [search, setSearch] = useState('')
  const query = useQuery<{ pools: Pool[] }>('pools', () =>
    request(
      'https://api.thegraph.com/subgraphs/name/juliankrispel/diva',
      queryPools
    )
  )
  const pools =
    query.data?.pools.filter((pool: Pool) =>
      filter != null ? filter(pool) : pool
    ) || ([] as Pool[])

  const rows: GridRowModel[] = pools.reduce((acc, val) => {
    const shared = {
      Icon: val.referenceAsset,
      Underlying: val.referenceAsset,
      Floor: formatUnits(val.floor),
      Inflection: formatUnits(val.inflection),
      Ceiling: formatUnits(val.cap),
      Expiry: getDateTime(val.expiryDate),
      Sell: 'TBD',
      Buy: 'TBD',
      MaxYield: 'TBD',
    }

    const payOff = {
      Floor: parseInt(val.floor) / 1e18,
      Inflection: parseInt(val.inflection) / 1e18,
      Cap: parseInt(val.cap) / 1e18,
    }

    return [
      ...acc,
      {
        ...shared,
        id: `${val.id}/long`,
        address: val.longToken,
        PayoffProfile: generatePayoffChartData({
          ...payOff,
          IsLong: true,
        }),
        TVL:
          formatUnits(val.collateralBalanceLong, val.collateralDecimals) +
          ' ' +
          val.collateralSymbol,
      },
      {
        ...shared,
        id: `${val.id}/short`,
        address: val.shortToken,
        PayoffProfile: generatePayoffChartData({
          ...payOff,
          IsLong: false,
        }),
        TVL:
          formatUnits(val.collateralBalanceShort, val.collateralDecimals) +
          ' ' +
          val.collateralSymbol,
      },
    ]
  }, [] as GridRowModel[])

  const filteredRows =
    search != null && search.length > 0
      ? rows.filter((v) =>
          v.Underlying.toLowerCase().includes(search.toLowerCase())
        )
      : rows

  return (
    <Box
      sx={{
        height: 'calc(100% - 1em)',
        display: 'flex',
        flexGrow: 1,
        flexDirection: 'column',
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
          autoFocus
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
        showColumnRightBorder={false}
        rows={filteredRows}
        columns={columns}
        onRowClick={(row) => {
          history.push(`${row.id}`)
        }}
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
