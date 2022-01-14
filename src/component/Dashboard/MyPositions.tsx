import { GridColDef, GridRowModel } from '@mui/x-data-grid/x-data-grid'
import {
  Button,
  CircularProgress,
  Container,
  Stack,
  Tooltip,
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { BigNumber, ethers } from 'ethers'
import { addresses, theGraphUrl } from '../../constants'
import { SideMenu } from './SideMenu'
import PoolsTable, { CoinImage, PayoffCell } from '../PoolsTable'
import { chainIdtoName } from '../../Util/chainIdToName'
import DIVA_ABI from '../../abi/DIVA.json'
import {
  getDateTime,
  getExpiryMinutesFromNow,
  isExpired,
} from '../../Util/Dates'
import { formatEther, formatUnits } from 'ethers/lib/utils'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { useQuery } from 'react-query'
import { Pool, queryPools } from '../../lib/queries'
import { request } from 'graphql-request'
import ERC20_JSON from '../../abi/ERC20.json'
import { useTokenBalances } from '../../hooks/useTokenBalances'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

const ERC20 = ERC20_JSON.abi
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
  const { chainId, account } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )
  const diva = new ethers.Contract(
    addresses[chainId!].divaAddress,
    DIVA_ABI,
    provider.getSigner()
  )
  const token = new ethers.Contract(props.row.address, ERC20, provider)
  const [redeemBtn, setRedeemBtn] = useState('Trade')
  const history = useHistory()
  const handleRedeem = () => {
    token.balanceOf(account).then((bal: BigNumber) => {
      diva.redeemPositionToken(props.row.address, bal)
    })
  }
  useEffect(() => {
    diva.getPoolParameters(props.id.split('/')[0]).then((pool: any) => {
      const statusExpMin = getExpiryMinutesFromNow(
        pool.statusTimestamp.toNumber()
      )
      if (props.row.Status === 'Submitted' && statusExpMin + 24 * 60 + 5 < 0) {
        setRedeemBtn('Redeem')
      } else if (
        props.row.Status === 'Challenged ' &&
        statusExpMin + 48 * 60 + 5 < 0
      ) {
        setRedeemBtn('Redeem')
      } else if (props.row.Status === 'Confirmed') {
        setRedeemBtn('Redeem')
      } else {
        setRedeemBtn('Trade')
      }
    }, [])
  })
  return (
    <Container>
      <Button
        variant="contained"
        color={redeemBtn === 'Redeem' ? 'success' : 'primary'}
        onClick={
          redeemBtn === 'Redeem'
            ? handleRedeem
            : () => {
                history.push('../' + `${props.id}`)
              }
        }
      >
        {redeemBtn}
      </Button>
    </Container>
  )
}

const columns: GridColDef[] = [
  {
    field: 'Id',
    align: 'right',
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
  { field: 'Ceiling', align: 'right', headerAlign: 'right', type: 'number' },
  {
    field: 'Expiry',
    minWidth: 170,
    align: 'right',
    headerAlign: 'right',
    type: 'dateTime',
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
    renderCell: (props) => <SubmitButton {...props} />,
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
  const { account } = useWeb3React()

  const poolsQuery = useQuery<{ pools: Pool[] }>('pools', () =>
    request(theGraphUrl, queryPools)
  )

  const pools = poolsQuery.data?.pools || ([] as Pool[])

  const rows: GridRowModel[] = pools.reduce((acc, val) => {
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
    }

    const payOff = {
      Floor: parseInt(val.floor) / 1e18,
      Inflection: parseInt(val.inflection) / 1e18,
      Cap: parseInt(val.cap) / 1e18,
    }

    const expiryDate = new Date(parseInt(val.expiryDate) * 1000)
    const now = new Date()
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
        address: val.longToken,
        PayoffProfile: generatePayoffChartData({
          ...payOff,
          IsLong: true,
        }),
        TVL:
          formatUnits(val.collateralBalanceLong, val.collateralDecimals) +
          ' ' +
          val.collateralSymbol,
        Status,
        finalValue:
          val.statusFinalReferenceValue === 'Open'
            ? '-'
            : formatUnits(val.finalReferenceValue),
      },
      {
        ...shared,
        id: `${val.id}/short`,
        address: val.shortToken,
        PayoffProfile: generatePayoffChartData({
          ...payOff,
          IsLong: false,
        }),
        TVL:
          formatUnits(val.collateralBalanceShort, val.collateralDecimals) +
          ' ' +
          val.collateralSymbol,
        Status,
        finalValue:
          val.statusFinalReferenceValue === 'Open'
            ? '-'
            : formatUnits(val.finalReferenceValue),
      },
    ]
  }, [] as GridRowModel[])

  const tokenBalances = useTokenBalances(rows.map((v) => v.address))

  // if (balances.isSuccess) {
  //   balances.data.filter((bal) => bal !== undefined)
  // }

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
                : formatUnits(tokenBalances[v.address]).toString(),
          }))
      : []

  console.log({ filteredRows })

  return account ? (
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
