import { GridColDef, GridRowModel } from '@mui/x-data-grid/x-data-grid'
import { Button, Container, Stack, Tooltip } from '@mui/material'
import { BigNumber, ethers } from 'ethers'
import { config } from '../../constants'
import { SideMenu } from './SideMenu'
import PoolsTable, { CoinImage, PayoffCell } from '../PoolsTable'
import DIVA_ABI from '../../abi/DIVA.json'
import { getDateTime, getExpiryMinutesFromNow } from '../../Util/Dates'
import { formatUnits, parseEther } from 'ethers/lib/utils'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { useQuery } from 'react-query'
import { Pool, queryPools } from '../../lib/queries'
import { request } from 'graphql-request'
import ERC20 from '../../abi/ERC20.json'
import { useTokenBalances } from '../../hooks/useTokenBalances'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'
import { useWallet } from '@web3-ui/hooks'
import { GrayText } from '../Trade/Orders/UiStyles'
import React from 'react'

const MetaMaskImage = styled.img`
  width: 20px;
  height: 20px;
  cursor: pointer;
`

const AddToMetamask = (props: any) => {
  const handleAddMetaMask = async () => {
    const tokenSymbol =
      props.row.id.split('/')[1][0].toUpperCase() +
      '-' +
      props.row.id.split('/')[0]
    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: props.row.address,
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
  const {
    connection: { userAddress },
    provider,
  } = useWallet()
  const history = useHistory()

  const chainId = provider?.network?.chainId
  if (chainId == null) return null

  const diva = new ethers.Contract(
    config[chainId].divaAddress,
    DIVA_ABI,
    provider?.getSigner()
  )
  const token =
    provider && new ethers.Contract(props.row.address, ERC20, provider)
  const handleRedeem = () => {
    if (props.row.Status === 'Confirmed*') {
      token?.balanceOf(userAddress).then((bal: BigNumber) => {
        diva
          .setFinalReferenceValue(
            props.id.split('/')[0],
            parseEther(props.row.Inflection),
            false
          )
          .then((tx) => {
            tx.wait().then(() => {
              diva.redeemPositionToken(props.row.address, bal)
            })
          })
      })
    } else {
      token?.balanceOf(userAddress).then((bal: BigNumber) => {
        diva.redeemPositionToken(props.row.address, bal)
      })
    }
  }

  let buttonName: string

  const statusExpMin = getExpiryMinutesFromNow(
    Number(props.row.StatusTimestamp)
  )
  if (props.row.Status === 'Submitted' && statusExpMin + 24 * 60 + 5 < 0) {
    buttonName = 'Redeem'
  } else if (
    props.row.Status === 'Challenged ' &&
    statusExpMin + 48 * 60 + 5 < 0
  ) {
    buttonName = 'Redeem'
  } else if (props.row.Status.startsWith('Confirmed')) {
    buttonName = 'Redeem'
  } else if (
    props.row.Status === 'Expired' &&
    statusExpMin + 24 * 60 * 5 + 5 < 0
  ) {
    buttonName = 'Redeem'
  } else {
    buttonName = 'Trade'
  }

  return (
    <Container>
      <Button
        variant="contained"
        color={buttonName === 'Redeem' ? 'success' : 'primary'}
        onClick={
          buttonName === 'Redeem'
            ? handleRedeem
            : () => {
                history.push('../' + `${props.id}`)
              }
        }
      >
        {buttonName}
      </Button>
    </Container>
  )
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
    renderCell: (cell) => <CoinImage assetName={cell.value} />,
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
  const {
    connection: { userAddress },
    provider,
  } = useWallet()

  const chainId = provider?.network?.chainId

  const poolsQuery = useQuery<{ pools: Pool[] }>('pools', () =>
    chainId != null
      ? request(config[chainId as number].divaSubgraph, queryPools)
      : Promise.resolve()
  )

  const pools = poolsQuery.data?.pools || ([] as Pool[])
  const rows: GridRowModel[] = pools.reduce((acc, val) => {
    const expiryDate = new Date(parseInt(val.expiryDate) * 1000)
    const now = new Date()
    const fallbackPeriod = new Date(parseInt(val.expiryDate) * 1000).setMinutes(
      expiryDate.getMinutes() + 24 * 60 + 5
    )
    const unchallengedPeriod = new Date(
      parseInt(val.expiryDate) * 1000
    ).setMinutes(expiryDate.getMinutes() + 5 * 24 * 60 + 5)
    const challengedPeriod = new Date(
      parseInt(val.expiryDate) * 1000
    ).setMinutes(expiryDate.getMinutes() + 2 * 24 * 60 + 5)
    let finalValue = ''
    let status = val.statusFinalReferenceValue
    if (Date.now() > fallbackPeriod) {
      status = 'Fallback'
    }
    if (now.getTime() < expiryDate.getTime()) {
      finalValue = '-'
    } else if (val.statusFinalReferenceValue === 'Open') {
      if (now.getTime() > unchallengedPeriod) {
        finalValue = formatUnits(val.inflection)
        status = 'Confirmed*'
      } else if (
        now.getTime() > expiryDate.getTime() &&
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
      finalValue = formatUnits(val.inflection)
      status = 'Confirmed*'
    } else {
      finalValue = formatUnits(val.finalReferenceValue)
      status = val.statusFinalReferenceValue
    }
    const shared = {
      Id: val.id,
      Icon: val.referenceAsset,
      Underlying: val.referenceAsset,
      Floor: formatUnits(val.floor),
      Inflection: formatUnits(val.inflection),
      Ceiling: formatUnits(val.cap),
      Expiry: getDateTime(val.expiryDate),
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
      expiryDate.getTime() <= now.getTime() &&
      val.statusFinalReferenceValue.toLowerCase() === 'open'
        ? 'Expired'
        : val.statusFinalReferenceValue

    return [
      ...acc,
      {
        ...shared,
        id: `${val.id}/long`,
        Id: 'L-' + val.id,
        address: val.longToken,
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalanceLong).add(
                val.collateralBalanceShort
              ),
              val.collateralDecimals
            )
          ).toFixed(4) +
          ' ' +
          val.collateralSymbol,
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
        Id: 'L-' + val.id,
        address: val.shortToken,
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalanceLong).add(
                val.collateralBalanceShort
              ),
              val.collateralDecimals
            )
          ).toFixed(4) +
          ' ' +
          val.collateralSymbol,
        PayoffProfile: generatePayoffChartData({
          ...payOff,
          IsLong: false,
        }),
        Status: status,
        finalValue: finalValue,
      },
    ]
  }, [] as GridRowModel[])

  const tokenBalances = useTokenBalances(rows.map((v) => v.address))

  const filteredRows =
    tokenBalances != null
      ? rows
          .filter(
            (v) =>
              tokenBalances[v.address] != null && tokenBalances[v.address].gt(0)
          )
          .map((v) => ({
            ...v,
            Balance:
              parseInt(formatUnits(tokenBalances[v.address])) < 0.01
                ? '<0.01'
                : parseFloat(formatUnits(tokenBalances[v.address])).toFixed(4),
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
      <PoolsTable rows={filteredRows} columns={columns} disableRowClick />
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
