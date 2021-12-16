import React, { useEffect, useState } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { GridColDef, GridRowModel } from '@mui/x-data-grid/x-data-grid'
import {
  getAllOptions,
  liquidityCollection,
} from '../../DataService/FireStoreDB'
import { getDateTime } from '../../Util/Dates'
import { Box, Input, InputAdornment, Stack } from '@mui/material'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { LineSeries, XYPlot } from 'react-vis'
import { LocalGasStation, Search } from '@mui/icons-material'
import { useHistory } from 'react-router-dom'
import { useWeb3React } from '@web3-react/core'
import { ConnectWalletButton } from '../Wallet/ConnectWalletButton'
import { SideMenu } from './SideMenu'

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

export function Dashboard() {
  const [rows, setRows] = useState<GridRowModel[]>([])
  const { account } = useWeb3React()
  const history = useHistory()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (account) {
      const run = async () => {
        const options = await getAllOptions()
        /**
         * Display only unexpired options
         * TODO: This might change in the near future
         */
        const selfProvidedOptions = options.filter(
          (v) => v.DataFeedProvider === account
        )
        const onlyLong = selfProvidedOptions.filter((v) =>
          v.OptionId.startsWith('L')
        )
        setRows(
          onlyLong.map((op) => ({
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
    }
  }, [account])

  useEffect(() => {
    liquidityCollection.onSnapshot((data) => {
      const changes = data
        .docChanges()
        .filter((doc) => doc.type === 'added')
        .map((change) => change.doc.data())

      setRows((rows) => {
        return rows.map((row) => {
          const change = changes.find(
            (change) => change.OptionSetId === row.OptionSetId
          )
          if (change != null) {
            return {
              ...row,
              ...change,
            }
          }
          return row
        })
      })
    })
  }, [rows, account])

  const filteredRows =
    search != null && search.length > 0
      ? rows.filter((v) =>
          v.Underlying.toLowerCase().includes(search.toLowerCase())
        )
      : rows

  return account ? (
    <Stack
      direction="row"
      sx={{
        height: '100%',
      }}
    >
      <SideMenu />
      <Stack sx={{ height: '100%', width: '100%', paddingLeft: '1em' }}>
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
            history.push(`trade/${row.id}`)
          }}
          componentsProps={{
            row: {
              style: {
                cursor: 'pointer',
              },
            },
          }}
        />
      </Stack>
    </Stack>
  ) : (
    <ConnectWalletButton />
  )
}
