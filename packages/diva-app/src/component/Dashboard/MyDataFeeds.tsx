import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import {
  Box,
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
import { useEffect, useState } from 'react'
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
  fetchPools,
  selectPools,
  selectRequestStatus,
  selectUserAddress,
} from '../../Redux/appSlice'
import { useDispatch } from 'react-redux'
import { useAppSelector } from '../../Redux/hooks'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { useGovernanceParameters } from '../../hooks/useGovernanceParameters'
import { ExpiresInCell } from '../Markets/Markets'
import ButtonFilter from '../PoolsTableFilter/ButtonFilter'
import DropDownFilter from '../PoolsTableFilter/DropDownFilter'
import { getAppStatus } from '../../Util/getAppStatus'

export const DueInCell = (props: any) => {
  const expTimestamp = new Date(props.row.Expiry).getTime() / 1000
  const statusTimestamp = parseInt(props.row.StatusTimestamp)

  if (props.row.Status === 'Expired') {
    const minUntilExp = getExpiryMinutesFromNow(
      expTimestamp + props.row.SubmissionPeriod
    )

    if (minUntilExp < props.row.SubmissionPeriod && minUntilExp > 0) {
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
      statusTimestamp + props.row.ReviewPeriod
    )

    if (minUntilExp < props.row.ReviewPeriod && minUntilExp > 0) {
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

  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const expiryTime = new Date(props.row.Expiry)
  const statusTimestamp = props.row.StatusTimestamp * 1000
  const now = new Date()

  // Set relevant start time for submissionPeriodEnd calculations. Before expiry, the expiryTime is the relevant start time.
  // After expiry, when status == Challenged, the statusTimestamp (i.e. time of challenge) is the relevant start time.
  const relevantStartTime =
    statusTimestamp < expiryTime.getTime()
      ? expiryTime.getTime()
      : statusTimestamp

  // Flag for enabling the SUBMIT VALUE button
  const enabled =
    (props.row.Status === 'Expired' &&
      now.getTime() < relevantStartTime + props.row.SubmissionPeriod * 1000) ||
    (props.row.Status === 'Challenged' &&
      now.getTime() < relevantStartTime + props.row.ChallengePeriod * 1000)

  return (
    <Container>
      <LoadingButton
        variant="contained"
        onClick={handleOpen}
        // disabled={!enabled || disabledButton}
        disabled={!enabled}
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
                    tx.wait().then(() => {
                      setTimeout(() => {
                        dispatch(
                          fetchPools({
                            page: 0,
                            dataProvider: userAddress,
                          })
                        )
                        setLoadingValue(false)
                      }, 10000)
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
  const [underlyingButtonLabel, setUnderlyingButtonLabel] =
    useState('Underlying')
  const [search, setSearch] = useState(null)
  const [expiredPoolClicked, setExpiredPoolClicked] = useState(false)

  const dispatch = useDispatch()
  const pools = useAppSelector((state) => selectPools(state))
  const poolsRequestStatus = useAppSelector(selectRequestStatus('app/pools'))


  const handleUnderLyingInput = (e) => {
    setSearch(e.target.value)
    setUnderlyingButtonLabel(
      e.target.value === '' ? 'Underlying' : e.target.value
    )
  }
  const handleExpiredPools = () => {
    if (expiredPoolClicked) {
      setExpiredPoolClicked(false)
    } else {
      setExpiredPoolClicked(true)
    }
  }

  const { submissionPeriod, challengePeriod, reviewPeriod, fallbackPeriod } =
    useGovernanceParameters()

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

    const { status, finalValue } = getAppStatus(
      val.expiryTime,
      val.statusTimestamp,
      val.statusFinalReferenceValue,
      val.finalReferenceValue,
      val.inflection,
      submissionPeriod,
      challengePeriod,
      reviewPeriod,
      fallbackPeriod
    )

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
        Status: status,
        StatusTimestamp: val.statusTimestamp,
        finalValue: finalValue,
        SubmissionPeriod: submissionPeriod,
        ReviewPeriod: reviewPeriod,
        ChallengePeriod: challengePeriod,
      },
    ]
  }, [] as GridRowModel[])

  const filteredRows =
    search != null && search.length > 0
      ? expiredPoolClicked
        ? rows
            .filter((v) => v.Status.includes('Open'))
            .filter((v) =>
              v.Underlying.toLowerCase().includes(search.toLowerCase())
            )
        : rows.filter((v) =>
            v.Underlying.toLowerCase().includes(search.toLowerCase())
          )
      : expiredPoolClicked
      ? rows.filter((v) => v.Status.includes('Open'))
      : rows

  return (
    <Stack
      direction="column"
      sx={{
        height: '100%',
      }}
      spacing={4}
    >
      <Box
        paddingY={2}
        sx={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <DropDownFilter
          id="Underlying Filter"
          DropDownButtonLabel={underlyingButtonLabel}
          InputValue={search}
          onInputChange={handleUnderLyingInput}
        />
        <ButtonFilter
          id="Hide expired pools"
          ButtonLabel="Hide Expired Pools"
          onClick={handleExpiredPools}
        />
      </Box>
      <Stack
        direction="row"
        sx={{
          height: '100%',
        }}
        spacing={6}
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
          <PoolsTable
            disableRowClick={true}
            page={page}
            rowCount={9999}
            loading={poolsRequestStatus === 'pending'}
            rows={filteredRows}
            columns={columns}
            onPageChange={(page) => setPage(page)}
            selectedPoolsView="Table"
          />
        )}
      </Stack>
    </Stack>
  )
}
