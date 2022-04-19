import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  Stack,
  TextField,
} from '@mui/material'
import { useState } from 'react'
import { ethers } from 'ethers'
import { request } from 'graphql-request'
import { parseUnits } from 'ethers/lib/utils'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { useQuery } from 'react-query'
import ERC20 from '@diva/contracts/abis/erc20.json'

import { config } from '../../constants'
import { SideMenu } from './SideMenu'
import PoolsTable from '../PoolsTable'
import {
  FeeRecipientCollateralToken,
  queryMyFeeClaims,
} from '../../lib/queries'
import { useConnectionContext } from '../../hooks/useConnectionContext'

const TransferFeesCell = (props: any) => {
  const { provider } = useConnectionContext()
  const [decimal, setDecimal] = useState(18)
  const chainId = provider?.network?.chainId
  const token = new ethers.Contract(
    props.row.Address,
    ERC20,
    provider.getSigner()
  )
  token.decimals().then((decimals: number) => {
    setDecimal(decimals)
  })
  const diva =
    chainId != null
      ? new ethers.Contract(
          config[chainId!].divaAddress,
          DIVA_ABI,
          provider.getSigner()
        )
      : null

  const [open, setOpen] = useState(false)
  const [addressValue, setAddressValue] = useState('')
  const [amountValue, setAmountValue] = useState('')
  const handleOpen = () => {
    setAmountValue((parseFloat(props.row.Amount) / 10 ** decimal).toString())
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Container>
      <Button variant="contained" onClick={handleOpen}>
        Transfer Fees
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogActions>
          <Stack>
            {'Transfer to address:'}
            <TextField
              defaultValue={addressValue}
              onChange={(e) => {
                setAddressValue(e.target.value)
              }}
            />
            {'Amount:'}
            <TextField
              defaultValue={amountValue}
              onChange={(e) => {
                setAmountValue(e.target.value)
              }}
            />
            <Button
              sx={{ mt: '1em', alignSelf: 'right' }}
              color="primary"
              type="submit"
              variant="contained"
              onClick={() => {
                if (diva != null) {
                  diva
                    .transferFeeClaim(
                      addressValue,
                      props.row.Address,
                      parseUnits(amountValue, decimal)
                    )
                    .catch((err) => {
                      console.error(err)
                    })
                }
                handleClose()
              }}
            >
              Transfer Fees
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

const ClaimFeesCell = (props: any) => {
  const { provider } = useConnectionContext()

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
      Claim Fees
    </Button>
  )
}

const AmountCell = (props: any) => {
  const wallet = useConnectionContext()
  const [decimal, setDecimal] = useState<number>()

  const token = new ethers.Contract(
    props.row.Address,
    ERC20,
    wallet.provider.getSigner()
  )
  token
    .decimals()
    .then((decimals: number) => {
      setDecimal(decimals)
    })
    .catch((e) => {
      console.log(e)
    })
  const amount = parseFloat(props.row.Amount) / 10 ** decimal
  return decimal ? (
    amount > 0.0001 ? (
      <div>{amount.toFixed(4)}</div>
    ) : (
      <div>{'<0.0001'}</div>
    )
  ) : (
    <div>Loading...</div>
  )
}

const columns: GridColDef[] = [
  {
    field: 'TokenSymbol',
    align: 'left',
    headerAlign: 'left',
    minWidth: 200,
    headerName: 'Asset',
  },
  {
    field: 'Amount',
    headerAlign: 'right',
    align: 'right',
    disableReorder: true,
    disableColumnMenu: true,
    minWidth: 200,
    renderCell: (props) => <AmountCell {...props} />,
  },
  {
    field: 'submitValue',
    align: 'right',
    headerAlign: 'right',
    headerName: '',
    minWidth: 200,
    renderCell: (props) => <ClaimFeesCell {...props} />,
  },
  {
    field: 'transferFees',
    align: 'right',
    headerAlign: 'right',
    headerName: '',
    minWidth: 200,
    renderCell: (props) => <TransferFeesCell {...props} />,
  },
]

export function MyFeeClaims() {
  const { chainId, address: userAddress } = useConnectionContext()
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
