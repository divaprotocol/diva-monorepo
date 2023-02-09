import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
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
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import React, { useEffect, useMemo, useState } from 'react'
import { BigNumber, ethers } from 'ethers'
import { config } from '../../constants'
import PoolsTable from '../PoolsTable'
import ERC20 from '../../abi/ERC20ABI.json'
import DIVA_ABI from '../../abi/DIVAABI.json'
import TELLOR_ABI from '../../abi/TellorPlayground.json'
import DIVA_ORACLE_TELLOR_ABI from '../../abi/DivaOracleTellor.json'
import {
  getDateTime,
  getExpiryMinutesFromNow,
  userTimeZone,
} from '../../Util/Dates'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { GrayText } from '../Trade/Orders/UiStyles'
import { CoinIconPair } from '../CoinIcon'
import {
  fetchPools,
  selectChainId,
  selectPools,
  selectRequestStatus,
  selectUserAddress,
} from '../../Redux/appSlice'
import { useDispatch } from 'react-redux'
import { useAppSelector } from '../../Redux/hooks'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { ExpiresInCell } from '../Markets/Markets'
import ButtonFilter from '../PoolsTableFilter/ButtonFilter'
import DropDownFilter from '../PoolsTableFilter/DropDownFilter'
import { getAppStatus } from '../../Util/getAppStatus'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import { FilterDrawerModal } from '../Dashboard/FilterDrawerMobile'
import FilterListIcon from '@mui/icons-material/FilterList'
import { Search } from '@mui/icons-material'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import { getColorByStatus, getTopNObjectByProperty } from '../../Util/dashboard'
import useTheme from '@mui/material/styles/useTheme'
import request from 'graphql-request'
import { queryReport, WhitelistCollateralToken } from '../../lib/queries'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import { useWhitelist } from '../../hooks/useWhitelist'

