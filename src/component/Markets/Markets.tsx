import React, { useEffect, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid/x-data-grid'
import { getAllOptions } from '../../DataService/FireStoreDB'
import { getDateTime } from '../../Util/Dates'
import { Box, Input, InputAdornment, useTheme } from '@mui/material'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { LineSeries, XYPlot } from 'react-vis'
import { LocalGasStation, Search } from '@mui/icons-material'
import { useHistory } from 'react-router-dom'

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
    headerName: '',
    renderCell: (cell) => <OptionImageCell assetName={cell.value} />,
  },
  {
    field: 'Underlying',
    minWidth: 150,
  },
  {
    field: 'PayoffProfile',
    headerName: 'Payoff Profile',
    minWidth: 120,
    renderCell: (cell) => <PayoffCell data={cell.value} />,
  },
  { field: 'Strike', align: 'right', headerAlign: 'right' },
  { field: 'Inflection', align: 'right', headerAlign: 'right' },
  { field: 'Cap', align: 'right', headerAlign: 'right' },
  { field: 'Expiry', minWidth: 170, align: 'right', headerAlign: 'right' },
  { field: 'Sell', align: 'right', headerAlign: 'right' },
  { field: 'Buy', align: 'right', headerAlign: 'right' },
  { field: 'MaxYield', align: 'right', headerAlign: 'right' },
  { field: 'TVL', align: 'right', headerAlign: 'right' },
]

export default function App() {
  const [rows, setRows] = useState<GridRowModel[]>([])
  const history = useHistory()
  const [search, setSearch] = useState('')
  const theme = useTheme()

  useEffect(() => {
    const run = async () => {
      const options = await getAllOptions()
      setRows(
        options.map((op) => ({
          Icon: op.ReferenceAsset,
          id: op.OptionId,
          OptionId: op.OptionId,
          PayoffProfile: generatePayoffChartData(op),
          Underlying: op.ReferenceAsset,
          Strike: op.Strike.toFixed(2),
          Inflection: op.Inflection.toFixed(2),
          Cap: op.Cap.toFixed(2),
          Expiry: getDateTime(op.ExpiryDate),
          Sell: 'TBD',
          Buy: 'TBD',
          MaxYield: 'TBD',
          TVL: op.CollateralBalance + ' ' + op.CollateralTokenName,
        }))
      )
    }
    run()
  }, [])

  console.log(theme.spacing)

  const filteredRows =
    search != null && search.length > 0
      ? rows.filter((v) =>
          v.Underlying.toLowerCase().includes(search.toLowerCase())
        )
      : rows

  return (
    <Box
      sx={{
        padding: '1em',
        height: '300px',
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
        rows={filteredRows}
        columns={columns}
        onRowClick={(row) => history.push(`trade/${row.id}`)}
      />
    </Box>
  )
}
