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
import { config, projectId } from '../../constants'
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
import { ExpiresInCell } from '../Markets/Markets'
import { getAppStatus } from '../../Util/getAppStatus'
import { getAddressBalances } from 'eth-balance-checker/lib/ethers'
import { InfuraProvider } from '@ethersproject/providers'
import { createAsyncThunk } from '@reduxjs/toolkit'
import request from 'graphql-request'
import {
  User,
  Pool,
  queryPool,
  queryPositionTokens,
  PositionToken,
  FeeRecipientCollateralToken,
  queryMyFeeClaims,
} from '../../lib/queries'

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
              autoFocus={true}
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
      const description = (status: string) => {
        switch (status) {
          case 'Open':
            return `Pool has not expired yet.`
          case 'Expired':
            return `Pool expired and the final value input from the data provider is pending.`
          case 'Submitted':
            return `A final value has been submitted by the data provider.`
          case 'Challenged':
            return `The final value submitted by the data provider has been challenged by position token holders.`
          case 'Fallback':
            return `The data provider failed to submit a final value within the 24h submission period. The fallback data provider has 5 days to step in and submit a value. This is only to be expected for whitelisted data providers. For non-whitelisted data providers, the fallback data provider may not submit a value in which case it will default to inflection.`
          case 'Confirmed*':
            return `The final value will be confirmed inside the smart contract at first user redemption.`
          case 'Confirmed':
            return `The final value has been confirmed and position token holders can start redeeming their LONG & SHORT position tokens.`
        }
      }
      return (
        <Tooltip placement="top-end" title={description(cell.value)}>
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
  const { provider, address: userAddress, chainId } = useConnectionContext()
  const [page, setPage] = useState(0)
  const pools = useAppSelector((state) => selectPools(state))
  const poolsRequestStatus = useAppSelector(selectRequestStatus('app/pools'))

  // get all pools (via API call to subgraph)
  // get all unique addresses
  // filter where balance > 0
  // draw table

  const rows: GridRowModel[] = pools.reduce((acc, val) => {
    const { finalValue, status } = getAppStatus(
      val.expiryTime,
      val.statusTimestamp,
      val.statusFinalReferenceValue,
      val.finalReferenceValue,
      val.inflection
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

  // const tokenAddresses = rows.map((v) => v.address.id)
  const positionTokens = useQuery<any>(
    `position-tokens-${userAddress}`,
    async () => {
      if (chainId != null) {
        const result = await request(
          config[chainId as number].divaSubgraph,
          queryPositionTokens(userAddress)
        )
        console.log('position-tokens', result)
        return result.user.positionTokens
      }
    }
  )
  console.log('data', positionTokens.data)
  /**
   * TODO: Move into redux
   */
  const balances = useQuery<Response>(`balance-${userAddress}`, async () => {
    // if (positionTokens.isSuccess && poolsRequestStatus !== 'pending') {
    const response: Response = {}
    if (!userAddress) {
      console.warn('wallet not connected')
      return Promise.resolve({})
    }
    await Promise.all(
      positionTokens.data.map(async (token) => {
        console.log('token check', token.positionToken.id)
        const contract = new ethers.Contract(
          token.positionToken.id,
          ERC20,
          provider
        )
        try {
          const res: BigNumber = await contract.balanceOf(userAddress)
          console.log('balance', res)
          response[token.positionToken.id] = res
        } catch (error) {
          console.error(error)
        }
      })
    )
    return response
    // }
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

  const sortedRows = filteredRows.sort((a, b) => {
    const aId = parseFloat(a.Id.substring(1))
    const bId = parseFloat(b.Id.substring(1))

    return bId - aId
  })

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
            page={page}
            rows={sortedRows}
            loading={balances.isLoading || poolsRequestStatus === 'pending'}
            columns={columns}
            onPageChange={(page) => setPage(page)}
          />
        </>
      )}
    </Stack>
  )
}
