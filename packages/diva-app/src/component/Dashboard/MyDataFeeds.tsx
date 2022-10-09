import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Divider,
  Grid,
  InputAdornment,
  Pagination,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useEffect, useMemo, useState } from 'react'
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
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import { FilterDrawerModal } from './FilterDrawerMobile'
import FilterListIcon from '@mui/icons-material/FilterList'
import { Search } from '@mui/icons-material'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import { getColorByStatus, getTopNObjectByProperty } from '../../Util/dashboard'

export const DueInCell = (props: any) => {
  const expTimestamp = new Date(props.row.Expiry).getTime() / 1000
  const statusTimestamp = parseInt(props.row.StatusTimestamp)
  const { isMobile } = useCustomMediaQuery()

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
              height: isMobile ? 'auto' : '150vh',
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
              height: isMobile ? 'auto' : '150vh',
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
              height: isMobile ? 'auto' : '150vh',
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
              height: isMobile ? 'auto' : '150vh',
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
          height: isMobile ? 'auto' : '150vh',
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
  const { isMobile } = useCustomMediaQuery()

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
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        width: isMobile ? 'auto' : '100%',
      }}
    >
      <LoadingButton
        variant="contained"
        onClick={handleOpen}
        // disabled={!enabled || disabledButton}
        disabled={!enabled}
        loading={loadingValue}
        sx={{
          fontSize: isMobile ? '10px' : 'auto',
          padding: isMobile ? '5px 11px' : 'auto',
        }}
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
            sx={{
              fontSize: isMobile ? '10px' : 'auto',
              padding: isMobile ? '5px 11px' : 'auto',
            }}
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
    </Box>
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

