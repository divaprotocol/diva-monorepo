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
import { BigNumber, ethers } from 'ethers'
import { config } from '../../constants'
import { SideMenu } from './SideMenu'
import PoolsTable, { PayoffCell } from '../PoolsTable'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { getDateTime, getExpiryMinutesFromNow } from '../../Util/Dates'
import { formatEther, formatUnits, parseEther } from 'ethers/lib/utils'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { useQuery } from 'react-query'
import ERC20 from '@diva/contracts/abis/erc20.json'
import styled from 'styled-components'
import { GrayText } from '../Trade/Orders/UiStyles'
import React, { useState } from 'react'
import { CoinIconPair } from '../CoinIcon'
import { useAppSelector } from '../../Redux/hooks'
import {
  fetchPool,
  selectIntrinsicValue,
  selectPools,
  selectRequestStatus,
  selectUserAddress,
} from '../../Redux/appSlice'
import { useDispatch } from 'react-redux'
import { useConnectionContext } from '../../hooks/useConnectionContext'

type Response = {
  [token: string]: BigNumber
}

const MetaMaskImage = styled.img`
  width: 20px;
  height: 20px;
  cursor: pointer;
`
const ethereum = window?.ethereum

const AddToMetamask = (props: any) => {
  const { provider } = useConnectionContext()
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
                    tx.wait().then(() => {
                      diva
                        .redeemPositionToken(props.row.address.id, bal)
                        .then((tx) => {
                          /**
                           * dispatch action to refetch the pool after action
                           */
                          tx.wait().then(() => {
                            dispatch(
                              fetchPool({
                                graphUrl:
                                  config[chainId as number].divaSubgraph,
                                poolId: props.id.split('/')[0],
                              })
                            )
                          })
                        })
                        .catch((err) => {
                          console.error(err)
                        })
                    })
                  })
                  .catch((err) => {
                    console.error(err)
                  })
              })
              .catch((err) => {
                console.error(err)
              })
          } else {
            token
              ?.balanceOf(userAddress)
              .then((bal: BigNumber) => {
                diva
                  .redeemPositionToken(props.row.address.id, bal)
                  .catch((err) => {
                    console.error(err)
                  })
              })
              .catch((err) => {
                console.error(err)
              })
          }
        })
        .catch((err) => {
          console.error(err)
        })
    } else {
      token
        ?.balanceOf(userAddress)
        .then((bal: BigNumber) => {
          diva.redeemPositionToken(props.row.address.id, bal).catch((err) => {
            console.error(err)
          })
        })
        .catch((err) => {
          console.error(err)
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
    setOpen(false)
  }

  if (buttonName === 'Redeem') {
    return (
      <Container>
        <Button
          variant="contained"
          color={buttonName === 'Redeem' ? 'success' : 'primary'}
          onClick={handleRedeem}
        >
          {buttonName}
        </Button>
      </Container>
    )
  } else if (buttonName === 'Challenge') {
    return (
      <Container>
        <Button
          variant="contained"
          onClick={(e) => {
            e.stopPropagation()
            handleOpen()
          }}
        >
          Challenge
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
              onClick={(e) => {
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
                      })
                    })
                    .catch((err) => {
                      console.error(err)
                    })
                }
                handleClose()
              }}
            >
              Challenge
            </Button>
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
  { field: 'Inflection', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Cap', align: 'right', headerAlign: 'right', type: 'number' },
  {
    field: 'Expiry',
    minWidth: 170,
    align: 'right',
    headerAlign: 'right',
    type: 'dateTime',
  },
  {
    field: 'TVL',
    align: 'right',
    headerAlign: 'right',
    minWidth: 200,
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
    minWidth: 100,
    renderCell: (props) => <AddToMetamask {...props} />,
  },
]

