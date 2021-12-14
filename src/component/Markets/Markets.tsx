import React, { useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid/x-data-grid'
import { getDateTime } from '../../Util/Dates'
import { Box, Input, InputAdornment } from '@mui/material'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { LineSeries, XYPlot } from 'react-vis'
import { LocalGasStation, Search } from '@mui/icons-material'
import { useHistory } from 'react-router-dom'
import { Pool, queryPools } from '../../lib/queries'
import { request } from 'graphql-request'
import { useQuery } from 'react-query'

const assetLogoPath = '/images/coin-logos/'

const OptionImageCell = ({ assetName }: { assetName: string }) => {
  const assets = assetName.split('/')

  if (assets.length === 1 && assets[0].includes('Gas')) {
    return <LocalGasStation />
  } else if (assets.length === 1) {
    return (
      <img
        alt={assets[0]}
        src={assetLogoPath + assets[0] + '.png'}
        style={{ height: 30 }}
      />
    )
  } else if (assets.length === 2) {
    return (
      <>
        <img
          alt={`${assets[0]}`}
          src={assetLogoPath + assets[0] + '.png'}
          style={{ marginRight: '-.5em', height: 30 }}
        />
        <img
          alt={assets[1]}
          src={assetLogoPath + assets[1] + '.png'}
          style={{ height: 30 }}
        />
      </>
    )
  } else {
    return <>'n/a'</>
  }
}

const PayoffCell = ({ data }: { data: any }) => {
  return (
    <Box height={50}>
      <XYPlot width={100} height={80} style={{ fill: 'none' }}>
        <LineSeries data={data} />
      </XYPlot>
    </Box>
  )
}

const columns: GridColDef[] = [
  {
    field: 'Icon',
    align: 'right',
    disableReorder: true,
    disableColumnMenu: true,
    headerName: '',
    renderCell: (cell) => <OptionImageCell assetName={cell.value} />,
  },
  {
    field: 'Underlying',
    minWidth: 150,
    flex: 1,
  },
  {
    field: 'PayoffProfile',
    headerName: 'Payoff Profile',
    disableReorder: true,
    disableColumnMenu: true,
    minWidth: 120,
    renderCell: (cell) => <PayoffCell data={cell.value} />,
  },
  { field: 'Strike', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Inflection', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Cap', align: 'right', headerAlign: 'right', type: 'number' },
  {
    field: 'Expiry',
    minWidth: 170,
    align: 'right',
    headerAlign: 'right',
    type: 'dateTime',
  },
  { field: 'Sell', align: 'right', headerAlign: 'right' },
  { field: 'Buy', align: 'right', headerAlign: 'right' },
  { field: 'MaxYield', align: 'right', headerAlign: 'right' },
  { field: 'TVL', align: 'right', headerAlign: 'right', type: 'number' },
]

console.log(queryPools)

export default function App() {
  const history = useHistory()
  const [search, setSearch] = useState('')
  const query = useQuery<{ pools: Pool[] }>('pools', () =>
    request(
      'https://api.thegraph.com/subgraphs/name/juliankrispel/diva',
      queryPools
    )
  )
  const pools = query.data?.pools || ([] as Pool[])
  console.log({ pools })
  const rows: GridRowModel[] = pools.reduce((acc, val) => {
    const shared = {
      Icon: val.referenceAsset,
      Underlying: val.referenceAsset,
      Strike: parseFloat(val.floor).toFixed(2),
      Infection: parseFloat(val.inflection).toFixed(2),
      Cap: parseFloat(val.cap).toFixed(2),
      Expiry: getDateTime(val.expiryDate),
      Sell: 'TBD',
      Buy: 'TBD',
      MaxYield: 'TBD',
    }

    return [
      ...acc,
      {
        ...shared,
        id: `${val.id}/long`,
        address: val.longToken,
        PayoffProfile: generatePayoffChartData({
          IsLong: true,
          Strike: parseFloat(val.floor),
          Infection: parseFloat(val.inflection),
          Cap: parseFloat(val.cap),
        }),
        TVL: val.collateralBalanceLong + ' ' + val.collateralToken,
      },
      {
        ...shared,
        id: `${val.id}/short`,
        address: val.shortToken,
        PayoffProfile: generatePayoffChartData({
          IsLong: false,
          Strike: parseFloat(val.floor),
          Infection: parseFloat(val.inflection),
          Cap: parseFloat(val.cap),
        }),
        TVL: val.collateralBalanceShort + ' ' + val.collateralToken,
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
