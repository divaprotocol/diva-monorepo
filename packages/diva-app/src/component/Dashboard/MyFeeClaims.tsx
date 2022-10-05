import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import {
  Box,
  CircularProgress,
  Button,
  Dialog,
  DialogActions,
  Divider,
  Stack,
  TextField,
  Typography,
  Radio,
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
  selectUserAddress,
} from '../../Redux/appSlice'
import { useDispatch } from 'react-redux'
import { useAppDispatch, useAppSelector } from '../../Redux/hooks'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import DropDownFilter from '../PoolsTableFilter/DropDownFilter'
import FilterListIcon from '@mui/icons-material/FilterList'
import { FilterDrawerModal } from './FilterDrawerMobile'

const TransferFeesCell = (props: any) => {
  const { provider } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const dispatch = useDispatch()
  const { isMobile } = useCustomMediaQuery()

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
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        width: isMobile ? 'auto' : '100%',
      }}
    >
      <LoadingButton
        variant="contained"
        onClick={handleOpen}
        loading={loadingValue}
        sx={{
          fontSize: isMobile ? '10px' : 'auto',
          padding: isMobile ? '5px 11px' : 'auto',
        }}
      >
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
                    .then((tx) => {
                      tx.wait().then(() => {
                        setTimeout(() => {
                          dispatch(
                            fetchFeeRecipients({
                              address: userAddress,
                            })
                          )
                          setLoadingValue(false)
                        }, 10000)
                      })
                    })
                    .catch((err) => {
                      console.error(err)
                      setLoadingValue(false)
                    })
                }
                handleClose()
              }}
            >
              Transfer Fees
            </LoadingButton>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