export function MyPositions() {
  const { provider, address: userAddress } = useConnectionContext()
  const [page, setPage] = useState(0)
  const pools = useAppSelector((state) => selectPools(state))
  const poolsRequestStatus = useAppSelector(selectRequestStatus('app/pools'))

  const rows: GridRowModel[] = pools.reduce((acc, val) => {
    const expiryTime = new Date(parseInt(val.expiryTime) * 1000)
    const now = new Date()
    const fallbackPeriod = new Date(parseInt(val.expiryTime) * 1000).setMinutes(
      expiryTime.getMinutes() + 24 * 60 + 5
    )
    const unchallengedPeriod = new Date(
      parseInt(val.expiryTime) * 1000
    ).setMinutes(expiryTime.getMinutes() + 5 * 24 * 60 + 5)
    const challengedPeriod = new Date(
      parseInt(val.expiryTime) * 1000
    ).setMinutes(expiryTime.getMinutes() + 2 * 24 * 60 + 5)
    let finalValue = '-'
    let status = val.statusFinalReferenceValue

    if (now.getTime() < expiryTime.getTime()) {
      finalValue = '-'
    } else if (val.statusFinalReferenceValue === 'Open') {
      if (Date.now() > fallbackPeriod && Date.now() < unchallengedPeriod) {
        status = 'Fallback'
      } else if (now.getTime() > unchallengedPeriod) {
        finalValue = parseFloat(formatEther(val.inflection)).toFixed(4)
        status = 'Confirmed*'
      } else if (
        now.getTime() > expiryTime.getTime() &&
        now.getTime() < unchallengedPeriod
      ) {
        status = 'Expired'
        finalValue = '-'
      } else {
        finalValue = '-'
      }
    } else if (
      val.statusFinalReferenceValue === 'Challenged' &&
      Date.now() > challengedPeriod
    ) {
      finalValue = parseFloat(formatEther(val.finalReferenceValue)).toFixed(4)
      status = 'Confirmed*'
    } else {
      finalValue = parseFloat(formatEther(val.finalReferenceValue)).toFixed(4)
      status = val.statusFinalReferenceValue
    }
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
      Floor: parseInt(val.floor) / 1e18,
      Inflection: parseInt(val.inflection) / 1e18,
      Cap: parseInt(val.cap) / 1e18,
    }

    const Status =
      expiryTime.getTime() <= now.getTime() &&
      val.statusFinalReferenceValue.toLowerCase() === 'open'
        ? 'Expired'
        : val.statusFinalReferenceValue

    return [
      ...acc,
      {
        ...shared,
        id: `${val.id}/long`,
        Id: 'L' + val.id,
        address: val.longToken,
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalance),
              val.collateralToken.decimals
            )
          ).toFixed(4) +
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
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalance),
              val.collateralToken.decimals
            )
          ).toFixed(4) +
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

  const tokenAddresses = rows.map((v) => v.address.id)

  /**
   * TODO: Move into redux
   */
  const balances = useQuery<Response>(`balance-${userAddress}`, async () => {
    const response: Response = {}
    if (!userAddress) {
      console.warn('wallet not connected')
      return Promise.resolve({})
    }
    await Promise.all(
      tokenAddresses.map(async (tokenAddress) => {
        const contract = new ethers.Contract(tokenAddress, ERC20, provider)
        try {
          const res: BigNumber = await contract.balanceOf(userAddress)
          response[tokenAddress] = res
        } catch (error) {
          console.error(error)
        }
      })
    )
    return response
  })

  const tokenBalances = balances.data

  const filteredRows =
    tokenBalances != null
      ? rows
          .filter(
            (v) =>
              tokenBalances[v.address.id] != null &&
              tokenBalances[v.address.id].gt(0)
          )
          .map((v) => ({
            ...v,
            Balance:
              parseInt(formatUnits(tokenBalances[v.address.id])) < 0.01
                ? '<0.01'
                : parseFloat(formatUnits(tokenBalances[v.address.id])).toFixed(
                    4
                  ),
          }))
      : []

  return (
    <Stack
      direction="row"
      sx={{
        height: '100%',
        maxHeight: 'calc(100% - 6em)',
      }}
      spacing={6}
      paddingTop={2}
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
          <SideMenu />
          <PoolsTable
            page={page}
            rows={filteredRows}
            loading={balances.isLoading || poolsRequestStatus === 'pending'}
            columns={columns}
            onPageChange={(page) => setPage(page)}
          />
        </>
      )}
    </Stack>
  )
}
