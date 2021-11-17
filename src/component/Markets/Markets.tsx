import React, { useEffect, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid/x-data-grid'
import { getAllOptions } from '../../DataService/FireStoreDB'
import { getDateTime } from '../../Util/Dates'
import { Box } from '@mui/material'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
// import MarketChart from '../Graphs/MarketChart'
import { LineSeries, XYPlot } from 'react-vis'

const PayoffCell = ({ data }: { data: any }) => {
  console.log(data)
  return (
    <Box sx={{ fill: 'none' }}>
      <div>
        <XYPlot width={70} height={50}>
          <LineSeries
            data={[
              { x: 0, y: 0 },
              { x: 1, y: 0.5 },
              { x: 2, y: 1 },
              { x: 3, y: 60 },
            ]}
          />
        </XYPlot>
      </div>
    </Box>
  )
}

const columns: GridColDef[] = [
  { field: 'OptionImage' },
  { field: 'Underlying' },
  {
    field: 'PayoffProfile',
    renderCell: (cell) => <PayoffCell data={cell.value} />,
  },
  { field: 'Strike' },
  { field: 'Inflection' },
  { field: 'Cap' },
  { field: 'Expiry' },
  { field: 'Sell' },
  { field: 'Buy' },
  { field: 'MaxYield' },
  { field: 'TVL' },
]

export default function App() {
  const [rows, setRows] = useState<GridRowModel[]>([])

  useEffect(() => {
    const run = async () => {
      const options = await getAllOptions()
      setRows(
        options.map((op) => ({
          id: op.OptionId,
          OptionId: op.OptionId,
          PayoffProfile: generatePayoffChartData(op),
          Underlying: op.ReferenceAsset,
          Strike: op.Strike,
          Inflection: op.Inflection,
          Cap: op.Cap,
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

  return (
    <Box sx={{ padding: '1em', height: '300px', display: 'flex', flexGrow: 1 }}>
      <DataGrid rows={rows} columns={columns} />
    </Box>
  )
}
