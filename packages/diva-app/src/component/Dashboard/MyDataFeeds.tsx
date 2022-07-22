import { GridColDef, GridRowModel } from '@mui/x-data-grid'
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
  Typography,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import React, { useEffect, useState } from 'react'
import { BigNumber, ethers } from 'ethers'
import { config } from '../../constants'
import PoolsTable from '../PoolsTable'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { getDateTime, getExpiryMinutesFromNow } from '../../Util/Dates'
import { formatEther, formatUnits, parseEther } from 'ethers/lib/utils'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { GrayText } from '../Trade/Orders/UiStyles'
import { CoinIconPair } from '../CoinIcon'
import {
  fetchPool,
  fetchPools,
  selectPools,
  selectRequestStatus,
  selectUserAddress,
} from '../../Redux/appSlice'
import { useDispatch } from 'react-redux'
import { useAppDispatch, useAppSelector } from '../../Redux/hooks'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { ExpiresInCell } from '../Markets/Markets'

export const DueInCell = (props: any) => {
  const expTimestamp = new Date(props.row.Expiry).getTime() / 1000
  const statusTimestamp = parseInt(props.row.StatusTimestamp)
  const expiryTime = new Date(props.row.Expiry)
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
        <Tooltip placement="top-end" title={props.row.Expiry}>
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
        </Tooltip>
      ) : (
        <Tooltip placement="top-end" title={props.row.Expiry}>
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
        </Tooltip>
      )
    }
  }
  if (props.row.Status === 'Challenged') {
    const minUntilExp = getExpiryMinutesFromNow(
      statusTimestamp + 48 * 3600 - 5 * 60
    )
    if (minUntilExp < 48 * 60 - 5 && minUntilExp > 0) {
      return minUntilExp === 1 ? (
        <Tooltip placement="top-end" title={props.row.Expiry}>
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
        </Tooltip>
      ) : (
        <Tooltip placement="top-end" title={props.row.Expiry}>
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
        </Tooltip>
      )
    }
  }

  return (
    <Tooltip placement="top-end" title={props.row.Expiry}>
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
    </Tooltip>
  )
}
const SubmitCell = (props: any) => {
  const { provider } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
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
  const [loadingValue, setLoadingValue] = useState(false)
  const [disabledButton, setDisabledButton] = useState(false)
  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }
  const expiryTime = new Date(props.row.Expiry)
  const now = new Date()
  const enabled =
    (expiryTime.getTime() <= now.getTime() &&
      props.row.Status.toLowerCase() === 'open' &&
      expiryTime.getTime() + (24 * 60 - 5) * 60 * 1000 > now.getTime()) ||
    (props.row.Status === 'Challenged' &&
      expiryTime.getTime() + (48 * 60 - 5) * 60 * 1000 > now.getTime())

  return (
    <Container>
      <LoadingButton
        variant="contained"
        onClick={handleOpen}
        disabled={!enabled || disabledButton}
        loading={loadingValue}
      >
        Submit value
      </LoadingButton>
      <Dialog open={open} onClose={handleClose}>
        <DialogContent>
          <DialogContentText>
            Please provide a value for this option
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <TextField
            defaultValue=""
            onChange={(e) => {
              setTextFieldValue(e.target.value)
            }}
          />
          <LoadingButton
            color="primary"
            type="submit"
            loading={loadingValue}
            onClick={() => {
              setLoadingValue(textFieldValue ? true : false)
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
                    tx.wait()
                      .then(() => {
                        setLoadingValue(false)
                        setDisabledButton(true)
                      })
                      .then(() => {
                        setTimeout(() => {
                          dispatch(
                            fetchPools({
                              page: 0,
                              dataProvider: userAddress,
                            })
                          )
                        }, 2000)
                      })
                  })
                  .catch((err) => {
                    console.error(err)
                    setLoadingValue(false)
                  })
              }
              handleClose()
            }}
          >
            Submit value
          </LoadingButton>
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
    headerName: 'Expires in',
    renderCell: (props) => <ExpiresInCell {...props} />,
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
  const userAddress = useAppSelector(selectUserAddress)
  const [page, setPage] = useState(0)
  const dispatch = useDispatch()
  const pools = useAppSelector((state) => selectPools(state))
  const poolsRequestStatus = useAppSelector(selectRequestStatus('app/pools'))

  useEffect(() => {
    if (userAddress != null) {
      dispatch(
        fetchPools({
          page,
          dataProvider: userAddress,
        })
      )
    }
  }, [dispatch, page, userAddress])
  const rows: GridRowModel[] = pools.reduce((acc, val) => {
    const shared = {
      Icon: val.referenceAsset,
      Underlying: val.referenceAsset,
      Floor: formatUnits(val.floor),
      Inflection: formatUnits(val.inflection),
      Cap: formatUnits(val.cap),
      Expiry: getDateTime(val.expiryTime),
      Sell: 'TBD',
      Buy: 'TBD',
      MaxYield: 'TBD',
      Challenges: val.challenges,
    }

    const payOff = {
      CollateralBalanceLong: Number(
        formatUnits(
          val.collateralBalanceLongInitial,
          val.collateralToken.decimals
        )
      ),
      CollateralBalanceShort: Number(
        formatUnits(
          val.collateralBalanceShortInitial,
          val.collateralToken.decimals
        )
      ),
      Floor: Number(formatEther(val.floor)),
      Inflection: Number(formatEther(val.inflection)),
      Cap: Number(formatEther(val.cap)),
      TokenSupply: Number(formatEther(val.supplyInitial)), // Needs adjustment to formatUnits() when switching to the DIVA Protocol 1.0.0 version
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

  return (
    <Stack
      direction="row"
      sx={{
        height: '100%',
      }}
      spacing={6}
      paddingRight={6}
    >
      {!userAddress ? (
        <Typography
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            width: '100%',
          }}
        >
          Please connect your wallet
        </Typography>
      ) : (
        <>
          <PoolsTable
            disableRowClick={true}
            page={page}
            rowCount={9999}
            loading={poolsRequestStatus === 'pending'}
            rows={rows}
            columns={columns}
            onPageChange={(page) => setPage(page)}
          />
        </>
      )}
    </Stack>
  )
}