export const UndisputedCell = (props: any) => {
  const minUntilExp = 0 - getExpiryMinutesFromNow(props.row.Reports[0]?.time)
  if (minUntilExp > 0) {
    if ((minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) > 0) {
      // More than a day
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) +
              'd ' +
              ((minUntilExp % (60 * 24)) - (minUntilExp % 60)) / 60 +
              'h ' +
              (minUntilExp % 60) +
              'm '}
          </span>
        </Tooltip>
      )
    } else if (
      (minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) === 0 &&
      (minUntilExp - (minUntilExp % 60)) / 60 > 0
    ) {
      // Less than a day but more than an hour
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp - (minUntilExp % 60)) / 60 +
              'h ' +
              (minUntilExp % 60) +
              'm '}
          </span>
        </Tooltip>
      )
    } else if ((minUntilExp - (minUntilExp % 60)) / 60 === 0) {
      // Less than an hour
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp % 60) + 'm '}
          </span>
        </Tooltip>
      )
    }
  } else if (Object.is(0, minUntilExp)) {
    // Using Object.is() to differentiate between +0 and -0
    return (
      <Tooltip
        placement="top-end"
        title={props.row.Expiry + ', ' + userTimeZone()}
      >
        <span className="table-cell-trucate">{'<1m'}</span>
      </Tooltip>
    )
  } else {
    return (
      <Tooltip
        placement="top-end"
        title={props.row.Expiry + ', ' + userTimeZone()}
      >
        <span className="table-cell-trucate">{'-'}</span>
      </Tooltip>
    )
  }
}
export const DueInCell = (props: any) => {
  const expTimestamp = new Date(props.row.Expiry.replace(/-/g, '/')).getTime()
  const minUntilExp = getExpiryMinutesFromNow(
    expTimestamp / 1000 + Number(props.row.SubmissionPeriod)
  )
  if (minUntilExp > 0) {
    if ((minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) > 0) {
      // More than a day
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) +
              'd ' +
              ((minUntilExp % (60 * 24)) - (minUntilExp % 60)) / 60 +
              'h ' +
              (minUntilExp % 60) +
              'm '}
          </span>
        </Tooltip>
      )
    } else if (
      (minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) === 0 &&
      (minUntilExp - (minUntilExp % 60)) / 60 > 0
    ) {
      // Less than a day but more than an hour
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp - (minUntilExp % 60)) / 60 +
              'h ' +
              (minUntilExp % 60) +
              'm '}
          </span>
        </Tooltip>
      )
    } else if ((minUntilExp - (minUntilExp % 60)) / 60 === 0) {
      // Less than an hour
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp % 60) + 'm '}
          </span>
        </Tooltip>
      )
    }
  } else if (Object.is(0, minUntilExp)) {
    // Using Object.is() to differentiate between +0 and -0
    return (
      <Tooltip
        placement="top-end"
        title={props.row.Expiry + ', ' + userTimeZone()}
      >
        <span className="table-cell-trucate">{'<1m'}</span>
      </Tooltip>
    )
  } else {
    return (
      <Tooltip
        placement="top-end"
        title={props.row.Expiry + ', ' + userTimeZone()}
      >
        <span className="table-cell-trucate">{'-'}</span>
      </Tooltip>
    )
  }
}
const decodeOracleValue = (tellorValue) => {
  return new ethers.utils.AbiCoder().decode(['uint256', 'uint256'], tellorValue)
}
const SubmitCell = (props: any) => {
  const { provider } = useConnectionContext()
  const chainId = provider?.network?.chainId
  const dispatch = useDispatch()
  const { isMobile } = useCustomMediaQuery()
  const { collateralTokens } = useWhitelist()

  const diva =
    chainId != null
      ? new ethers.Contract(
          config[chainId!].divaAddress,
          DIVA_ABI,
          provider.getSigner()
        )
      : null

  const tellor =
    chainId != null
      ? new ethers.Contract(
          config[chainId!].tellorAddress,
          TELLOR_ABI,
          provider.getSigner()
        )
      : null

  const divaOracleTellor =
    chainId != null
      ? new ethers.Contract(
          config[chainId!].divaOracleTellorAddress,
          DIVA_ORACLE_TELLOR_ABI,
          provider.getSigner()
        )
      : null

  const [openReport, setOpenReport] = useState(false)
  const [openTip, setOpenTip] = useState(false)
  const [openDispute, setOpenDispute] = useState(false)
  const [openSettlement, setOpenSettlement] = useState(false)
  const [reportValue, setReportValue] = useState('')
  const [colUsdVal, setColUsdVal] = useState('1')
  const [tipValue, setTipValue] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [referenceAssetSearch, setReferenceAssetSearch] = useState('')
  const [collateralToken, setCollateralToken] = useState<any>('')
  const [undisputedPeriod, setUndisputedPeriod] = useState(0)

  useEffect(() => {
    divaOracleTellor?.getMinPeriodUndisputed().then((period) => {
      setUndisputedPeriod(period * 1000)
    })
  }, [divaOracleTellor])
  const handleOpenReport = () => {
    setOpenReport(true)
  }
  const handleOpenTip = () => {
    setOpenTip(true)
  }
  const handleCloseReport = () => {
    setOpenReport(false)
  }
  const handleCloseTip = () => {
    setOpenTip(false)
  }
  const handleOpenDispute = () => {
    setOpenDispute(true)
  }
  const handleCloseDispute = () => {
    setOpenDispute(false)
  }
  const handleOpenSettlement = () => {
    setOpenSettlement(true)
  }
  const handleCloseSettlement = () => {
    setOpenSettlement(false)
  }

  const expiryTime = new Date(props.row.Expiry)
  const statusTimestamp = props.row.StatusTimestamp * 1000
  const now = new Date()

  const relevantStartTime =
    statusTimestamp < expiryTime.getTime()
      ? expiryTime.getTime()
      : statusTimestamp
  const reportEnabled = props.row.Status === 'Expired'
  const tipEnabled =
    props.row.Status === 'Expired' || props.row.Status === 'About To Expire'
  // props.row.Status === 'Expired' &&
  const disputeEnabled = props.row.Reports.length !== 0 //|| props.row.Status === 'Challenged'
  const settleEnabled =
    // props.row.Status === 'Reported' &&
    now.getTime() > props.row.Reports[0]?.time * 1000 + undisputedPeriod

  const possibleOptions =
    collateralTokens?.filter((v) =>
      v.symbol.includes(referenceAssetSearch.trim())
    ) || []
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        width: isMobile ? 'auto' : '100%',
      }}
    >
      <LoadingButton
        variant="contained"
        onClick={handleOpenReport}
        disabled={!reportEnabled}
        loading={reportLoading}
        sx={{
          backgroundColor: '#9B51E0',
          fontSize: isMobile ? '10px' : 'auto',
          padding: isMobile ? '5px 11px' : 'auto',
        }}
      >
        Report
      </LoadingButton>
      <Dialog open={openReport} onClose={handleCloseReport}>
        <DialogContent>
          <DialogContentText>
            Please provide a value for this option and usd value of collateral
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <TextField
            defaultValue=""
            onChange={(e) => {
              setReportValue(e.target.value)
            }}
          />
          <TextField
            defaultValue=""
            onChange={(e) => {
              setColUsdVal(e.target.value)
            }}
          />
          <LoadingButton
            color="primary"
            type="submit"
            loading={reportLoading}
            sx={{
              fontSize: isMobile ? '10px' : 'auto',
              padding: isMobile ? '5px 11px' : 'auto',
            }}
            onClick={() => {
              setReportLoading(reportValue ? true : false)
              if (diva != null) {
                const abiCoder = new ethers.utils.AbiCoder()
                const queryDataArgs = abiCoder.encode(
                  ['uint256', 'address', 'uint256'],
                  [props.id.split('/')[0], diva.address, chainId]
                )
                const queryData = abiCoder.encode(
                  ['string', 'bytes'],
                  ['DIVAProtocol', queryDataArgs]
                )
                const queryId = ethers.utils.keccak256(queryData)
                const oracleValue = abiCoder.encode(
                  ['uint256', 'uint256'],
                  [parseUnits(reportValue), parseUnits(colUsdVal)]
                )
                tellor
                  .submitValue(queryId, oracleValue, 0, queryData)
                  .then((tx) => {
                    /**
                     * dispatch action to refetch the pool after action
                     */
                    tx.wait().then(() => {
                      setTimeout(() => {
                        dispatch(
                          fetchPools({
                            page: 0,
                            dataProvider:
                              config[
                                chainId!
                              ].divaOracleTellorAddress.toLowerCase(),
                          })
                        )
                        setReportLoading(false)
                      }, 2000)
                    })
                  })
                  .catch((err) => {
                    console.error(err)
                    setReportLoading(false)
                  })
              }
              setReportLoading(false)
              handleCloseReport()
            }}
          >
            Submit value
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <LoadingButton
        variant="contained"
        onClick={handleOpenTip}
        // disabled={!enabled || disabledButton}
        disabled={!tipEnabled}
        loading={submitLoading}
        sx={{
          fontSize: isMobile ? '10px' : 'auto',
          padding: isMobile ? '5px 11px' : 'auto',
        }}
      >
        Add Tip
      </LoadingButton>
      <Dialog open={openTip} onClose={handleCloseTip}>
        <DialogContent>
          <DialogContentText>
            Please provide a value for this option
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Stack>
            <TextField
              defaultValue=""
              onChange={(e) => {
                setTipValue(e.target.value)
              }}
            />

            <Autocomplete
              options={possibleOptions}
              value={collateralToken}
              onChange={(_, newValue) => {
                setCollateralToken(newValue)
              }}
              getOptionLabel={(option: WhitelistCollateralToken) =>
                option?.symbol || ''
              }
              onInputChange={(event) => {
                if (event != null && event.target != null) {
                  setReferenceAssetSearch((event.target as any).value || '')
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Collateral Asset" />
              )}
            />
          </Stack>

          <LoadingButton
            color="primary"
            type="submit"
            loading={submitLoading}
            sx={{
              fontSize: isMobile ? '10px' : 'auto',
              padding: isMobile ? '5px 11px' : 'auto',
            }}
            onClick={() => {
              setSubmitLoading(reportValue ? true : false)
              const token = new ethers.Contract(
                collateralToken.id,
                ERC20,
                provider.getSigner()
              )
              token
                .approve(
                  divaOracleTellor.address,
                  parseUnits(tipValue, collateralToken.decimals)
                )
                .then((tx) => {
                  tx.wait().then(() => {
                    divaOracleTellor
                      .addTip(
                        props.id.split('/')[0],
                        parseUnits(tipValue, collateralToken.decimals),
                        collateralToken.id
                      )
                      .then((tx) => {
                        tx.wait().then(() => {
                          setTimeout(() => {
                            dispatch(
                              fetchPools({
                                page: 0,
                                dataProvider:
                                  config[
                                    chainId!
                                  ].divaOracleTellorAddress.toLowerCase(),
                              })
                            )
                            setReportLoading(false)
                          }, 2000)
                        })
                      })
                      .catch((err) => {
                        console.error(err)
                        setReportLoading(false)
                      })
                  })
                })

              handleCloseTip()
            }}
          >
            Submit tip
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <LoadingButton
        variant="contained"
        onClick={handleOpenDispute}
        disabled={!disputeEnabled}
        loading={submitLoading}
        sx={{
          backgroundColor: '#F2994A',
          fontSize: isMobile ? '10px' : 'auto',
          padding: isMobile ? '5px 11px' : 'auto',
        }}
      >
        Dispute
      </LoadingButton>
      <Dialog open={openDispute} onClose={handleCloseDispute}>
        <DialogContent>
          <DialogContentText>
            Please provide a value for tipping this report
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <TextField
            defaultValue=""
            onChange={(e) => {
              setTipValue(e.target.value)
            }}
          />
          <LoadingButton
            color="primary"
            type="submit"
            loading={submitLoading}
            sx={{
              fontSize: isMobile ? '10px' : 'auto',
              padding: isMobile ? '5px 11px' : 'auto',
            }}
            onClick={() => {
              setSubmitLoading(reportValue ? true : false)

              const abiCoder = new ethers.utils.AbiCoder()
              const queryDataArgs = abiCoder.encode(
                ['uint256', 'address', 'uint256'],
                [props.id.split('/')[0], diva.address, chainId]
              )
              const queryData = abiCoder.encode(
                ['string', 'bytes'],
                ['DIVAProtocol', queryDataArgs]
              )
              const queryId = ethers.utils.keccak256(queryData)
              diva.getPoolParameters(props.id.split('/')[0]).then((pool) => {
                tellor
                  .beginDispute(queryId, props.row.Reports[0].time)
                  .then((tx) => {
                    tx.wait().then(() => {
                      setTimeout(() => {
                        dispatch(
                          fetchPools({
                            page: 0,
                            dataProvider:
                              config[
                                chainId!
                              ].divaOracleTellorAddress.toLowerCase(),
                          })
                        )
                        setSubmitLoading(false)
                      }, 2000)
                    })
                  })

                //   .then((tx) => {
                //     /**
                //      * dispatch action to refetch the pool after action
                //      */

                //   })
                //   .catch((err) => {
                //     console.error(err)
                //     setTipLoading(false)
                //   })
              })
              handleCloseDispute()
            }}
          >
            Submit dispute
          </LoadingButton>
        </DialogActions>
      </Dialog>
      <LoadingButton
        variant="contained"
        disabled={!settleEnabled}
        loading={submitLoading}
        onClick={() => {
          setSubmitLoading(reportValue ? true : false)
          if (diva != null) {
            console.log(props.id.split('/')[0])
            divaOracleTellor
              .setFinalReferenceValue(Number(props.id.split('/')[0]))
              .then((tx) => {
                /**
                 * dispatch action to refetch the pool after action
                 */
                tx.wait().then(() => {
                  setTimeout(() => {
                    dispatch(
                      fetchPools({
                        page: 0,
                        dataProvider: config[chainId].divaOracleTellorAddress,
                      })
                    )
                    setSubmitLoading(false)
                  }, 10000)
                })
              })
              .catch((err) => {
                console.error(err)
                setSubmitLoading(false)
              })
          }
          handleCloseSettlement()
        }}
        sx={{
          backgroundColor: '#27AE60',
          fontSize: isMobile ? '10px' : 'auto',
          padding: isMobile ? '5px 11px' : 'auto',
        }}
      >
        Settle
      </LoadingButton>
    </Stack>
  )
}
const FavoriteButton = (props: any) => {
  const [favoritePool, setFavoritePool] = useState(false)
  const favorites = localStorage.getItem('favorites')
  const poolId = props.props.id.split('/')[0]
  const handleFavorite = (poolId) => {
    if (favorites.includes(poolId)) {
      setFavoritePool(true)
    } else {
      setFavoritePool(false)
    }
  }
  useEffect(() => {
    if (favorites != null) {
      if (favorites.includes(poolId)) {
        setFavoritePool(true)
      } else {
        setFavoritePool(false)
      }
    }
  }, [favoritePool])
  if (favoritePool) {
    return (
      <Button
        onClick={() => {
          setFavoritePool(!favoritePool)
          if (favoritePool) {
            localStorage.setItem(
              'favorites',
              favorites.replace(poolId + ',', '')
            )
          } else {
            localStorage.setItem('favorites', favorites + poolId + ',')
          }
        }}
      >
        <StarIcon />
      </Button>
    )
  } else {
    return (
      <Button
        onClick={() => {
          setFavoritePool(!favoritePool)
          if (favoritePool) {
            localStorage.setItem(
              'favorites',
              favorites.replace(poolId + ',', '')
            )
          } else {
            localStorage.setItem('favorites', favorites + poolId + ',')
          }
        }}
      >
        <StarBorderIcon />
      </Button>
    )
  }
}
const columns: GridColDef[] = [
  {
    field: 'Favorite',
    headerName: '',
    renderCell: (cell) => <FavoriteButton props={cell} />,
  },
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
    minWidth: 150,
  },
  {
    minWidth: 150,
    field: 'Expiry',
    align: 'right',
    headerAlign: 'right',
    type: 'number',
    headerName: 'Expiry Time',
  },
  {
    field: 'ExpiresIn',
    minWidth: 150,
    align: 'right',
    headerAlign: 'right',
    type: 'dateTime',
    headerName: 'Expires in',
    renderCell: (props) => <ExpiresInCell {...props} />,
  },
  {
    field: 'subPeriod',
    align: 'right',
    headerAlign: 'right',
    headerName: 'Reporting Due in',
    minWidth: 150,
    renderCell: (props) => <DueInCell {...props} />,
  },
  {
    minWidth: 150,
    field: 'ReportedValue',
    align: 'right',
    headerAlign: 'right',
    headerName: 'Reported Value',
    renderCell: (props) => {
      if (props.row.Reports.length > 0) {
        return (
          <Tooltip
            title={formatUnits(
              decodeOracleValue(props.row.Reports[0].value)[0]
            )}
          >
            <span className="table-cell-trucate">
              {formatUnits(decodeOracleValue(props.row.Reports[0].value)[0])}
            </span>
          </Tooltip>
        )
      }
    },
  },
  {
    minWidth: 150,
    field: 'Reporter',
    headerName: 'Reporter',
    align: 'right',
    headerAlign: 'right',
    type: 'number',
    valueGetter: (params) => {
      if (params.row.Reports.length > 0) {
        return params.row.Reports[0].reporter
      }
    },
    renderCell: (props) => {
      return (
        <Tooltip title={props.value}>
          <span className="table-cell-trucate">
            {getShortenedAddress(props.value)}
          </span>
        </Tooltip>
      )
    },
  },
  {
    minWidth: 150,
    field: 'Undisputed',
    headerName: 'Undisputed since',
    align: 'right',
    headerAlign: 'right',
    type: 'number',
    renderCell: (props) => <UndisputedCell {...props} />,
  },
  {
    minWidth: 200,
    field: 'Status',
    align: 'right',
    headerAlign: 'right',
    renderCell: (props: any) => {
      if (props.value === 'Open') {
        return (
          <Chip
            sx={{ color: '#F2994A', background: 'rgba(63, 39, 20, 0.6)' }}
            label={'About To Expire'}
          />
        )
      } else if (props.row.Reports.length > 0) {
        if (
          Date.now() >
          props.row.Reports[0].time * 1000 + props.row.UndisputedPeriod * 1000
        )
          return (
            <Chip
              sx={{ color: '#6FCF97', background: 'rgba(37, 57, 27, 0.6)' }}
              label={'Ready For Settlement'}
            />
          )
        else
          return (
            <Chip
              sx={{ color: '#3393E0', background: 'rgba(22, 46, 66, 0.6)' }}
              label={'Reported'}
            />
          )
      } else if (props.row.Status === 'Expired') {
        return (
          <Chip
            sx={{ color: '#9B51E0', background: 'rgba(155, 81, 224, 0.2)' }}
            label={'Expired'}
          />
        )
      }
    },
  },
  {
    field: 'submitValue',
    align: 'right',
    headerAlign: 'right',
    headerName: '',
    minWidth: 400,
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
  const theme = useTheme()

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
          marginTop: theme.spacing(3.5),
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
              sx={{
                width: '100%',
                height: '50px',
                marginTop: theme.spacing(2),
              }}
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
              marginTop: theme.spacing(2),
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
          paddingTop: theme.spacing(2.5),
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

export function Report() {
  const userAddress = useAppSelector(selectUserAddress)
  const [page, setPage] = useState(0)
  const [underlyingButtonLabel, setUnderlyingButtonLabel] =
    useState('Underlying')
  const [search, setSearch] = useState('')
  const [reportsLoading, setReportsLoading] = useState(true)
  const [expiredPoolClicked, setExpiredPoolClicked] = useState(false)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [checkedState, setCheckedState] = useState(new Array(4).fill(false))
  const [undisputedPeriod, setUndisputedPeriod] = useState(0)
  const chainId = useAppSelector(selectChainId)
  const dispatch = useDispatch()
  const pools = useAppSelector((state) => selectPools(state))
  const poolsRequestStatus = useAppSelector(selectRequestStatus('app/pools'))
  const { isMobile } = useCustomMediaQuery()
  const theme = useTheme()
  const { provider } = useConnectionContext()
  const tellor =
    chainId != null
      ? new ethers.Contract(
          config[chainId!].tellorAddress,
          TELLOR_ABI,
          provider?.getSigner()
        )
      : null
  const divaOracleTellor =
    chainId != null
      ? new ethers.Contract(
          config[chainId!].divaOracleTellorAddress,
          DIVA_ORACLE_TELLOR_ABI,
          provider?.getSigner()
        )
      : null

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
  useEffect(() => {
    divaOracleTellor.getMinPeriodUndisputed().then((period) => {
      setUndisputedPeriod(period)
    })
  }, [divaOracleTellor])
  useEffect(() => {
    if (chainId != null) {
      dispatch(
        fetchPools({
          page,
          dataProvider: config[chainId!].divaOracleTellorAddress.toLowerCase(),
        })
      )
    }
  }, [reportsLoading, dispatch, page, chainId])

  const rows: GridRowModel[] = pools.reduce((acc, val) => {
    const abiCoder = new ethers.utils.AbiCoder()
    const queryDataArgs = abiCoder.encode(
      ['uint256', 'address', 'uint256'],
      [val.id.split('/')[0], config[chainId].divaAddress, chainId]
    )
    const queryData = abiCoder.encode(
      ['string', 'bytes'],
      ['DIVAProtocol', queryDataArgs]
    )
    const queryId = ethers.utils.keccak256(queryData)
    const reports = []

    request(config[chainId].tellorSubgraph, queryReport(queryId)).then(
      (res) => {
        if (res.newReportEntities.length > 0) {
          res.newReportEntities.map((report) => {
            tellor.isDisputed(queryId, report._time).then((disputed) => {
              if (!disputed) {
                reports.push({
                  queryId: report._queryId,
                  value: report._value,
                  time: report._time,
                  reporter: report._reporter,
                  queryData: report._queryData,
                })
              }
            })
          })
        }
        setReportsLoading(false)
      }
    )

    const shared = {
      Reports: reports,
      Reporter: reports[0]?.reporter,
      ReportedValue: reports[0]?.value,
      Icon: val.referenceAsset,
      Underlying: val.referenceAsset,
      Gradient: formatUnits(val.gradient, val.collateralToken.decimals),
      Expiry: getDateTime(val.expiryTime),
      Challenges: val.challenges,
    }

    const { status, finalValue } = getAppStatus(
      val.expiryTime,
      val.statusTimestamp,
      val.statusFinalReferenceValue,
      val.finalReferenceValue,
      val.inflection,
      parseFloat(val.submissionPeriod),
      parseFloat(val.challengePeriod),
      parseFloat(val.reviewPeriod),
      parseFloat(val.fallbackSubmissionPeriod)
    )

    const reportStatus = () => {
      if (status === 'Open') {
        return 'About To Expire'
      } else if (reports.length > 0) {
        if (Date.now() > reports[0].time * 1000 + undisputedPeriod * 1000) {
          return 'Ready for settlement'
        } else return 'Reported'
      } else return status
    }
    const payOff = {
      Gradient: Number(formatUnits(val.gradient, val.collateralToken.decimals)),
      Floor: Number(formatUnits(val.floor)),
      Inflection: Number(formatUnits(val.inflection)),
      Cap: Number(formatUnits(val.cap)),
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
        Status: reportStatus() === undefined ? status : reportStatus(),
        UndisputedPeriod: undisputedPeriod,
        StatusTimestamp: val.statusTimestamp,
        finalValue: finalValue,
        SubmissionPeriod: val.submissionPeriod,
        ReviewPeriod: val.reviewPeriod,
        ChallengePeriod: val.challengePeriod,
      },
    ]
  }, [] as GridRowModel[])

  const filteredRows = useMemo(() => {
    rows.filter(
      (row) =>
        !row.Status.startsWith('Confirmed') &&
        new Date(row.Expiry).getTime() < Date.now() + 24 * 60 * 60 * 1000
    )
    if (search != null && search.length > 0) {
      if (expiredPoolClicked) {
        return rows
          .filter((v) => v.Status.includes('Expired'))
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
        return rows.filter((v) => !v.Status.includes('Expired'))
      } else {
        return rows
      }
    }
  }, [reportsLoading, rows, search, expiredPoolClicked])

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
                marginTop: theme.spacing(2),
                marginBottom: theme.spacing(2),
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
              loading={poolsRequestStatus === 'pending' || reportsLoading}
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
