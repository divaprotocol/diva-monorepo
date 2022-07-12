import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import {
  Button,
  Container,
  Dialog,
  DialogActions,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { request } from 'graphql-request'
import { parseUnits } from 'ethers/lib/utils'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { useQuery } from 'react-query'
import ERC20 from '@diva/contracts/abis/erc20.json'
import { config } from '../../constants'
import PoolsTable from '../PoolsTable'
import {
  FeeRecipientCollateralToken,
  queryFeeRecipients,
} from '../../lib/queries'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import {
  fetchFeeRecipients,
  selectFeeRecipients,
  selectRequestStatus,
} from '../../Redux/appSlice'
import { useAppDispatch, useAppSelector } from '../../Redux/hooks'

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
  const [loadingValue, setLoadingValue] = useState(false)
  const handleOpen = () => {
    setAmountValue((parseFloat(props.row.Amount) / 10 ** decimal).toString())
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Container>
      <LoadingButton variant="contained" onClick={handleOpen}>
        Transfer Fees
      </LoadingButton>
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
            <LoadingButton
              sx={{ mt: '1em', alignSelf: 'right' }}
              color="primary"
              type="submit"
              variant="contained"
              loading={loadingValue}
              onClick={() => {
                addressValue && amountValue && setLoadingValue(true)
                if (diva != null) {
                  diva
                    .transferFeeClaim(
                      addressValue,
                      props.row.Address,
                      parseUnits(amountValue, decimal)
                    )
                    .then(() => {
                      setLoadingValue(false)
                      handleClose()
                    })
                    .catch((err) => {
                      console.error(err)
                      setLoadingValue(false)
                    })
                }
              }}
            >
              Transfer Fees
            </LoadingButton>
          </Stack>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

const ClaimFeesCell = (props: any) => {
  const { provider } = useConnectionContext()

  const chainId = provider?.network?.chainId
  const [loadingValue, setLoadingValue] = useState(false)

  const diva =
    chainId != null
      ? new ethers.Contract(
          config[chainId!].divaAddress,
          DIVA_ABI,
          provider.getSigner()
        )
      : null

  return (
    <LoadingButton
      color="primary"
      type="submit"
      variant="contained"
      loading={loadingValue}
      onClick={() => {
        setLoadingValue(true)
        if (diva != null) {
          diva
            .claimFees(props.row.Address)
            .then(() => {
              setLoadingValue(false)
            })
            .catch((err) => {
              console.error(err)
              setLoadingValue(false)
            })
        }
      }}
    >
      Claim Fees
    </LoadingButton>
  )
}

const AmountCell = (props: any) => {
  const context = useConnectionContext()
  const [decimal, setDecimal] = useState<number>()
  const token = new ethers.Contract(
    props.row.Address,
    ERC20,
    context.provider.getSigner()
  )
  token
    .decimals()
    .then((decimals: number) => {
      setDecimal(decimals)
    })
    .catch((e) => {
      console.error(e)
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
    field: 'Underlying',
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
  const { address: userAddress } = useConnectionContext()
  const [page, setPage] = useState(0)

  const dispatch = useAppDispatch()

  const feeRecipients = useAppSelector(selectFeeRecipients)
  const poolsRequestStatus = useAppSelector(
    selectRequestStatus('app/feeRecipients')
  )

  useEffect(() => {
    if (userAddress != null) {
      dispatch(
        fetchFeeRecipients({
          address: userAddress,
        })
      )
    }
  }, [dispatch, page, userAddress])

  let feeCount = 0
  const rows: GridRowModel[] = feeRecipients
    .map((v) => v.collateralTokens)
    .flat()
    .reduce((acc, val) => {
      feeCount = feeCount + 1
      return [
        ...acc,
        {
          id: feeCount,
          Underlying: `${val.collateralToken.symbol}`,
          Amount: `${val.amount}`,
          Address: `${val.collateralToken.id}`,
        },
      ]
    }, [] as GridRowModel[])

  const filtered = rows.filter((v) => v.Amount != 0)
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
            disableRowClick
            page={page}
            rows={filtered}
            loading={poolsRequestStatus === 'pending'}
            columns={columns}
            onPageChange={(page) => setPage(page)}
          />
        </>
      )}
    </Stack>
  )
}
