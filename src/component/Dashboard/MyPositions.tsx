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
import React, { useEffect, useMemo, useState } from 'react'
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
import { useCheckTokenBalance } from '../../hooks/useCheckTokenBalance'

const DueInCell = (props: any) => {
  const { chainId } = useWeb3React()
  const [expTimestamp, setExpTimestamp] = useState(0)
  const [statusTimestamp, setStatusTimestamp] = useState(0)

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
      setExpTimestamp(pool.expiryDate.toNumber())
    }, [])

    diva.getPoolParametersById(props.id.split('/')[0]).then((pool: any) => {
      setStatusTimestamp(pool.statusTimeStamp.toNumber())
    }, [])
  })

  if (props.row.Status === 'Open') {
    const minUntilExp = getExpiryMinutesFromNow(
      expTimestamp + 24 * 3600 - 5 * 60
    )
    if (minUntilExp < 24 * 60 - 5 && minUntilExp > 0) {
      return minUntilExp === 1 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '150vh',
          }}
        >
          {'<1m'}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '150vh',
          }}
        >
          {(minUntilExp - (minUntilExp % 60)) / 60 +
            'h ' +
            (minUntilExp % 60) +
            'm '}
        </div>
      )
    }
  }
  if (props.row.Status === 'Challenged') {
    const minUntilExp = getExpiryMinutesFromNow(
      statusTimestamp + 48 * 3600 - 5 * 60
    )
    if (minUntilExp < 48 * 60 - 5 && minUntilExp > 0) {
      return minUntilExp === 1 ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '150vh',
          }}
        >
          {'<1m'}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '150vh',
          }}
        >
          {(minUntilExp - (minUntilExp % 60)) / 60 +
            'h ' +
            (minUntilExp % 60) +
            'm '}
        </div>
      )
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '150vh',
      }}
    >
      {'-'}
    </div>
  )
}
const SubmitCell = (props: any) => {
  const { chainId } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )
  const diva = new ethers.Contract(
    addresses[chainId!].divaAddress,
    DIVA_ABI,
    provider.getSigner()
  )
  const [open, setOpen] = useState(false)
  const [btnDisabled, setBtnDisabled] = useState(true)
  const [textFieldValue, setTextFieldValue] = useState('')
  const handleOpen = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  useEffect(() => {
    diva.getPoolParametersById(props.id.split('/')[0]).then((pool: any) => {
      setBtnDisabled(
        props.row.Status === 'Submitted' ||
          props.row.Status === 'Confirmed' ||
          pool.expiryDate.toNumber() * 1000 > Date.now() ||
          getExpiryMinutesFromNow(pool.expiryDate.toNumber() + 24 * 3600) < 0
      )
    }, [])
  })
  return (
    <Container>
      <Button variant="contained" onClick={handleOpen} disabled={btnDisabled}>
        Trade
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
              // e.stopPropagation()
              setTextFieldValue(e.target.value)
            }}
          />
          <Button
            color="primary"
            type="submit"
            onClick={() => {
              diva.setFinalReferenceValueById(
                props.id.split('/')[0],
                ethers.utils.parseEther(textFieldValue),
                true
              )
              handleClose()
            }}
          >
            Submit value
          </Button>
        </DialogActions>
      </Dialog>
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

export function MyPositions() {
  const { account, chainId } = useWeb3React()

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
    ]
  }, [] as GridRowModel[])
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )
  const userTokens: string[] = []
  if (account) {
    for (const row of rows) {
      const contract = new ethers.Contract(row.address, ERC20, provider)
      contract.balanceOf(account).then((balance: BigNumber) => {
        console.log(row.id)
        console.log(row.address)
        console.log(balance.toString())
        if (balance.toString() !== '0') {
          console.log('aloooo')
          console.log(typeof row.address)
          userTokens.push(row.addres)
        }
      })
    }
    console.log('userTokens')
    console.log(userTokens)
  }

  const filteredRows = rows.filter((v) => {
    // const contract = new ethers.Contract(v.address, ERC20, provider)
    // contract.balanceOf(account).then((balance: BigNumber) => {

    // return useCheckTokenBalance(v.address) > 0
    return true
    // })
  })
  // if (userTokens.length > 0){
  //
  // }
  console.log('filteredRows')
  console.log(filteredRows)
  return account && userTokens.length > 0 ? (
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
