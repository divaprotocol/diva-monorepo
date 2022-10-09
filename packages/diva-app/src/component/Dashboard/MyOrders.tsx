import {
  Box,
  Button,
  Stack,
  InputAdornment,
  Input,
  Pagination,
  CircularProgress,
  Grid,
  Typography,
  Divider,
  Radio,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  TextField,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import DeleteIcon from '@mui/icons-material/Delete'
import { formatUnits } from 'ethers/lib/utils'
import React, { useState, useEffect, useMemo } from 'react'
import { getOrderDetails, getUserOrders } from '../../DataService/OpenOrders'
import { cancelLimitOrder } from '../../Orders/CancelLimitOrder'
import {
  fetchPositionTokens,
  selectChainId,
  selectPools,
  selectRequestStatus,
  selectUserAddress,
} from '../../Redux/appSlice'
import { useAppDispatch, useAppSelector } from '../../Redux/hooks'
import { getDateTime } from '../../Util/Dates'
import { Search } from '@mui/icons-material'
import { CoinIconPair } from '../CoinIcon'
import { useHistory } from 'react-router-dom'
import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid'
import { GrayText, GreenText, RedText } from '../Trade/Orders/UiStyles'
import { makeStyles } from '@mui/styles'
import { ExpiresInCell } from '../Markets/Markets'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import DropDownFilter from '../PoolsTableFilter/DropDownFilter'
import ButtonFilter from '../PoolsTableFilter/ButtonFilter'
import FilterListIcon from '@mui/icons-material/FilterList'
import { FilterDrawerModal } from './FilterDrawerMobile'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import { getTopNObjectByProperty } from '../../Util/dashboard'

const MyOrdersPoolCard = ({
  row,
  cancelOrder,
  loadingValue,
}: {
  row: GridRowModel
  cancelOrder: (event: any, orderHash: string, chainId: string) => Promise<void>
  loadingValue: boolean
}) => {
  const { icon, Id, type, quantity, price, payReceive, position, orderHash } =
    row

  const history = useHistory()
  const chainId = useAppSelector(selectChainId)

  const DATA_ARRAY = [
    {
      label: 'Type',
      value: type,
    },
    {
      label: 'Quantity',
      value: quantity.toFixed(4),
    },
    {
      label: 'Price',
      value: price.toFixed(4),
    },
    {
      label: 'Pay/Receive',
      value: payReceive.toFixed(4),
    },
  ]

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
        onClick={() => {
          history.push(`../../${Id}/${position}`)
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gridGap: '8px',
            }}
          >
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 500,
              }}
            >
              {icon}
            </Typography>
            <Typography
              sx={{
                fontSize: '9.2px',
              }}
            >
              #{Id}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.6} alignItems="center">
            <Typography
              sx={{
                fontSize: '10px',
                fontWeight: 500,
                color: '#828282',
              }}
            >
              Order Expires In
            </Typography>
            <ExpiresInCell row={row} {...row} />
          </Stack>
        </Box>
        <Grid
          container
          rowGap={1.6}
          justifyContent="space-between"
          columnGap={'3px'}
        >
          {DATA_ARRAY.map(({ label, value }, i) => (
            <Grid item key={i} xs={5}>
              <Stack
                direction="row"
                justifyContent={'space-between'}
                sx={{
                  flexGrow: 1,
                }}
              >
                <Box
                  sx={{
                    color: '#828282',
                    minWidth: '60px',
                  }}
                >
                  {label}
                </Box>
                {label === 'Type' ? (
                  <>
                    {value === 'BUY' ? (
                      <GreenText>{value}</GreenText>
                    ) : (
                      <RedText>{value}</RedText>
                    )}
                  </>
                ) : (
                  <Box>{value}</Box>
                )}
              </Stack>
            </Grid>
          ))}
        </Grid>
        <Stack alignItems="flex-end">
          <LoadingButton
            variant="outlined"
            startIcon={<DeleteIcon />}
            size="small"
            onClick={(event) => cancelOrder(event, orderHash, chainId)}
            sx={{
              fontSize: '10px',
            }}
            loading={loadingValue}
          >
            Cancel
          </LoadingButton>
        </Stack>
      </Stack>
      <Divider light />
    </>
  )
}