const ClaimFeesCell = (props: any) => {
  const { provider } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const dispatch = useDispatch()
  const { isMobile } = useCustomMediaQuery()

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
      sx={{
        fontSize: isMobile ? '10px' : 'auto',
        padding: isMobile ? '5px 11px' : 'auto',
      }}
      onClick={() => {
        setLoadingValue(true)
        if (diva != null) {
          diva
            .claimFees(props.row.Address)
            .then((tx) => {
              tx.wait().then(() => {
                setTimeout(() => {
                  dispatch(
                    fetchFeeRecipients({
                      address: userAddress,
                    })
                  )
                  setLoadingValue(false)
                }, 10000)
              })
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

const MyFeeClaimsTokenCard = ({ row }: { row: GridRowModel }) => {
  const { Underlying } = row

  return (
    <>
      <Divider light />
      <Stack
        sx={{
          fontSize: '10px',
          width: '100%',
          margin: '12px 0',
        }}
        spacing={1.6}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            sx={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#FFFFFF',
            }}
          >
            {Underlying}
          </Typography>
          <Stack spacing={1.6} direction="row">
            <Typography
              sx={{
                fontSize: '10px',
                color: '#828282',
              }}
            >
              Amount
            </Typography>
            <Typography
              sx={{
                fontSize: '9.2px',
              }}
            >
              <AmountCell row={row} />
            </Typography>
          </Stack>
        </Box>

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <ClaimFeesCell row={row} {...row} />
          <TransferFeesCell row={row} {...row} />
        </Stack>
      </Stack>
      <Divider light />
    </>
  )
}

export function MyFeeClaims() {
  const { address: userAddress } = useConnectionContext()
  const [page, setPage] = useState(0)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [selectedFilterFromRadio, setSelectedFilterFromRadio] = useState('')

  const dispatch = useAppDispatch()
  const { isMobile } = useCustomMediaQuery()

  const feeRecipients = useAppSelector(selectFeeRecipients)
  const poolsRequestStatus = useAppSelector(
    selectRequestStatus('app/feeRecipients')
  )
  const [underlyingButtonLabel, setUnderlyingButtonLabel] = useState('Assets')
  const [search, setSearch] = useState('')

  const handleUnderLyingInput = (e) => {
    setSearch(e.target.value)
    setUnderlyingButtonLabel(e.target.value === '' ? 'Assets' : e.target.value)
  }

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

  const filteredRows =
    search != null && search.length > 0
      ? rows.filter((v) =>
          v.Underlying.toLowerCase().includes(search.toLowerCase())
        )
      : rows

  const MobileFilterOptions = () => (
    <>
      <Stack
        spacing={0.6}
        sx={{
          marginTop: '16px',
          fontSize: '14px',
          marginBottom: '32px',
        }}
      >
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>dUSD</Box>
          <Radio
            checked={selectedFilterFromRadio === 'dUSD'}
            size="small"
            value="dUSD"
            onChange={(e) => setSelectedFilterFromRadio(e.target.value)}
          />
        </Stack>
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>USD</Box>
          <Radio
            checked={selectedFilterFromRadio === 'USD'}
            size="small"
            value="USD"
            onChange={(e) => setSelectedFilterFromRadio(e.target.value)}
          />
        </Stack>
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>DAI</Box>
          <Radio
            checked={selectedFilterFromRadio === 'DAI'}
            size="small"
            value="DAI"
            onChange={(e) => setSelectedFilterFromRadio(e.target.value)}
          />
        </Stack>
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>WAGMI16</Box>
          <Radio
            checked={selectedFilterFromRadio === 'WAGMI16'}
            size="small"
            value="WAGMI16"
            onChange={(e) => setSelectedFilterFromRadio(e.target.value)}
          />
        </Stack>
      </Stack>
      <Divider />
    </>
  )

  return (
    <Stack
      direction="column"
      sx={{
        height: '100%',
      }}
      paddingRight={isMobile ? 0 : 6}
      spacing={4}
    >
      {!isMobile && (
        <Box
          paddingY={2}
          sx={{
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          <DropDownFilter
            id="Underlying Filter"
            DropDownButtonLabel={underlyingButtonLabel}
            InputValue={search}
            onInputChange={handleUnderLyingInput}
          />
        </Box>
      )}
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
          {isMobile ? (
            <Stack
              width={'100%'}
              sx={{
                marginTop: '16px',
                marginBottom: '16px',
              }}
              spacing={2}
            >
              {poolsRequestStatus !== 'pending' ? (
                <>
                  <Button
                    onClick={() => {
                      setIsFilterDrawerOpen(!isFilterDrawerOpen)
                    }}
                    startIcon={<FilterListIcon fontSize="small" />}
                    variant="outlined"
                    sx={{
                      width: '84px',
                      height: '30px',
                      fontSize: '13px',
                      padding: '4px 10px',
                      textTransform: 'none',
                    }}
                    color={isFilterDrawerOpen ? 'primary' : 'secondary'}
                  >
                    Filters
                  </Button>
                  <Box>
                    {filteredRows.map((row) => (
                      <MyFeeClaimsTokenCard row={row} key={row.Id} />
                    ))}
                  </Box>
                </>
              ) : (
                <CircularProgress
                  sx={{
                    margin: '0 auto',
                    marginTop: 10,
                  }}
                />
              )}
              <FilterDrawerModal
                open={isFilterDrawerOpen}
                onClose={setIsFilterDrawerOpen}
                children={<MobileFilterOptions />}
                onApplyFilter={() => {
                  if (selectedFilterFromRadio) {
                    setSearch(selectedFilterFromRadio)
                  }
                  setIsFilterDrawerOpen(false)
                }}
                onClearFilter={() => {
                  setSearch('')
                  setSelectedFilterFromRadio('')
                  setIsFilterDrawerOpen(false)
                }}
              />
            </Stack>
          ) : (
            <PoolsTable
              disableRowClick
              page={page}
              rows={filteredRows}
              loading={poolsRequestStatus === 'pending'}
              columns={columns}
              onPageChange={(page) => setPage(page)}
              selectedPoolsView="Table"
            />
          )}
        </>
      )}
    </Stack>
  )
}
