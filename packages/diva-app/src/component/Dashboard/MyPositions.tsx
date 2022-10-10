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
import { BigNumber, ethers } from 'ethers'
import { config } from '../../constants'
import PoolsTable, { PayoffCell } from '../PoolsTable'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { getDateTime, getExpiryMinutesFromNow } from '../../Util/Dates'
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers/lib/utils'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { useQuery } from 'react-query'
import ERC20 from '@diva/contracts/abis/erc20.json'
import styled from 'styled-components'
import { GrayText } from '../Trade/Orders/UiStyles'
import React, { useEffect, useMemo, useState } from 'react'
import { CoinIconPair } from '../CoinIcon'
import { useAppSelector } from '../../Redux/hooks'
import {
  fetchPool,
  fetchPositionTokens,
  selectIntrinsicValue,
  selectPools,
  selectPositionTokens,
  selectUserAddress,
} from '../../Redux/appSlice'
import { useDispatch } from 'react-redux'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { useGovernanceParameters } from '../../hooks/useGovernanceParameters'
import { ExpiresInCell } from '../Markets/Markets'
import { getAppStatus, statusDescription } from '../../Util/getAppStatus'
import BalanceCheckerABI from '../../abi/BalanceCheckerABI.json'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import DropDownFilter from '../PoolsTableFilter/DropDownFilter'
import ButtonFilter from '../PoolsTableFilter/ButtonFilter'
import FilterListIcon from '@mui/icons-material/FilterList'
import { FilterDrawerModal } from './FilterDrawerMobile'
import { useHistory } from 'react-router-dom'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import { Search } from '@mui/icons-material'
import { getTopNObjectByProperty, getColorByStatus } from '../../Util/dashboard'

type Response = {
  [token: string]: BigNumber
}

const MetaMaskImage = styled.img`
  width: 20px;
  height: 20px;
  cursor: pointer;
`
const AddToMetamask = (props: any) => {
  const { provider } = useConnectionContext()

  const handleAddMetaMask = async (e) => {
    e.stopPropagation()
    const token = new ethers.Contract(
      props.row.address.id,
      ERC20,
      provider.getSigner()
    )
    const decimal = await token.decimals()
    const tokenSymbol =
      props.row.id.split('/')[1][0].toUpperCase() + props.row.id.split('/')[0]
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: props.row.address.id,
            symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: decimal,
            image:
              'https://res.cloudinary.com/dphrdrgmd/image/upload/v1641730802/image_vanmig.png',
          },
        } as any,
      })
    } catch (error) {
      console.error('Error in HandleAddMetaMask', error)
    }
  }
  return (
    <>
      <Tooltip title="Add to Metamask">
        <MetaMaskImage
          src="/images/metamask.svg"
          alt="metamask"
          onClick={handleAddMetaMask}
        />
      </Tooltip>
    </>
  )
}

const MobileFilterOptions = ({
  setSearch,
  expiredPoolClicked,
  setExpiredPoolClicked,
  confirmedPoolClicked,
  setConfirmedPoolClicked,
  rows,
  checkedState,
  setCheckedState,
  searchInput,
  setSearchInput,
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
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>Confirmed Pools</Box>
          <Switch
            checked={confirmedPoolClicked}
            onChange={() => setConfirmedPoolClicked(!confirmedPoolClicked)}
          />
        </Stack>
      </Stack>
    </>
  )
}