const MobileFilterOptions = ({
  buyClicked,
  setBuyClicked,
  sellClicked,
  setSellClicked,
  rows,
  searchInput,
  setSearchInput,
  checkedState,
  setCheckedState,
  setSearch,
}) => {
  const top4UnderlyingTokens = useMemo(
    () => getTopNObjectByProperty(rows, 'underlying', 4),
    [rows]
  )

  const handleOnChange = (position) => {
    const updatedCheckedState = checkedState.map((item, index) =>
      index === position ? !item : item
    )

    setCheckedState(updatedCheckedState)

    const underlyingTokenString = updatedCheckedState
      .map((currentState, index) => {
        if (currentState === true) {
          return top4UnderlyingTokens[index]
        }
      })
      .filter((item) => item !== undefined)
      .map((item) => item.token)
      .join(' ')
      .toString()

    setSearch(underlyingTokenString)
  }

  return (
    <>
      <Accordion
        sx={{
          backgroundColor: '#000000',
          '&:before': {
            display: 'none',
          },
          marginTop: '28px',
        }}
        defaultExpanded
      >
        <AccordionSummary
          aria-controls="panel1a-content"
          id="panel1a-header"
          sx={{
            padding: '0px',
            backgroundColor: '#000000',
          }}
          expandIcon={<ArrowDropUpIcon />}
        >
          <Typography
            sx={{
              fontSize: '16px',
            }}
          >
            Underlying
          </Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            backgroundColor: '#000000',
            padding: '0px',
          }}
        >
          <Box>
            <TextField
              value={searchInput}
              aria-label="Filter creator"
              sx={{ width: '100%', height: '50px', marginTop: '16px' }}
              onChange={(event) => setSearchInput(event.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="secondary" />
                  </InputAdornment>
                ),
              }}
              placeholder="Enter Underlying"
              color="secondary"
            />
          </Box>
          <Stack
            spacing={0.6}
            sx={{
              marginTop: '16px',
              fontSize: '14px',
            }}
          >
            {top4UnderlyingTokens.map((underlying, index) => (
              <Stack
                direction="row"
                justifyContent={'space-between'}
                alignItems={'center'}
                key={index}
              >
                <Box>{underlying.token}</Box>
                <Checkbox
                  checked={checkedState[index]}
                  id={`custom-checkbox-${index}`}
                  onChange={() => handleOnChange(index)}
                />
              </Stack>
            ))}
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Divider />
      <Stack
        sx={{
          paddingTop: '20px',
        }}
      >
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>Buy</Box>
          <Radio
            checked={buyClicked}
            size="small"
            onClick={() => setBuyClicked(!buyClicked)}
          />
        </Stack>
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>Sell</Box>
          <Radio
            checked={sellClicked}
            size="small"
            onClick={() => setSellClicked(!sellClicked)}
          />
        </Stack>
      </Stack>
    </>
  )
}

