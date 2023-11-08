import {
  Box,
  Button,
  Stack,
  Pagination,
  CircularProgress,
  Divider,
  Tooltip,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import DeleteIcon from '@mui/icons-material/Delete'
import { formatUnits } from 'ethers/lib/utils'
import { useState, useEffect, useMemo } from 'react'
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
import { CoinIconPair } from '../CoinIcon'
import { useHistory } from 'react-router-dom'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { GrayText, GreenText, RedText } from '../Trade/Orders/UiStyles'
import { makeStyles } from '@mui/styles'
import { ExpiresInCell } from '../Markets/ExpiresInCell'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import DropDownFilter from '../PoolsTableFilter/DropDownFilter'
import ButtonFilter from '../PoolsTableFilter/ButtonFilter'
import FilterListIcon from '@mui/icons-material/FilterList'
import { FilterDrawerModal } from './FilterDrawerMobile'
import useTheme from '@mui/material/styles/useTheme'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import { MyOrdersPoolCard } from './MyOrdersPoolCard'
import { MobileFilterOptions } from './MobileFilterOptions'

export function MyOrders() {
  const [dataOrders, setDataOrders] = useState([])
  const [page, setPage] = useState(0)
  const [loadingValue, setLoadingValue] = useState(new Map())
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
  const theme = useTheme()
  const { provider } = useConnectionContext()

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
    const takerAmount = formatUnits(order.takerAmount, decimals)
    const makerAmount = formatUnits(order.makerAmount, decimals)
    let quantity = 0
    let price = 0
    let payReceive = 0
    const remainingTakerAmount = formatUnits(
      metaData.remainingFillableTakerAmount,
      decimals
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
      PoolId: poolId,
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
    const makerAmount = formatUnits(order.makerAmount, decimals)
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
      PoolId: poolId,
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
          AssetId: sellOrderShort[0].shortToken.symbol,
          PoolId: sellOrderShort[0].id,
        }
        dataOrders.push({ ...fields, ...shortFields })
      }
      if (sellOrderLong.length > 0) {
        const fields = getSellOrderFields(record, sellOrderLong[0])
        const longFields = {
          id: 'long' + records.indexOf(record as never),
          position: 'long',
          AssetId: sellOrderLong[0].longToken.symbol,
          PoolId: sellOrderLong[0].id,
        }
        dataOrders.push({ ...fields, ...longFields })
      }
      if (buyOrderShort.length > 0) {
        const fields = getBuyOrderFields(record, buyOrderShort[0])
        const shortFields = {
          id: 'short' + records.indexOf(record as never),
          position: 'short',
          AssetId: buyOrderShort[0].shortToken.symbol,
          PoolId: buyOrderShort[0].id,
        }
        dataOrders.push({ ...fields, ...shortFields })
      }
      if (buyOrderLong.length > 0) {
        const fields = getBuyOrderFields(record, buyOrderLong[0])
        const longFields = {
          id: 'long' + records.indexOf(record as never),
          position: 'long',
          AssetId: buyOrderLong[0].longToken.symbol,
          PoolId: buyOrderLong[0].id,
        }
        dataOrders.push({ ...fields, ...longFields })
      }
    })
    return dataOrders
  }

  async function cancelOrder(event, orderHash, chainId) {
    event.stopPropagation()
    setLoadingValue((prevStates) => {
      const newStates = new Map(prevStates)
      newStates.set(orderHash, true)
      return newStates
    })
    //get the order details in current form from 0x before cancelling it.
    const cancelOrder = await getOrderDetails(orderHash, chainId)
    cancelLimitOrder(cancelOrder, chainId, provider).then(function (
      cancelOrderResponse: any
    ) {
      if (cancelOrderResponse?.hash != null) {
        alert('Order successfully canceled')
        /* setLoadingValue(false) */
        //update myOrders table
        componentDidMount()
      } else {
        /* setLoadingValue(false) */
        alert('order could not be canceled')
      }
      setLoadingValue((prevStates) => {
        const newStates = new Map(prevStates)
        newStates.set(orderHash, false)
        return newStates
      })
    })
  }

  const componentDidMount = async () => {
    try {
      const userOrders = await getUserOrders(makerAccount, chainId)
      const dataOrders = await getDataOrders(userOrders)

      const allJsonResponse = await Promise.all(
        dataOrders.map(async (order) => {
          let json = null
          if (order.underlying.endsWith('json')) {
            try {
              const response = await fetch(order.underlying)
              json = await response.json()
            } catch (error) {
              console.error(
                `Error fetching JSON for order: ${order.underlying}`,
                error
              )
            }
          }
          return {
            ...order,
            underlying: json?.title ? json.title : order.underlying,
          }
        })
      )

      setDataOrders(allJsonResponse)
    } catch (error) {
      console.error('An error occurred while fetching user orders:', error)
    }
  }

  useEffect(() => {
    componentDidMount()
  }, [])

  const columns: GridColDef[] = [
    {
      field: 'AssetId',
      align: 'left',
      renderHeader: (_header) => <GrayText>{'Asset Id'}</GrayText>,
      renderCell: (cell) => <GrayText>{cell.value}</GrayText>,
    },
    {
      field: 'PoolId',
      align: 'left',
      renderHeader: (header) => <GrayText>{'Pool Id'}</GrayText>,
      renderCell: (cell) => (
        <Tooltip title={cell.value}>
          <GrayText>{getShortenedAddress(cell.value, 6, 0)}</GrayText>
        </Tooltip>
      ),
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
          loading={loadingValue.get(cell.value) || false}
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
              marginTop: theme.spacing(2),
              marginBottom: theme.spacing(2),
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
                  {filteredRows.map((row) => (
                    <MyOrdersPoolCard
                      row={row}
                      key={row.id}
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
                history.push(`../../${row.row.PoolId}/${row.row.position}`)
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