const MyDataFeedsTokenCard = ({ row }: { row: GridRowModel }) => {
  if (!row) return

  const { Icon, Id, Floor, finalValue, Cap, Status, Inflection } = row

  const DATA_ARRAY = [
    {
      label: 'Floor',
      value: Floor,
    },
    {
      label: 'Inflection',
      value: Inflection,
    },
    {
      label: 'Cap',
      value: Cap,
    },
    {
      label: 'Final Value',
      value: finalValue,
    },
    {
      label: 'Due In',
      value: 0,
    },
  ]

  return (
    <>
      <Divider light />
      <Stack
        sx={{
          fontSize: '10px',
          width: '100%',
          margin: '12px 0',
        }}
        spacing={1.6}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gridGap: '8px',
            }}
          >
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {Icon}
            </Typography>
            <Typography
              sx={{
                fontSize: '9.2px',
              }}
            >
              #{Id}
            </Typography>
          </Box>
          <Box>
            {Status === 'Open' ? (
              <Stack direction="row" spacing={1.6} alignItems="center">
                <Typography
                  sx={{
                    fontSize: '10px',
                    fontWeight: 500,
                    color: '#828282',
                  }}
                >
                  Expires in
                </Typography>
                <ExpiresInCell row={row} />
              </Stack>
            ) : (
              <Button
                size="small"
                sx={{
                  borderRadius: '40px',
                  fontSize: '10px',
                  background: getColorByStatus(Status).backgroundColor,
                  color: getColorByStatus(Status).fontColor,
                  textTransform: 'capitalize',
                  fontWeight: 400,
                }}
                variant="contained"
              >
                {Status}
              </Button>
            )}
          </Box>
        </Box>
        <Grid
          container
          rowGap={1.6}
          justifyContent="space-between"
          columnGap={'3px'}
        >
          {DATA_ARRAY.map(({ label, value }, i) => (
            <Grid item justifyContent={'space-between'} key={i} xs={3.4}>
              <Stack
                direction="row"
                spacing={2}
                justifyContent={'space-between'}
              >
                <Box
                  sx={{
                    color: '#828282',
                    minWidth: '50px',
                  }}
                >
                  {label}
                </Box>
                <Box>
                  {label === 'Due In' ? <DueInCell row={row} /> : value}
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
        <Stack alignItems="flex-end">
          <SubmitCell row={row} {...row} />
        </Stack>
      </Stack>
      <Divider light />
    </>
  )
}

const MobileFilterOptions = ({
  searchInput,
  setSearchInput,
  rows,
  checkedState,
  setCheckedState,
  setSearch,
  expiredPoolClicked,
  setExpiredPoolClicked,
}) => {
  const top4UnderlyingTokens = useMemo(
    () => getTopNObjectByProperty(rows, 'Underlying', 4),
    [rows]
  )

  const handleOnChange = (position) => {
    const updatedCheckedState = checkedState.map((item, index) =>
      index === position ? !item : item
    )

    setCheckedState(updatedCheckedState)

    const underlyingTokenString = updatedCheckedState
      .map((currentState, index) => {
        if (currentState === true) {
          return top4UnderlyingTokens[index]
        }
      })
      .filter((item) => item !== undefined)
      .map((item) => item.token)
      .join(' ')
      .toString()

    setSearch(underlyingTokenString)
  }

  return (
    <>
      <Accordion
        sx={{
          backgroundColor: '#000000',
          '&:before': {
            display: 'none',
          },
          marginTop: '28px',
        }}
        defaultExpanded
      >
        <AccordionSummary
          aria-controls="panel1a-content"
          id="panel1a-header"
          sx={{
            padding: '0px',
            backgroundColor: '#000000',
          }}
          expandIcon={<ArrowDropUpIcon />}
        >
          <Typography
            sx={{
              fontSize: '16px',
            }}
          >
            Underlying
          </Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            backgroundColor: '#000000',
            padding: '0px',
          }}
        >
          <Box>
            <TextField
              value={searchInput}
              aria-label="Filter creator"
              sx={{ width: '100%', height: '50px', marginTop: '16px' }}
              onChange={(event) => setSearchInput(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="secondary" />
                  </InputAdornment>
                ),
              }}
              placeholder="Enter Underlying"
              color="secondary"
            />
          </Box>
          <Stack
            spacing={0.6}
            sx={{
              marginTop: '16px',
              fontSize: '14px',
            }}
          >
            {top4UnderlyingTokens.map((underlying, index) => (
              <Stack
                direction="row"
                justifyContent={'space-between'}
                alignItems={'center'}
                key={index}
              >
                <Box>{underlying.token}</Box>
                <Checkbox
                  checked={checkedState[index]}
                  id={`custom-checkbox-${index}`}
                  onChange={() => handleOnChange(index)}
                />
              </Stack>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Divider />
      <Stack
        sx={{
          paddingTop: '20px',
        }}
      >
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>Hide Expired Pools</Box>
          <Switch
            checked={expiredPoolClicked}
            onChange={() => setExpiredPoolClicked(!expiredPoolClicked)}
          />
        </Stack>
      </Stack>
    </>
  )
}

export function MyDataFeeds() {
  const userAddress = useAppSelector(selectUserAddress)
  const [page, setPage] = useState(0)
  const [underlyingButtonLabel, setUnderlyingButtonLabel] =
    useState('Underlying')
  const [search, setSearch] = useState('')
  const [expiredPoolClicked, setExpiredPoolClicked] = useState(false)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [checkedState, setCheckedState] = useState(new Array(4).fill(false))

  const dispatch = useDispatch()
  const pools = useAppSelector((state) => selectPools(state))
  const poolsRequestStatus = useAppSelector(selectRequestStatus('app/pools'))
  const { isMobile } = useCustomMediaQuery()

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

  const filteredRows = useMemo(() => {
    if (search != null && search.length > 0) {
      if (expiredPoolClicked) {
        return rows
          .filter((v) => v.Status.includes('Open'))
          .filter(
            (v) =>
              v.Underlying.toLowerCase().includes(search.toLowerCase()) ||
              search.toLowerCase().includes(v.Underlying.toLowerCase())
          )
      } else {
        return rows.filter(
          (v) =>
            v.Underlying.toLowerCase().includes(search.toLowerCase()) ||
            search.toLowerCase().includes(v.Underlying.toLowerCase())
        )
      }
    } else {
      if (expiredPoolClicked) {
        return rows.filter((v) => v.Status.includes('Open'))
      } else {
        return rows
      }
    }
  }, [rows, search, expiredPoolClicked])

  useEffect(() => {
    if (searchInput.length > 0 && searchInput !== null) {
      setCheckedState(new Array(4).fill(false))
      setSearch(searchInput)
    }
  }, [searchInput])

  useEffect(() => {
    if (checkedState.includes(true)) {
      setSearchInput('')
    }
  }, [checkedState])

  return (
    <Stack
      direction="column"
      sx={{
        height: '100%',
      }}
      spacing={6}
      paddingRight={isMobile ? 0 : 6}
    >
      {!isMobile && (
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
            ButtonLabel="Hide Expired"
            onClick={handleExpiredPools}
          />
        </Box>
      )}

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
          {isMobile ? (
            <Stack
              width={'100%'}
              sx={{
                marginTop: '16px',
                marginBottom: '16px',
              }}
              spacing={2}
            >
              {poolsRequestStatus !== 'pending' ? (
                <>
                  <Button
                    onClick={() => {
                      setIsFilterDrawerOpen(!isFilterDrawerOpen)
                    }}
                    startIcon={<FilterListIcon fontSize="small" />}
                    variant="outlined"
                    sx={{
                      width: '84px',
                      height: '30px',
                      fontSize: '13px',
                      padding: '4px 10px',
                      textTransform: 'none',
                    }}
                    color={isFilterDrawerOpen ? 'primary' : 'secondary'}
                  >
                    Filters
                  </Button>
                  <Box>
                    {filteredRows.map((row, i) => (
                      <MyDataFeedsTokenCard row={row} key={i} />
                    ))}
                  </Box>
                  <Pagination
                    sx={{
                      minHeight: '70px',
                      fontSize: '14px',
                    }}
                    count={10}
                    onChange={(e, page) => setPage(page - 1)}
                    page={page + 1}
                  />
                </>
              ) : (
                <CircularProgress
                  sx={{
                    margin: '0 auto',
                    marginTop: 10,
                  }}
                />
              )}
              <FilterDrawerModal
                open={isFilterDrawerOpen}
                onClose={setIsFilterDrawerOpen}
                children={
                  <MobileFilterOptions
                    searchInput={searchInput}
                    setSearchInput={setSearchInput}
                    rows={rows}
                    checkedState={checkedState}
                    setCheckedState={setCheckedState}
                    setSearch={setSearch}
                    expiredPoolClicked={expiredPoolClicked}
                    setExpiredPoolClicked={setExpiredPoolClicked}
                  />
                }
                onApplyFilter={() => {
                  setIsFilterDrawerOpen(false)
                }}
                onClearFilter={() => {
                  setSearch('')
                  setCheckedState(new Array(4).fill(false))
                  setSearchInput('')
                  setExpiredPoolClicked(false)
                }}
              />
            </Stack>
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
        </>
      )}
    </Stack>
  )
}