const SubmitButton = (props: any) => {
  const [open, setOpen] = React.useState(false)
  const [textFieldValue, setTextFieldValue] = useState('')
  const [loadingValue, setLoadingValue] = useState(false)
  const [disabledButton, setDisabledButton] = useState(false)

  const { provider } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const { isMobile } = useCustomMediaQuery()

  const dispatch = useDispatch()
  const chainId = provider?.network?.chainId
  if (chainId == null) return null

  const diva = new ethers.Contract(
    config[chainId].divaAddress,
    DIVA_ABI,
    provider?.getSigner()
  )

  const token =
    provider && new ethers.Contract(props.row.address.id, ERC20, provider)
  const handleRedeem = (e) => {
    setLoadingValue(true)
    e.stopPropagation()
    if (props.row.Status === 'Confirmed*') {
      diva
        .getPoolParameters(props.id.split('/')[0])
        .then((pool) => {
          if (pool.statusFinalReferenceValue === 0) {
            token
              ?.balanceOf(userAddress)
              .then((bal: BigNumber) => {
                diva
                  .setFinalReferenceValue(
                    props.id.split('/')[0],
                    parseEther(props.row.Inflection),
                    false
                  )
                  .then((tx) => {
                    tx.wait()
                      .then(() => {
                        diva
                          .redeemPositionToken(props.row.address.id, bal)
                          .then((tx: any) => {
                            tx.wait().then(() => {
                              /**
                               * dispatch action to refetch the pool after action
                               */
                              setDisabledButton(true)
                              dispatch(
                                fetchPool({
                                  graphUrl:
                                    config[chainId as number].divaSubgraph,
                                  poolId: props.id.split('/')[0],
                                })
                              )
                              setLoadingValue(false)
                            })
                          })
                          .catch((err) => {
                            setLoadingValue(false)
                            console.error(err)
                          })
                      })
                      .catch((err) => {
                        console.error(err)
                        setLoadingValue(false)
                      })
                  })
                  .catch((err) => {
                    console.error(err)
                    setLoadingValue(false)
                  })
              })
              .catch((err) => {
                console.error(err)
                setLoadingValue(false)
              })
          } else {
            token
              ?.balanceOf(userAddress)
              .then((bal: BigNumber) => {
                diva
                  .redeemPositionToken(props.row.address.id, bal)
                  .then((tx: any) => {
                    tx.wait().then(() => {
                      setLoadingValue(false)
                      setDisabledButton(true)
                    })
                  })
                  .catch((err) => {
                    console.error(err)
                    setLoadingValue(false)
                  })
              })
              .catch((err) => {
                console.error(err)
                setLoadingValue(false)
              })
          }
        })
        .catch((err) => {
          console.error(err)
          setLoadingValue(false)
        })
    } else {
      token
        ?.balanceOf(userAddress)
        .then((bal: BigNumber) => {
          diva
            .redeemPositionToken(props.row.address.id, bal)
            .then((tx: any) => {
              tx.wait().then(() => {
                setLoadingValue(false)
                setDisabledButton(true)
              })
            })
            .catch((err) => {
              console.error(err)
              setLoadingValue(false)
            })
        })
        .catch((err) => {
          console.error(err)
          setLoadingValue(false)
        })
    }
  }

  let buttonName: string

  const statusExpMin = getExpiryMinutesFromNow(
    Number(props.row.StatusTimestamp)
  )
  if (props.row.Status === 'Submitted') {
    if (statusExpMin + 24 * 60 + 5 < 0) {
      buttonName = 'Redeem'
    } else {
      buttonName = 'Challenge'
    }
  } else if (props.row.Status === 'Challenged') {
    if (statusExpMin + 48 * 60 + 5 < 0) {
      buttonName = 'Redeem'
    } else {
      buttonName = 'Challenge'
    }
  } else if (props.row.Status.startsWith('Confirmed')) {
    buttonName = 'Redeem'
  } else if (
    props.row.Status === 'Expired' &&
    statusExpMin + 24 * 60 * 5 + 5 < 0
  ) {
    buttonName = 'Redeem'
  }
  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    if (loadingValue === false) {
      setOpen(false)
    }
  }

  if (buttonName === 'Redeem') {
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
          color={buttonName === 'Redeem' ? 'success' : 'primary'}
          disabled={disabledButton}
          loading={loadingValue}
          onClick={handleRedeem}
          sx={{
            fontSize: isMobile ? '10px' : 'auto',
            padding: isMobile ? '5px 11px' : 'auto',
          }}
        >
          {buttonName}
        </LoadingButton>
      </Box>
    )
  } else if (buttonName === 'Challenge') {
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
          loading={loadingValue}
          onClick={(e) => {
            e.stopPropagation()
            handleOpen()
          }}
          sx={{
            fontSize: isMobile ? '10px' : 'auto',
            padding: isMobile ? '5px 11px' : 'auto',
          }}
        >
          Challenge
        </LoadingButton>
        <Dialog open={open} onClose={handleClose}>
          <DialogContent>
            <DialogContentText>
              Please provide a value for this option
            </DialogContentText>
          </DialogContent>

          <DialogActions>
            <TextField
              autoFocus={true}
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
              onClick={(e) => {
                setLoadingValue(textFieldValue ? true : false)
                if (diva != null) {
                  diva
                    .challengeFinalReferenceValue(
                      props.id.split('/')[0],
                      parseEther(textFieldValue)
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
                        setLoadingValue(false)
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
              Challenge
            </LoadingButton>
          </DialogActions>
        </Dialog>
      </Box>
    )
  } else {
    return <></>
  }
}

const Payoff = (props: any) => {
  const intrinsicValue = useAppSelector((state) =>
    selectIntrinsicValue(
      state,
      props.row.Payoff.id,
      props.row.finalValue != '-'
        ? parseEther(props.row.finalValue).toString()
        : '-'
    )
  )
  if (
    intrinsicValue != null &&
    props.row.finalValue != '-' &&
    intrinsicValue.payoffPerShortToken != null &&
    intrinsicValue.payoffPerLongToken != null
  ) {
    if (props.row.Id.toLowerCase().startsWith('s')) {
      return (
        <div>
          {(
            parseFloat(
              formatUnits(
                intrinsicValue.payoffPerShortToken,
                props.row.Payoff.collateralToken.decimals
              )
            ) * props.row.Balance
          ).toFixed(4)}
        </div>
      )
    } else {
      return (
        <div>
          {(
            parseFloat(
              formatUnits(
                intrinsicValue.payoffPerLongToken,
                props.row.Payoff.collateralToken.decimals
              )
            ) * props.row.Balance
          ).toFixed(4)}
        </div>
      )
    }
  } else {
    return <>-</>
  }
}

const columns: GridColDef[] = [
  {
    field: 'Id',
    align: 'left',
    renderHeader: (header) => <GrayText>{'Asset Id'}</GrayText>,
    renderCell: (cell) => <GrayText>{cell.value}</GrayText>,
  },
  {
    field: 'Icon',
    align: 'right',
    disableReorder: true,
    disableColumnMenu: true,
    headerName: '',
    width: 70,
    renderCell: (cell) => <CoinIconPair assetName={cell.value} />,
  },
  {
    field: 'Underlying',
    flex: 1,
    minWidth: 100,
  },
  {
    field: 'PayoffProfile',
    headerName: 'Payoff Profile',
    disableReorder: true,
    disableColumnMenu: true,
    minWidth: 120,
    renderCell: (cell) => <PayoffCell data={cell.value} />,
  },
  { field: 'Floor', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Cap', align: 'right', headerAlign: 'right', type: 'number' },
  {
    field: 'Inflection',
    align: 'right',
    headerAlign: 'right',
    type: 'number',
    hide: true,
  },
  {
    field: 'Gradient',
    align: 'right',
    headerAlign: 'right',
    type: 'number',
    hide: true,
  },
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
    field: 'TVL',
    align: 'right',
    headerAlign: 'right',
    minWidth: 150,
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
    renderCell: (cell: any) => {
      return (
        <Tooltip placement="top-end" title={statusDescription[cell.value]}>
          <span className="table-cell-trucate">{cell.value}</span>
        </Tooltip>
      )
    },
  },
  {
    field: 'Balance',
    align: 'right',
    headerAlign: 'right',
  },
  {
    field: 'Payoff',
    align: 'right',
    headerAlign: 'right',
    renderCell: (props) => <Payoff {...props} />,
  },
  {
    field: 'submitValue',
    align: 'right',
    headerAlign: 'right',
    headerName: '',
    minWidth: 200,
    renderCell: (props) => <SubmitButton {...props} buttonName="yolo" />,
  },

  {
    field: 'addToMetamask',
    align: 'left',
    headerAlign: 'right',
    headerName: '',
    minWidth: 20,
    renderCell: (props) => <AddToMetamask {...props} />,
  },
]

const MyPositionsTokenCard = ({ row }: { row: GridRowModel }) => {
  const history = useHistory()

  if (!row) return

  const { Icon, Id, Floor, TVL, finalValue, Cap, Balance, Status } = row

  const DATA_ARRAY = [
    {
      label: 'Floor',
      value: Floor,
    },
    {
      label: 'TVL',
      value: TVL,
    },
    {
      label: 'Final Value',
      value: finalValue,
    },
    {
      label: 'Cap',
      value: Cap,
    },
    {
      label: 'Balance',
      value: Balance,
    },
    {
      label: 'Payoff',
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
        onClick={() => {
          history.push(`../../${row.id}`)
        }}
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
            <AddToMetamask row={row} />
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
            <Grid
              item
              key={i}
              xs={3}
              sx={{
                flexGrow: 1,
              }}
            >
              <Stack direction="row" justifyContent={'space-between'}>
                <Box
                  sx={{
                    color: '#828282',
                  }}
                >
                  {label}
                </Box>
                <Box>{label === 'Payoff' ? <Payoff row={row} /> : value}</Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
        <Stack alignItems="flex-end">
          <SubmitButton row={row} buttonName="yolo" {...row} />
        </Stack>
      </Stack>
      <Divider light />
    </>
  )
}

export function MyPositions() {
  const [page, setPage] = useState(0)
  const [underlyingButtonLabel, setUnderlyingButtonLabel] =
    useState('Underlying')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [expiredPoolClicked, setExpiredPoolClicked] = useState(false)
  const [confirmedPoolClicked, setConfirmedPoolClicked] = useState(false)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [checkedState, setCheckedState] = useState(new Array(4).fill(false))

  const { provider, chainId } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const tokenPools = useAppSelector(selectPools)
  const positionTokens = useAppSelector(selectPositionTokens)
  const dispatch = useDispatch()
  const { submissionPeriod, challengePeriod, reviewPeriod, fallbackPeriod } =
    useGovernanceParameters()
  const { isMobile } = useCustomMediaQuery()

  useEffect(() => {
    dispatch(
      fetchPositionTokens({
        page,
      })
    )
  }, [dispatch, page, userAddress])

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
  const handleConfirmedPools = () => {
    if (confirmedPoolClicked) {
      setConfirmedPoolClicked(false)
    } else {
      setConfirmedPoolClicked(true)
    }
  }

  const rows: GridRowModel[] = tokenPools.reduce((acc, val) => {
    const { finalValue, status } = getAppStatus(
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

    const shared = {
      Id: val.id,
      Icon: val.referenceAsset,
      Underlying: val.referenceAsset,
      Floor: formatUnits(val.floor),
      Inflection: formatUnits(val.inflection),
      Cap: formatUnits(val.cap),
      Expiry: getDateTime(val.expiryTime),
      Sell: 'TBD',
      Buy: 'TBD',
      MaxYield: 'TBD',
      StatusTimestamp: val.statusTimestamp,
      Payoff: val,
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

    return [
      ...acc,
      {
        ...shared,
        id: `${val.id}/long`,
        Id: 'L' + val.id,
        address: val.longToken,
        Gradient: Number(
          formatUnits(
            BigNumber.from(val.collateralBalanceLongInitial)
              .mul(parseUnits('1', val.collateralToken.decimals))
              .div(
                BigNumber.from(val.collateralBalanceLongInitial).add(
                  BigNumber.from(val.collateralBalanceShortInitial)
                )
              ),
            val.collateralToken.decimals
          )
        ).toFixed(2),
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalance),
              val.collateralToken.decimals
            )
          ).toFixed(2) +
          ' ' +
          val.collateralToken.symbol,
        PayoffProfile: generatePayoffChartData({
          ...payOff,
          IsLong: true,
        }),
        Status: status,
        finalValue: finalValue,
      },
      {
        ...shared,
        id: `${val.id}/short`,
        Id: 'S' + val.id,
        address: val.shortToken,
        Gradient: Number(
          formatUnits(
            BigNumber.from(val.collateralBalanceShortInitial)
              .mul(parseUnits('1', val.collateralToken.decimals))
              .div(
                BigNumber.from(val.collateralBalanceLongInitial).add(
                  BigNumber.from(val.collateralBalanceShortInitial)
                )
              ),
            val.collateralToken.decimals
          )
        ).toFixed(2),
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalance),
              val.collateralToken.decimals
            )
          ).toFixed(2) +
          ' ' +
          val.collateralToken.symbol,
        PayoffProfile: generatePayoffChartData({
          ...payOff,
          IsLong: false,
        }),
        Status: status,
        finalValue: finalValue,
      },
    ]
  }, [] as GridRowModel[])

  const tokenAddresses = positionTokens.map((v) => v.id)

  /**
   * TODO: Move into redux
   */
  const balances = useQuery<Response>(`balance-${userAddress}`, async () => {
    let response: Response = {}
    if (!userAddress) {
      console.warn('wallet not connected')
      return Promise.resolve({})
    }

    const tokenAddressesChunks = tokenAddresses.reduce(
      (resultArray, item, index) => {
        const batchIndex = Math.floor(index / 400)
        if (!resultArray[batchIndex]) {
          resultArray[batchIndex] = []
        }
        resultArray[batchIndex].push(item)
        return resultArray
      },
      []
    )
    const contract = new ethers.Contract(
      config[chainId].balanceCheckAddress,
      BalanceCheckerABI,
      provider
    )
    await Promise.all(
      tokenAddressesChunks.map(async (batch) => {
        try {
          const userAddressArray = Array(batch.length).fill(userAddress)
          const res = await contract.balances(userAddressArray, batch)
          response = batch.reduce(
            (obj, key, index) => ({ ...obj, [key]: res[index] }),
            {}
          )
        } catch (error) {
          console.error(error)
        }
      })
    )
    return response
  })

  /**
   * After navigating from success page we need to refetch balances in order
   * to capture the newly added pool. We only want to do this once to not overfetch
   */
  useEffect(() => {
    setTimeout(() => {
      if (userAddress != null && balances != null) {
        balances.refetch()
      }
    }, 1000)
  }, [userAddress])

  const tokenBalances = balances.data

  const filteredRows =
    tokenBalances != null
      ? rows
          .filter(
            (value, index, self) =>
              index === self.findIndex((t) => t.id === value.id)
          )
          .filter(
            (v) =>
              tokenBalances[v.address.id] != null &&
              tokenBalances[v.address.id].gt(0)
          )
          .map((v) => ({
            ...v,
            Balance:
              tokenBalances[v.address.id] == null
                ? 'n/a'
                : tokenBalances[v.address.id].lt(parseUnits('1', 16))
                ? '<0.01'
                : parseFloat(formatUnits(tokenBalances[v.address.id])).toFixed(
                    4
                  ),
          }))
      : []

  const filteredRowsByOptions = useMemo(() => {
    if (search != null && search.length > 0) {
      if (expiredPoolClicked) {
        return filteredRows
          .filter(
            (v) =>
              search.toLowerCase().includes(v.Underlying.toLowerCase()) ||
              v.Underlying.toLowerCase().includes(search.toLowerCase())
          )
          .filter((v) => v.Status.includes('Open'))
      } else if (confirmedPoolClicked) {
        return filteredRows
          .filter(
            (v) =>
              search.toLowerCase().includes(v.Underlying.toLowerCase()) ||
              v.Underlying.toLowerCase().includes(search.toLowerCase())
          )
          .filter((v) => v.Status.includes('Confirmed'))
      } else {
        return filteredRows.filter(
          (v) =>
            search.toLowerCase().includes(v.Underlying.toLowerCase()) ||
            v.Underlying.toLowerCase().includes(search.toLowerCase())
        )
      }
    } else if (expiredPoolClicked) {
      return filteredRows.filter((v) => v.Status.includes('Open'))
    } else if (confirmedPoolClicked) {
      return filteredRows.filter((v) => v.Status.includes('Confirmed'))
    } else {
      return filteredRows
    }
  }, [filteredRows, search, expiredPoolClicked, confirmedPoolClicked])

  const sortedRows = filteredRowsByOptions.sort((a, b) => {
    const aId = parseFloat(a.Id.substring(1))
    const bId = parseFloat(b.Id.substring(1))

    return bId - aId
  })

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
      paddingRight={isMobile ? 0 : 6}
      spacing={4}
    >
      {!isMobile && (
        <Box
          paddingY={2}
          sx={{
            display: 'flex',
            flexDirection: 'row',
            maxWidth: '400px',
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
            sx={{ marginRight: '30px' }}
            ButtonLabel="Hide Expired"
            onClick={handleExpiredPools}
          />
          <ButtonFilter
            id="Confirmed Pools"
            ButtonLabel="Confirmed"
            onClick={handleConfirmedPools}
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
              {!balances.isLoading ? (
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
                    {sortedRows.map((row) => (
                      <MyPositionsTokenCard row={row} key={row.Id} />
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
                    setSearch={setSearch}
                    expiredPoolClicked={expiredPoolClicked}
                    setExpiredPoolClicked={setExpiredPoolClicked}
                    confirmedPoolClicked={confirmedPoolClicked}
                    setConfirmedPoolClicked={setConfirmedPoolClicked}
                    rows={rows}
                    checkedState={checkedState}
                    setCheckedState={setCheckedState}
                    searchInput={searchInput}
                    setSearchInput={setSearchInput}
                  />
                }
                onApplyFilter={() => {
                  setIsFilterDrawerOpen(false)
                }}
                onClearFilter={() => {
                  setSearch('')
                  setExpiredPoolClicked(false)
                  setConfirmedPoolClicked(false)
                  setSearchInput('')
                  setCheckedState(new Array(4).fill(false))
                }}
              />
            </Stack>
          ) : (
            <PoolsTable
              page={page}
              rows={filteredRowsByOptions && sortedRows}
              loading={balances.isLoading}
              rowCount={3000}
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
