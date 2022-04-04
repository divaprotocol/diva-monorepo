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
import React, { useEffect, useState } from 'react'
import { BigNumber, ethers } from 'ethers'

import { config } from '../../constants'
import { SideMenu } from './SideMenu'
import PoolsTable from '../PoolsTable'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { getDateTime, getExpiryMinutesFromNow } from '../../Util/Dates'
import { formatEther, formatUnits, parseEther } from 'ethers/lib/utils'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { useWallet } from '@web3-ui/hooks'
import { GrayText } from '../Trade/Orders/UiStyles'
import { CoinIconPair } from '../CoinIcon'
import { useAppSelector } from '../../Redux/hooks'
import { fetchPool, fetchPools, poolsSelector } from '../../Redux/poolSlice'
import { useDispatch } from 'react-redux'

const DueInCell = (props: any) => {
  const expTimestamp = parseInt(props.row.Expiry)
  const statusTimestamp = parseInt(props.row.StatusTimestamp)
  const expiryTime = new Date(parseInt(props.row.Expiry) * 1000)
  const now = new Date()
  if (
    expiryTime.getTime() <= now.getTime() &&
    props.row.Status.toLowerCase() === 'open'
  ) {
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
  const { provider } = useWallet()

  const chainId = provider?.network?.chainId
  const dispatch = useDispatch()

  const diva =
    chainId != null
      ? new ethers.Contract(
          config[chainId!].divaAddress,
          DIVA_ABI,
          provider.getSigner()
        )
      : null

  const [open, setOpen] = useState(false)
  const [textFieldValue, setTextFieldValue] = useState('')
  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }
  const expiryTime = new Date(parseInt(props.row.Expiry) * 1000)
  const now = new Date()
  const enabled =
    (expiryTime.getTime() <= now.getTime() &&
      props.row.Status.toLowerCase() === 'open' &&
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
              if (diva != null) {
                diva
                  .setFinalReferenceValue(
                    props.id.split('/')[0],
                    parseEther(textFieldValue),
                    true
                  )
                  .then((tx) => {
                    /**
                     * dispatch action to refetch the pool after action
                     */
                    tx.wait().then(() => {
                      setTimeout(() => {
                        dispatch(
                          fetchPool({
                            graphUrl: config[chainId as number].divaSubgraph,
                            poolId: props.id.split('/')[0],
                          })
                        )
                      }, 10000)
                    })
                  })
                  .catch((err) => {
                    console.error(err)
                  })
              }
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
    field: 'Id',
    align: 'left',
    renderHeader: (header) => <GrayText>{'Pool Id'}</GrayText>,
    renderCell: (cell) => <GrayText>{cell.value}</GrayText>,
  },
  {
    field: 'Icon',
    align: 'right',
    disableReorder: true,
    disableColumnMenu: true,
    headerName: '',
    renderCell: (cell) => <CoinIconPair assetName={cell.value} />,
  },
  {
    field: 'Underlying',
    flex: 1,
    minWidth: 100,
  },
  { field: 'Floor', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Inflection', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Cap', align: 'right', headerAlign: 'right', type: 'number' },
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
    renderCell: (props: any) => (
      <Tooltip
        title={props.row.Challenges.map((challenge) => {
          return '[' + formatEther(challenge.proposedFinalReferenceValue) + '] '
        })}
      >
        <span className="table-cell-trucate">{props.row.Status}</span>
      </Tooltip>
    ),
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
  const wallet = useWallet()
  const chainId = wallet?.provider?.network?.chainId
  const userAddress = wallet?.connection?.userAddress
  const dispatch = useDispatch()
  const [page, setPage] = useState(0)
  useEffect(() => {
    if (config[chainId as number] != null) {
      dispatch(
        fetchPools({
          graphUrl: config[chainId as number].divaSubgraph,
        })
      )
    }
  }, [chainId, dispatch])

  const pools = useAppSelector((state) => poolsSelector(state))
  const rows: GridRowModel[] = pools
    .filter(
      (pool) => pool.dataProvider.toLowerCase() === userAddress.toLowerCase()
    )
    .reduce((acc, val) => {
      const shared = {
        Icon: val.referenceAsset,
        Underlying: val.referenceAsset,
        Floor: formatUnits(val.floor),
        Inflection: formatUnits(val.inflection),
        Cap: formatUnits(val.cap),
        Expiry: val.expiryTime,
        Sell: 'TBD',
        Buy: 'TBD',
        MaxYield: 'TBD',
        Challenges: val.challenges,
      }

      const payOff = {
        Floor: parseInt(val.floor) / 1e18,
        Inflection: parseInt(val.inflection) / 1e18,
        Cap: parseInt(val.cap) / 1e18,
      }

      const Status = val.statusFinalReferenceValue
      return [
        ...acc,
        {
          ...shared,
          id: `${val.id}/long`,
          Id: val.id,
          address: val.longToken,
          PayoffProfile: generatePayoffChartData({
            ...payOff,
            IsLong: true,
          }),
          TVL:
            parseFloat(
              formatUnits(
                BigNumber.from(val.collateralBalance),
                val.collateralToken.decimals
              )
            ).toFixed(4) +
            ' ' +
            val.collateralToken.symbol,
          Status,
          StatusTimestamp: val.statusTimestamp,
          finalValue:
            val.statusFinalReferenceValue === 'Open'
              ? '-'
              : parseFloat(formatEther(val.finalReferenceValue)).toFixed(4),
        },
      ]
    }, [] as GridRowModel[])

  return userAddress ? (
    <Stack
      direction="row"
      sx={{
        height: '100%',
      }}
    >
      <SideMenu />
      <PoolsTable
        page={page}
        disableRowClick
        columns={columns}
        rows={rows}
        onPageChange={(page) => setPage(page)}
      />
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
