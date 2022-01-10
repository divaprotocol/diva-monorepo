import { GridColDef, GridRowModel } from '@mui/x-data-grid/x-data-grid'
import { Button, Container, Stack, Tooltip } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useWeb3React } from '@web3-react/core'
import { BigNumber, ethers } from 'ethers'

import { addresses } from '../../config'
import { SideMenu } from './SideMenu'
import PoolsTable, { CoinImage, PayoffCell } from '../PoolsTable'
import { chainIdtoName } from '../../Util/chainIdToName'
import DIVA_ABI from '../../contracts/abis/DIVA.json'
import { getDateTime, getExpiryMinutesFromNow } from '../../Util/Dates'
import { formatUnits } from 'ethers/lib/utils'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { useQuery } from 'react-query'
import { Pool, queryPools } from '../../lib/queries'
import { request } from 'graphql-request'
import ERC20 from '../../contracts/abis/ERC20.json'
import { useCheckTokenBalances } from '../../hooks/useCheckTokenBalances'
import { useHistory } from 'react-router-dom'

const StatusCell = (props: any) => {
  const { chainId } = useWeb3React()
  const [status, setStatus] = useState(props.row.Status)
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )
  const diva = new ethers.Contract(
    addresses[chainId!].divaAddress,
    DIVA_ABI,
    provider.getSigner()
  )
  useEffect(() => {
    diva.getPoolParametersById(props.id.split('/')[0]).then((pool: any) => {
      if (
        getExpiryMinutesFromNow(pool.expiryDate.toNumber()) + 24 * 60 - 5 < 0 &&
        props.row.Status === 'Open'
      ) {
        setStatus('Expired')
      }
    })
  }, [])

  return <div>{status}</div>
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
    diva.getPoolParametersById(props.id.split('/')[0]).then((pool: any) => {
      const statusExpMin = getExpiryMinutesFromNow(
        pool.statusTimeStamp.toNumber()
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
      }
    }, [])
  })
  return (
    <Container>
      <Button
        variant="contained"
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
    renderCell: (props) => <StatusCell {...props} />,
  },
  {
    field: 'submitValue',
    align: 'right',
    headerAlign: 'right',
    headerName: '',
    minWidth: 200,
    renderCell: (props) => <SubmitButton {...props} />,
  },
]

export function MyPositions() {
  const { account } = useWeb3React()

  const query = useQuery<{ pools: Pool[] }>('pools', () =>
    request(
      'https://api.thegraph.com/subgraphs/name/juliankrispel/diva',
      queryPools
    )
  )
  const pools = query.data?.pools || ([] as Pool[])

  const rows: GridRowModel[] = pools.reduce((acc, val) => {
    const shared = {
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
        Status: val.statusFinalReferenceValue,
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
        Status: val.statusFinalReferenceValue,
        finalValue:
          val.statusFinalReferenceValue === 'Open'
            ? '-'
            : formatUnits(val.finalReferenceValue),
      },
    ]
  }, [] as GridRowModel[])

  const tokenBalances = useCheckTokenBalances(rows.map((v) => v.address))

  const filteredRows = rows.filter((v) => {
    return tokenBalances?.includes(v.address)
  })

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
