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
import React, { useEffect, useState } from 'react'
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
import request from 'graphql-request'
import { Pool, queryUser } from '../../lib/queries'
import BalanceCheckerABI from '../../abi/BalanceCheckerABI.json'
import PoolsTableFilter from '../PoolsTableFilter/DropDownFilter'
import DropDownFilter from '../PoolsTableFilter/DropDownFilter'
import ButtonFilter from '../PoolsTableFilter/ButtonFilter'

type Response = {
  [token: string]: BigNumber
}

const MetaMaskImage = styled.img`
  width: 20px;
  height: 20px;
  cursor: pointer;
`
const AddToMetamask = (props: any) => {
  const handleAddMetaMask = async (e) => {
    e.stopPropagation()
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
            decimals: 18,
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

const SubmitButton = (props: any) => {
  const [open, setOpen] = React.useState(false)
  const [textFieldValue, setTextFieldValue] = useState('')
  const [loadingValue, setLoadingValue] = useState(false)
  const [disabledButton, setDisabledButton] = useState(false)
  const { provider } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)

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
      <Container>
        <LoadingButton
          variant="contained"
          color={buttonName === 'Redeem' ? 'success' : 'primary'}
          disabled={disabledButton}
          loading={loadingValue}
          onClick={handleRedeem}
        >
          {buttonName}
        </LoadingButton>
      </Container>
    )
  } else if (buttonName === 'Challenge') {
    return (
      <Container>
        <LoadingButton
          variant="contained"
          loading={loadingValue}
          onClick={(e) => {
            e.stopPropagation()
            handleOpen()
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
      </Container>
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

export function MyPositions() {
  const { provider, chainId } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const [page, setPage] = useState(0)
  const [underlyingButtonLabel, setUnderlyingButtonLabel] =
    useState('Underlying')
  const [search, setSearch] = useState(null)
  const [expiredPoolClicked, setExpiredPoolClicked] = useState(false)
  const [confirmedPoolClicked, setConfirmedPoolClicked] = useState(false)
  const tokenPools = useAppSelector(selectPools)
  const positionTokens = useAppSelector(selectPositionTokens)
  const dispatch = useDispatch()
  const { submissionPeriod, challengePeriod, reviewPeriod, fallbackPeriod } =
    useGovernanceParameters()

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

  const filteredRowsByOptions =
    search != null && search.length > 0
      ? expiredPoolClicked
        ? filteredRows
            .filter((v) =>
              v.Underlying.toLowerCase().includes(search.toLowerCase())
            )
            .filter((v) => v.Status.includes('Open'))
        : confirmedPoolClicked
        ? filteredRows
            .filter((v) =>
              v.Underlying.toLowerCase().includes(search.toLowerCase())
            )
            .filter((v) => v.Status.includes('Confirmed'))
        : filteredRows.filter((v) =>
            v.Underlying.toLowerCase().includes(search.toLowerCase())
          )
      : expiredPoolClicked
      ? filteredRows.filter((v) => v.Status.includes('Open'))
      : confirmedPoolClicked
      ? filteredRows.filter((v) => v.Status.includes('Confirmed'))
      : filteredRows
  const sortedRows = filteredRowsByOptions.sort((a, b) => {
    const aId = parseFloat(a.Id.substring(1))
    const bId = parseFloat(b.Id.substring(1))

    return bId - aId
  })

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
          maxWidth: '400px',
          justifyContent: 'space-between',
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
        <ButtonFilter
          id="Confirmed Pools"
          ButtonLabel="Confirmed"
          onClick={handleConfirmedPools}
        />
      </Box>
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
            page={page}
            rows={filteredRowsByOptions && sortedRows}
            loading={balances.isLoading}
            rowCount={3000}
            columns={columns}
            onPageChange={(page) => setPage(page)}
            selectedPoolsView="Table"
          />
        </>
      )}
    </Stack>
  )
}
