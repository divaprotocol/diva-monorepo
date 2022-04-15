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
import { BigNumber, ethers } from 'ethers'
import { config, projectId } from '../../constants'
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
import { fetchPool, poolsSelector } from '../../Redux/poolSlice'
import { useDispatch } from 'react-redux'
import { useAccount, useNetwork, useSigner } from 'wagmi'

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
        },
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
  const [{ data: accountData }] = useAccount({
    fetchEns: true,
  })
  const [{ data: networkData }] = useNetwork()
  const provider = new ethers.providers.JsonRpcProvider(
    'https://' +
      networkData.chain?.name.toLowerCase() +
      '.infura.io/v3/' +
      projectId
  )
  const [{ data: signerData }] = useSigner()
  const dispatch = useDispatch()
  const chainId = provider?.network?.chainId
  if (chainId == null) return null

  const diva = new ethers.Contract(
    config[chainId].divaAddress,
    DIVA_ABI,
    signerData
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
              ?.balanceOf(accountData?.address)
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
              ?.balanceOf(accountData?.address)
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
        ?.balanceOf(accountData?.address)
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
  const [{ data: accountData }] = useAccount({
    fetchEns: true,
  })
  const [{ data: networkData }] = useNetwork()
  let rpcUrl = ''
  switch (networkData.chain?.id) {
    case 1:
      rpcUrl = 'https://mainet.infura.io/v3/'
      break
    case 3:
      rpcUrl = 'https://ropsten.infura.io/v3/'
      break
    case 4:
      rpcUrl = 'https://rinkeby.infura.io/v3/'
      break
    case 137:
      rpcUrl = 'https://polygon-mainnet.infura.io/v3/'
      break
    case 42:
      rpcUrl = 'https://kovan.infura.io/v3/'
      break
    default:
      rpcUrl = 'https://ropsten.infura.io/v3/'
      break
  }
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl + projectId)
  const userAddress = '0x9adefeb576dcf52f5220709c1b267d89d5208d78'
  const [page, setPage] = useState(0)
  const pools = useAppSelector((state) => poolsSelector(state))

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
    if (Date.now() > fallbackPeriod) {
      status = 'Fallback'
    }
    if (now.getTime() < expiryTime.getTime()) {
      finalValue = '-'
    } else if (val.statusFinalReferenceValue === 'Open') {
      if (now.getTime() > unchallengedPeriod) {
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

  const balances = useQuery<Response>(
    `balance-${userAddress}-${pools == null}`,
    async () => {
      const response: Response = {}
      if (!userAddress) throw new Error('wallet not connected')
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
    }
  )

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
        rows={filteredRows}
        loading={balances.isLoading}
        columns={columns}
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
