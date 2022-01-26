import { GridColDef, GridRowModel } from '@mui/x-data-grid/x-data-grid'
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Stack,
  TextField,
  Tooltip,
} from '@mui/material'
import React, { useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'

import { config } from '../../constants'
import { SideMenu } from './SideMenu'
import PoolsTable, { CoinImage } from '../PoolsTable'
import { chainIdtoName } from '../../Util/chainIdToName'
import DIVA_ABI from '../../abi/DIVA.json'
import { getDateTime, getExpiryMinutesFromNow } from '../../Util/Dates'
import { formatUnits } from 'ethers/lib/utils'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { useQuery } from 'react-query'
import { Pool, queryPools } from '../../lib/queries'
import { request } from 'graphql-request'

const DueInCell = (props: any) => {
  const expTimestamp = parseInt(props.row.Expiry)
  const statusTimestamp = parseInt(props.row.statusTimestamp)

  if (props.row.Status === 'Expired') {
    const minUntilExp = getExpiryMinutesFromNow(
      expTimestamp + 24 * 3600 - 5 * 60
    )

    if (minUntilExp < 24 * 60 - 5 && minUntilExp > 0) {
      return minUntilExp === 1 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '150vh',
          }}
        >
          {'<1m'}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '150vh',
          }}
        >
          {(minUntilExp - (minUntilExp % 60)) / 60 +
            'h ' +
            (minUntilExp % 60) +
            'm '}
        </div>
      )
    }
  }
  if (props.row.Status === 'Challenged') {
    const minUntilExp = getExpiryMinutesFromNow(
      statusTimestamp + 48 * 3600 - 5 * 60
    )
    if (minUntilExp < 48 * 60 - 5 && minUntilExp > 0) {
      return minUntilExp === 1 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '150vh',
          }}
        >
          {'<1m'}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '150vh',
          }}
        >
          {(minUntilExp - (minUntilExp % 60)) / 60 +
            'h ' +
            (minUntilExp % 60) +
            'm '}
        </div>
      )
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '150vh',
      }}
    >
      {'-'}
    </div>
  )
}
const SubmitCell = (props: any) => {
  const { chainId } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )
  const diva = new ethers.Contract(
    config[chainId!].divaAddress,
    DIVA_ABI,
    provider.getSigner()
  )
  const [open, setOpen] = useState(false)
  const [textFieldValue, setTextFieldValue] = useState('')
  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const enabled =
    (props.row.Status === 'Expired' &&
      getExpiryMinutesFromNow(props.row.Expiry) + 24 * 60 - 5 > 0) ||
    (props.row.Status === 'Challenged' &&
      getExpiryMinutesFromNow(props.row.StatusTimestamp) + 48 * 60 - 5 > 0)

  return (
    <Container>
      <Button variant="contained" onClick={handleOpen} disabled={!enabled}>
        Submit value
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <DialogContentText>
            Please provide a value for this option
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <TextField
            defaultValue={textFieldValue}
            onChange={(e) => {
              setTextFieldValue(e.target.value)
            }}
          />
          <Button
            color="primary"
            type="submit"
            onClick={() => {
              diva.setFinalReferenceValue(
                props.id.split('/')[0],
                ethers.utils.parseEther(textFieldValue),
                true
              )
              handleClose()
            }}
          >
            Submit value
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

const columns: GridColDef[] = [
  {
    field: 'Icon',
    align: 'right',
    disableReorder: true,
    disableColumnMenu: true,
    headerName: '',
    renderCell: (cell) => <CoinImage assetName={cell.value} />,
  },
  {
    field: 'Underlying',
    flex: 1,
    minWidth: 100,
  },
  { field: 'Floor', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Inflection', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Ceiling', align: 'right', headerAlign: 'right', type: 'number' },
  {
    field: 'Expiry',
    minWidth: 170,
    align: 'right',
    headerAlign: 'right',
    type: 'dateTime',
    renderCell: (props) => {
      return <div>{getDateTime(props.row.Expiry)}</div>
    },
  },
  {
    field: 'finalValue',
    align: 'right',
    headerAlign: 'right',
    headerName: 'Final Value',
    renderCell: (cell: any) => (
      <Tooltip title={cell.value}>
        <span className="table-cell-trucate">{cell.value}</span>
      </Tooltip>
    ),
  },
  {
    field: 'Status',
    align: 'right',
    headerAlign: 'right',
  },
  {
    field: 'subPeriod',
    align: 'right',
    headerAlign: 'right',
    headerName: 'Due in',
    minWidth: 100,
    renderCell: (props) => <DueInCell {...props} />,
  },
  {
    field: 'submitValue',
    align: 'right',
    headerAlign: 'right',
    headerName: '',
    minWidth: 200,
    renderCell: (props) => <SubmitCell {...props} />,
  },
]

export function MyDataFeeds() {
  const { account, chainId } = useWeb3React()

  const query = useQuery<{ pools: Pool[] }>('pools', () =>
    request(config[chainId as number].divaSubgraph, queryPools)
  )
  const pools =
    query.data?.pools.filter(
      (pool: Pool) =>
        pool.dataFeedProvider.toLowerCase() === account?.toLowerCase()
    ) || ([] as Pool[])
  const rows: GridRowModel[] = pools.reduce((acc, val) => {
    const shared = {
      Icon: val.referenceAsset,
      Underlying: val.referenceAsset,
      Floor: formatUnits(val.floor),
      Inflection: formatUnits(val.inflection),
      Ceiling: formatUnits(val.cap),
      Expiry: val.expiryDate,
      Sell: 'TBD',
      Buy: 'TBD',
      MaxYield: 'TBD',
    }

    const payOff = {
      Floor: parseInt(val.floor) / 1e18,
      Inflection: parseInt(val.inflection) / 1e18,
      Cap: parseInt(val.cap) / 1e18,
    }
    const expiryDate = new Date(parseInt(val.expiryDate) * 1000)
    const now = new Date()
    const Status =
      expiryDate.getTime() <= now.getTime() &&
      val.statusFinalReferenceValue.toLowerCase() === 'open'
        ? 'Expired'
        : val.statusFinalReferenceValue
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
        Status,
        StatusTimestamp: val.statusTimestamp,
        finalValue:
          val.statusFinalReferenceValue === 'Open'
            ? '-'
            : formatUnits(val.finalReferenceValue),
      },
    ]
  }, [] as GridRowModel[])

  return account ? (
    <Stack
      direction="row"
      sx={{
        height: '100%',
      }}
    >
      <SideMenu />
      <PoolsTable disableRowClick columns={columns} rows={rows} />
    </Stack>
  ) : (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '75vh',
      }}
    >
      Please connect your wallet{' '}
    </div>
  )
}
