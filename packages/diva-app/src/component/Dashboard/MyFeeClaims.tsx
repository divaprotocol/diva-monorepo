import { GridColDef, GridRowModel } from '@mui/x-data-grid/x-data-grid'
import { Button, Stack } from '@mui/material'
import React, { useState } from 'react'
import { ethers } from 'ethers'

import { config } from '../../constants'
import { SideMenu } from './SideMenu'
import PoolsTable from '../PoolsTable'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { useQuery } from 'react-query'
import {
  FeeRecipientCollateralToken,
  queryMyFeeClaims,
} from '../../lib/queries'
import { request } from 'graphql-request'
import { useWallet } from '@web3-ui/hooks'

const SubmitCell = (props: any) => {
  const { provider } = useWallet()

  const chainId = provider?.network?.chainId

  const diva =
    chainId != null
      ? new ethers.Contract(
          config[chainId!].divaAddress,
          DIVA_ABI,
          provider.getSigner()
        )
      : null

  return (
    <Button
      color="primary"
      type="submit"
      variant="contained"
      onClick={() => {
        if (diva != null) {
          diva.claimFees(props.row.Address).catch((err) => {
            console.error(err)
          })
        }
      }}
    >
      Submit value
    </Button>
  )
}

const columns: GridColDef[] = [
  {
    field: 'TokenSymbol',
    align: 'center',
    headerAlign: 'center',
    minWidth: 200,
    headerName: 'Token Symbol',
  },
  {
    field: 'Amount',
    headerAlign: 'center',
    align: 'center',
    disableReorder: true,
    disableColumnMenu: true,
  },
  {
    field: 'submitValue',
    align: 'right',
    headerAlign: 'right',
    headerName: '',
    minWidth: 1000,
    renderCell: (props) => <SubmitCell {...props} />,
  },
]

export function MyFeeClaims() {
  const wallet = useWallet()
  const chainId = wallet?.provider?.network?.chainId
  const userAddress = wallet?.connection?.userAddress
  const [page, setPage] = useState(0)
  const query = useQuery<{ fees: FeeRecipientCollateralToken[] }>(
    `pools-fees-${userAddress}`,
    async () => {
      if (chainId != null) {
        const result = await request(
          config[chainId as number].divaSubgraph,
          queryMyFeeClaims(userAddress)
        )
        return { fees: result.feeRecipients[0].collateralTokens }
      }
    }
  )

  const feeRecipients =
    query?.data?.fees || ([] as FeeRecipientCollateralToken[])
  let feeCount = 0
  const rows: GridRowModel[] = feeRecipients.reduce((acc, val) => {
    feeCount = feeCount + 1
    return [
      ...acc,
      {
        id: feeCount,
        TokenSymbol: `${val.collateralToken.symbol}`,
        Amount: `${val.amount}`,
        Address: `${val.collateralToken.id}`,
      },
    ]
  }, [] as GridRowModel[])

  const filtered = rows.filter((v) => v.Amount != 0)
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
        disableRowClick
        columns={columns}
        rows={filtered}
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