export function MyOrders() {
  const [dataOrders, setDataOrders] = useState([])
  const [page, setPage] = useState(0)
  const [loadingValue, setLoadingValue] = useState(false)
  const [underlyingButtonLabel, setUnderlyingButtonLabel] =
    useState('Underlying')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [buyClicked, setBuyClicked] = useState(false)
  const [sellClicked, setSellClicked] = useState(false)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [checkedState, setCheckedState] = useState(new Array(4).fill(false))

  const chainId = useAppSelector(selectChainId)
  const makerAccount = useAppSelector(selectUserAddress)
  const pools = useAppSelector((state) => selectPools(state))
  const poolsRequestStatus = useAppSelector(selectRequestStatus('app/pools'))
  const history = useHistory()
  const dispatch = useAppDispatch()
  const { isMobile } = useCustomMediaQuery()

  const useStyles = makeStyles({
    root: {
      '&.MuiDataGrid-root .MuiDataGrid-cell:focus': {
        outline: 'none',
      },
    },
  })
  const classes = useStyles()

  const handleUnderLyingInput = (e) => {
    setSearch(e.target.value)
    setUnderlyingButtonLabel(
      e.target.value === '' ? 'Underlying' : e.target.value
    )
  }
  const filterBuyOrders = () => {
    if (buyClicked) {
      setBuyClicked(false)
    } else {
      setBuyClicked(true)
    }
  }
  const filterSellOrders = () => {
    if (sellClicked) {
      setSellClicked(false)
    } else {
      setSellClicked(true)
    }
  }

  useEffect(() => {
    dispatch(fetchPositionTokens({ page }))
  }, [dispatch, page])

  const trimPools = pools.map((pool) => {
    return {
      id: pool.id,
      collateralToken: pool.collateralToken,
      underlying: pool.referenceAsset,
      shortToken: pool.shortToken,
      longToken: pool.longToken,
    }
  })

  function getBuyOrderFields(record: any, pool: any) {
    const order = record.order
    const metaData = record.metaData
    const type = 'BUY'
    const poolId = pool.id
    const underlying = pool.underlying
    const decimals = pool.collateralToken.decimals
    const takerAmount = formatUnits(order.takerAmount)
    const makerAmount = formatUnits(order.makerAmount, decimals)
    let quantity = 0
    let price = 0
    let payReceive = 0
    const remainingTakerAmount = formatUnits(
      metaData.remainingFillableTakerAmount
    )
    if (remainingTakerAmount < takerAmount) {
      quantity = Number(remainingTakerAmount)
    } else {
      quantity = Number(takerAmount)
    }
    payReceive = Number(makerAmount)
    price = Number(payReceive) / Number(takerAmount)
    return {
      type: type,
      Id: poolId,
      icon: underlying,
      underlying: underlying,
      quantity: quantity,
      price: price,
      payReceive: payReceive,
      Expiry: getDateTime(order.expiry),
      orderHash: metaData.orderHash,
    }
  }
  function getSellOrderFields(record: any, pool: any) {
    const order = record.order
    const metaData = record.metaData
    const type = 'SELL'
    const poolId = pool.id
    const underlying = pool.underlying
    const decimals = pool.collateralToken.decimals
    const takerAmount = formatUnits(order.takerAmount, decimals)
    const makerAmount = formatUnits(order.makerAmount)
    let quantity = 0
    let price = 0
    let payReceive = 0
    const remainingTakerAmount = formatUnits(
      metaData.remainingFillableTakerAmount,
      decimals
    )
    const askAmount = Number(takerAmount) / Number(makerAmount)
    if (remainingTakerAmount == takerAmount) {
      quantity = Number(makerAmount)
    } else {
      quantity = Number(remainingTakerAmount) / askAmount
    }
    payReceive = Number(remainingTakerAmount)
    price = askAmount
    return {
      type: type,
      Id: poolId,
      icon: underlying,
      underlying: underlying,
      quantity: quantity,
      price: price,
      payReceive: payReceive,
      Expiry: getDateTime(order.expiry),
      orderHash: metaData.orderHash,
    }
  }

  function getDataOrders(userOrders: any) {
    const dataOrders = []
    const records = userOrders
    records.forEach((record) => {
      const order = record.order
      const sellOrderShort = trimPools.filter(
        (token) => token.shortToken.id === order.makerToken
      )
      const sellOrderLong = trimPools.filter(
        (token) => token.longToken.id === order.makerToken
      )
      const buyOrderShort = trimPools.filter(
        (token) => token.shortToken.id === order.takerToken
      )
      const buyOrderLong = trimPools.filter(
        (token) => token.longToken.id === order.takerToken
      )
      if (sellOrderShort.length > 0) {
        const fields = getSellOrderFields(record, sellOrderShort[0])
        const shortFields = {
          id: 'short' + records.indexOf(record as never),
          position: 'short',
          symbol: sellOrderShort[0].shortToken.symbol,
        }
        dataOrders.push({ ...fields, ...shortFields })
      }
      if (sellOrderLong.length > 0) {
        const fields = getSellOrderFields(record, sellOrderLong[0])
        const longFields = {
          id: 'long' + records.indexOf(record as never),
          position: 'long',
          symbol: sellOrderLong[0].longToken.symbol,
        }
        dataOrders.push({ ...fields, ...longFields })
      }
      if (buyOrderShort.length > 0) {
        const fields = getBuyOrderFields(record, buyOrderShort[0])
        const shortFields = {
          id: 'short' + records.indexOf(record as never),
          position: 'short',
          symbol: buyOrderShort[0].shortToken.symbol,
        }
        dataOrders.push({ ...fields, ...shortFields })
      }
      if (buyOrderLong.length > 0) {
        const fields = getBuyOrderFields(record, buyOrderLong[0])
        const longFields = {
          id: 'long' + records.indexOf(record as never),
          position: 'long',
          symbol: buyOrderLong[0].longToken.symbol,
        }
        dataOrders.push({ ...fields, ...longFields })
      }
    })
    return dataOrders
  }

  async function cancelOrder(event, orderHash, chainId) {
    event.stopPropagation()
    setLoadingValue(true)
    //get the order details in current form from 0x before cancelling it.
    const cancelOrder = await getOrderDetails(orderHash, chainId)
    cancelLimitOrder(cancelOrder, chainId).then(function (
      cancelOrderResponse: any
    ) {
      const log = cancelOrderResponse?.logs?.[0]
      if (log != null && log.event == 'OrderCancelled') {
        alert('Order successfully canceled')
        /* setLoadingValue(false) */
        //update myOrders table
        componentDidMount()
      } else {
        /* setLoadingValue(false) */
        alert('order could not be canceled')
      }
      setLoadingValue(false)
    })
  }

  const componentDidMount = async () => {
    const userOrders = await getUserOrders(makerAccount, chainId)
    const dataOrders = getDataOrders(userOrders)
    setDataOrders(dataOrders)
  }

  useEffect(() => {
    componentDidMount()
  }, [])

  const columns: GridColDef[] = [
    {
      field: 'symbol',
      align: 'left',
      renderHeader: (_header) => <GrayText>{'Asset Id'}</GrayText>,
      renderCell: (cell) => <GrayText>{cell.value}</GrayText>,
    },
    {
      field: 'icon',
      align: 'right',
      headerName: '',
      disableReorder: true,
      disableColumnMenu: true,
      renderCell: (cell) => <CoinIconPair assetName={cell.value} />,
    },
    {
      field: 'underlying',
      align: 'left',
      minWidth: 100,
      headerName: 'Underlying',
    },
    {
      field: 'type',
      align: 'center',
      headerAlign: 'center',
      headerName: 'Type',
      renderCell: (cell) =>
        cell.value === 'BUY' ? (
          <GreenText>{cell.value}</GreenText>
        ) : (
          <RedText>{cell.value}</RedText>
        ),
    },
    {
      field: 'quantity',
      align: 'right',
      headerAlign: 'right',
      headerName: 'Quantity',
      type: 'number',
      renderCell: (cell) => cell.value.toFixed(4),
    },
    {
      field: 'price',
      align: 'right',
      headerAlign: 'right',
      headerName: 'Price',
      type: 'number',
      minWidth: 100,
      renderCell: (cell) => cell.value.toFixed(4),
    },
    {
      field: 'payReceive',
      align: 'right',
      headerAlign: 'right',
      headerName: 'Pay/Receive',
      type: 'number',
      minWidth: 150,
      renderCell: (cell) => cell.value.toFixed(4),
    },
    {
      field: 'Expiry',
      minWidth: 170,
      align: 'right',
      headerAlign: 'right',
      headerName: 'Order Expires In',
      type: 'dateTime',
      renderCell: (props) => <ExpiresInCell {...props} />,
    },
    {
      field: 'orderHash',
      align: 'center',
      headerAlign: 'center',
      headerName: 'Cancel',
      minWidth: 170,
      renderCell: (cell) => (
        <LoadingButton
          variant="outlined"
          startIcon={<DeleteIcon />}
          size="small"
          loading={loadingValue}
          onClick={(event) => cancelOrder(event, cell.value, chainId)}
        >
          Cancel
        </LoadingButton>
      ),
    },
  ]

  const filteredRows = useMemo(() => {
    if (search != null && search.length > 0) {
      if (buyClicked && sellClicked) {
        return dataOrders
      } else if (buyClicked) {
        return dataOrders
          .filter((v) => v.type.includes('BUY'))
          .filter(
            (v) =>
              v.underlying.toLowerCase().includes(search.toLowerCase()) ||
              search.toLowerCase().includes(v.underlying.toLowerCase())
          )
      } else if (sellClicked) {
        return dataOrders
          .filter((v) => v.type.includes('SELL'))
          .filter(
            (v) =>
              v.underlying.toLowerCase().includes(search.toLowerCase()) ||
              search.toLowerCase().includes(v.underlying.toLowerCase())
          )
      } else {
        return dataOrders.filter(
          (v) =>
            v.underlying.toLowerCase().includes(search.toLowerCase()) ||
            search.toLowerCase().includes(v.underlying.toLowerCase())
        )
      }
    } else {
      if (buyClicked && sellClicked) {
        return dataOrders
      } else if (buyClicked) {
        return dataOrders.filter((v) => v.type.includes('BUY'))
      } else if (sellClicked) {
        return dataOrders.filter((v) => v.type.includes('SELL'))
      } else {
        return dataOrders
      }
    }
  }, [search, buyClicked, sellClicked, dataOrders])

  useEffect(() => {
    if (searchInput.length > 0 && searchInput !== null) {
      setCheckedState(new Array(4).fill(false))
      setSearch(searchInput)
    }
  }, [searchInput])

  useEffect(() => {
    if (checkedState.includes(true)) {
      setSearchInput('')
    }
  }, [checkedState])

  return (
    <Stack
      direction="column"
      sx={{
        height: '100%',
      }}
      spacing={6}
      paddingRight={isMobile ? 0 : 6}
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
          <ButtonFilter
            id="Buy"
            sx={{
              borderRight: 0,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
            ButtonLabel="Buy"
            onClick={filterBuyOrders}
          />
          <Divider orientation="vertical" />
          <ButtonFilter
            id="Sell"
            sx={{
              borderLeft: 0,
              borderTopLeftRadius: 0,
              borderBottomLeftRadius: 0,
            }}
            ButtonLabel="Sell"
            onClick={filterSellOrders}
          />
        </Box>
      )}
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
            {poolsRequestStatus === 'fulfilled' ? (
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
                  {filteredRows.map((row, i) => (
                    <MyOrdersPoolCard
                      row={row}
                      key={i}
                      cancelOrder={cancelOrder}
                      loadingValue={loadingValue}
                    />
                  ))}
                </Box>
                <Pagination
                  sx={{
                    minHeight: '70px',
                    fontSize: '14px',
                  }}
                  count={10}
                  onChange={(e, page) => setPage(page - 1)}
                  page={page + 1}
                />
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
              children={
                <MobileFilterOptions
                  buyClicked={buyClicked}
                  setBuyClicked={setBuyClicked}
                  sellClicked={sellClicked}
                  setSellClicked={setSellClicked}
                  rows={dataOrders}
                  checkedState={checkedState}
                  searchInput={searchInput}
                  setSearchInput={setSearchInput}
                  setSearch={setSearch}
                  setCheckedState={setCheckedState}
                />
              }
              onApplyFilter={() => {
                setIsFilterDrawerOpen(false)
              }}
              onClearFilter={() => {
                setSearch('')
                setSearchInput('')
                setBuyClicked(false)
                setSellClicked(false)
                setCheckedState(new Array(4).fill(false))
              }}
            />
          </Stack>
        ) : (
          <Stack height="100%" width="100%">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'end',
                flexDirection: 'column',
                paddingBottom: '1em',
              }}
            >
              <Input
                value={search}
                placeholder="Filter underlying"
                aria-label="Filter underlying"
                onChange={(e) => setSearch(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                }
              />
            </Box>
            <DataGrid
              className={classes.root}
              rows={filteredRows}
              pagination
              columns={columns}
              loading={poolsRequestStatus !== 'fulfilled'}
              onPageChange={(page) => setPage(page)}
              selectedPoolsView="Table"
              page={page}
              onRowClick={(row) => {
                history.push(`../../${row.row.Id}/${row.row.position}`)
              }}
              componentsProps={{
                row: {
                  style: {
                    cursor: 'pointer',
                  },
                },
              }}
            />
          </Stack>
        )}
      </>
    </Stack>
  )
}
