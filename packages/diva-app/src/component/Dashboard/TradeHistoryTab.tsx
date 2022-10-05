import { useQuery } from 'react-query'
import {
  OrderFill,
  queryOrderFillsTaker,
  queryOrderFillsMaker,
} from '../../lib/queries'
import request from 'graphql-request'
import { config } from '../../constants'
import { useAppDispatch, useAppSelector } from '../../Redux/hooks'
import {
  fetchPositionTokens,
  selectPools,
  selectRequestStatus,
  selectUserAddress,
} from '../../Redux/appSlice'
import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import { useWhitelist } from '../../hooks/useWhitelist'
import { useEffect, useMemo, useState } from 'react'
import { formatEther, formatUnits } from 'ethers/lib/utils'
import Typography from '@mui/material/Typography'
import styled from 'styled-components'
import { GrayText, GreenText, RedText } from '../Trade/Orders/UiStyles'
import { CoinIconPair } from '../CoinIcon'
import {
  Button,
  CircularProgress,
  Grid,
  Pagination,
  Radio,
  Switch,
} from '@mui/material'
import PoolsTable from '../PoolsTable'
import { getDateTime } from '../../Util/Dates'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import { Box, Divider, Stack } from '@mui/material'
import DropDownFilter from '../PoolsTableFilter/DropDownFilter'
import ToggleFilter from '../PoolsTableFilter/ToggleFilter'
import ButtonFilter from '../PoolsTableFilter/ButtonFilter'
import { BorderLeft } from '@mui/icons-material'
import FilterListIcon from '@mui/icons-material/FilterList'
import { FilterDrawerModal } from './FilterDrawerMobile'

const PageDiv = styled.div`
  width: 100%;
`
type FilledOrder = {
  id: string
  underlying: string
  symbol: string
  type: string
  quantity: string
  paidReceived: string
  price: number
  timestamp: number
}
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
    field: 'Underlying',
    align: 'left',
    minWidth: 150,
    headerName: 'Underlying',
  },
  {
    field: 'type',
    align: 'center',
    headerAlign: 'center',
    headerName: 'Type',
    minWidth: 100,
    renderCell: (cell) =>
      cell.value === 'BUY' ? (
        <GreenText>{cell.value}</GreenText>
      ) : (
        <RedText>{cell.value}</RedText>
      ),
  },
  {
    field: 'quantity',
    align: 'center',
    headerAlign: 'center',
    headerName: 'Quantity',
  },
  {
    field: 'price',
    align: 'center',
    headerAlign: 'center',
    headerName: 'Price',
    minWidth: 100,
  },
  {
    field: 'payReceive',
    align: 'center',
    headerAlign: 'center',
    headerName: 'Paid/Received',
    minWidth: 150,
  },
  {
    field: 'timestamp',
    align: 'right',
    headerAlign: 'right',
    headerName: 'Timestamp',
    minWidth: 200,
  },
]

const TradeHistoryTabTokenCars = ({ row }: { row: GridRowModel }) => {
  const { Underlying, symbol, type, quantity, price, payReceive, timestamp } =
    row

  const DATA_ARRAY = [
    {
      label: 'Type',
      value: type,
    },
    {
      label: 'Quantity',
      value: quantity,
    },
    {
      label: 'Price',
      value: price,
    },
    {
      label: 'Pay/Receive',
      value: payReceive,
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
              {Underlying}
            </Typography>
            <Typography
              sx={{
                fontSize: '9.2px',
              }}
            >
              #{symbol}
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
              Timestamp
            </Typography>
            <Typography
              sx={{
                fontSize: '10px',
              }}
            >
              {timestamp}
            </Typography>
          </Stack>
        </Box>
        <Grid
          container
          rowGap={1.6}
          justifyContent="space-between"
          columnGap={'3px'}
        >
          {DATA_ARRAY.map(({ label, value }) => (
            <Grid item key={label} xs={5}>
              <Stack direction="row" justifyContent={'space-between'}>
                <Box
                  sx={{
                    color: '#828282',
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
        <Stack alignItems="flex-end"></Stack>
      </Stack>
      <Divider light />
    </>
  )
}

export function TradeHistoryTab() {
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector((state) => state.appSlice.chainId)
  const pools = useAppSelector((state) => selectPools(state))
  const { collateralTokens } = useWhitelist()
  const [underlyingButtonLabel, setUnderlyingButtonLabel] =
    useState('Underlying')
  const [search, setSearch] = useState('')
  const [orderType, setOrderType] = useState<string>('')
  const [history, setHistory] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const [buyClicked, setBuyClicked] = useState(false)
  const [sellClicked, setSellClicked] = useState(false)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [selectedFilterFromRadio, setSelectedFilterFromRadio] = useState('')

  const orders: any[] = []
  const dispatch = useAppDispatch()
  const { isMobile } = useCustomMediaQuery()

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

  const orderFills = useQuery<OrderFill[]>('orderFills', async () => {
    if (userAddress != null) {
      const response = request(
        config[chainId].divaSubgraph,
        queryOrderFillsTaker(userAddress)
      ).then((orders) => {
        if (orders.nativeOrderFills != null) {
          return orders.nativeOrderFills
        } else {
          return {}
        }
      })
      return response
    }
  })
  const orderFillsMaker = useQuery<OrderFill[]>('orderFillsMaker', async () => {
    if (userAddress != null) {
      const response = request(
        config[chainId].divaSubgraph,
        queryOrderFillsMaker(userAddress)
      ).then((orders) => {
        if (orders.nativeOrderFills != null) {
          return orders.nativeOrderFills
        } else {
          return {}
        }
      })
      return response
    }
  })

  useEffect(() => {
    if (orderFills.data && orderFillsMaker.data && pools && collateralTokens) {
      const uniqueIds = []
      const everyOrder = orderFills.data
        .concat(orderFillsMaker.data)
        .filter((order) => {
          const isDuplicate = uniqueIds.includes(order.id)
          if (!isDuplicate) {
            uniqueIds.push(order.id)
            return (
              order.makerTokenFilledAmount != '0' &&
              order.takerTokenFilledAmount != '0' &&
              true
            )
          }
          return (
            order.makerTokenFilledAmount != '0' &&
            order.takerTokenFilledAmount != '0' &&
            false
          )
        })
        .sort((a, b) => {
          if (a.timestamp > b.timestamp) return -1
          if (a.timestamp < b.timestamp) return 1
          return 0
        })
      everyOrder.forEach((order) => {
        collateralTokens.forEach((token) => {
          if (order.takerToken.toLowerCase() === token.id.toLowerCase()) {
            pools.forEach((pool) => {
              if (
                pool.shortToken.id.toLowerCase() ===
                order.makerToken.toLowerCase()
              ) {
                orders.push({
                  id: order.id,
                  underlying: pool.referenceAsset,
                  symbol: pool.shortToken.symbol,
                  type:
                    order.taker == userAddress.toLowerCase() ? 'BUY' : 'SELL',
                  paidReceived: formatUnits(
                    order.takerTokenFilledAmount,
                    token.decimals
                  ),
                  quantity: formatEther(order.makerTokenFilledAmount),
                  price:
                    Number(formatUnits(order.takerTokenFilledAmount)) /
                    Number(formatUnits(order.makerTokenFilledAmount)),
                  timestamp: order.timestamp,
                })
              } else if (
                pool.longToken.id.toLowerCase() ===
                order.makerToken.toLowerCase()
              ) {
                orders.push({
                  id: order.id,
                  underlying: pool.referenceAsset,
                  symbol: pool.longToken.symbol,
                  type:
                    order.taker == userAddress.toLowerCase() ? 'BUY' : 'SELL',
                  paidReceived: formatUnits(
                    order.takerTokenFilledAmount,
                    token.decimals
                  ),
                  quantity: formatEther(order.makerTokenFilledAmount),
                  price:
                    Number(formatUnits(order.takerTokenFilledAmount)) /
                    Number(formatUnits(order.makerTokenFilledAmount)),
                  timestamp: order.timestamp,
                })
              }
            })
          } else if (
            order.makerToken.toLowerCase() === token.id.toLowerCase()
          ) {
            pools.map((pool) => {
              if (
                pool.shortToken.id.toLowerCase() ===
                order.takerToken.toLowerCase()
              ) {
                orders.push({
                  id: order.id,
                  underlying: pool.referenceAsset,
                  symbol: pool.shortToken.symbol,
                  type:
                    order.taker === userAddress.toLowerCase() ? 'SELL' : 'BUY',
                  paidReceived: formatUnits(
                    order.makerTokenFilledAmount,
                    token.decimals
                  ),
                  quantity: formatEther(order.takerTokenFilledAmount),
                  price:
                    Number(formatUnits(order.makerTokenFilledAmount)) /
                    Number(formatUnits(order.takerTokenFilledAmount)),
                  timestamp: order.timestamp,
                })
              } else if (
                pool.longToken.id.toLowerCase() ===
                order.takerToken.toLowerCase()
              ) {
                orders.push({
                  id: order.id,
                  underlying: pool.referenceAsset,
                  symbol: pool.longToken.symbol,
                  type:
                    order.taker == userAddress.toLowerCase() ? 'SELL' : 'BUY',
                  paidReceived: formatUnits(
                    order.makerTokenFilledAmount,
                    token.decimals
                  ),
                  quantity: formatEther(order.takerTokenFilledAmount),
                  price:
                    Number(formatUnits(order.makerTokenFilledAmount)) /
                    Number(formatUnits(order.takerTokenFilledAmount)),
                  timestamp: order.timestamp,
                })
              }
            })
          }
        })
      })
    }
    setHistory(orders)
  }, [
    orderFills.isSuccess,
    orderFillsMaker.isSuccess,
    !pools,
    !collateralTokens,
  ])

  const rows: GridRowModel[] =
    history.length != 0
      ? history.reduce((acc, order) => {
          return [
            ...acc,
            {
              id: order.id,
              symbol: order.symbol,
              icon: order.underlying,
              type: order.type,
              Underlying: order.underlying,
              quantity: parseFloat(order.quantity).toFixed(2),
              payReceive: parseFloat(order.paidReceived).toFixed(4),
              price: parseFloat(order.price).toFixed(4),
              timestamp: getDateTime(order.timestamp),
            },
          ]
        }, [])
      : []

  const filteredRows = useMemo(() => {
    if (search != null && search.length > 0) {
      if (buyClicked && sellClicked) {
        return rows
      } else if (buyClicked) {
        return rows
          .filter((v) => v.type.includes('BUY'))
          .filter((v) =>
            v.Underlying.toLowerCase().includes(search.toLowerCase())
          )
      } else if (sellClicked) {
        return rows
          .filter((v) => v.type.includes('SELL'))
          .filter((v) =>
            v.Underlying.toLowerCase().includes(search.toLowerCase())
          )
      } else {
        return rows.filter((v) =>
          v.Underlying.toLowerCase().includes(search.toLowerCase())
        )
      }
    } else if (buyClicked && sellClicked) {
      return rows
    } else if (buyClicked) {
      return rows.filter((v) => v.type.includes('BUY'))
    } else if (sellClicked) {
      return rows.filter((v) => v.type.includes('SELL'))
    } else {
      return rows
    }
  }, [search, buyClicked, sellClicked, rows])

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
          <Box>BTC/USD</Box>
          <Radio
            checked={selectedFilterFromRadio === 'BTC/USD'}
            size="small"
            value="BTC/USD"
            onChange={(e) => setSelectedFilterFromRadio(e.target.value)}
          />
        </Stack>
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>ETH/USD</Box>
          <Radio
            checked={selectedFilterFromRadio === 'ETH/USD'}
            size="small"
            value="ETH/USD"
            onChange={(e) => setSelectedFilterFromRadio(e.target.value)}
          />
        </Stack>
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>GHST/USD</Box>
          <Radio
            checked={selectedFilterFromRadio === 'GHST/USD'}
            size="small"
            value="GHST/USD"
            onChange={(e) => setSelectedFilterFromRadio(e.target.value)}
          />
        </Stack>
        <Stack
          direction="row"
          justifyContent={'space-between'}
          alignItems={'center'}
        >
          <Box>USDT/USD</Box>
          <Radio
            checked={selectedFilterFromRadio === 'USDT/USD'}
            size="small"
            value="USDT/USD"
            onChange={(e) => setSelectedFilterFromRadio(e.target.value)}
          />
        </Stack>
      </Stack>
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
              {!orderFills.isLoading || !orderFillsMaker.isLoading ? (
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
                      <TradeHistoryTabTokenCars row={row} key={i} />
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
                  setBuyClicked(false)
                  setSellClicked(false)
                }}
              />
            </Stack>
          ) : (
            <PoolsTable
              disableRowClick
              page={page}
              rows={filteredRows}
              columns={columns}
              loading={orderFills.isLoading || orderFillsMaker.isLoading}
              onPageChange={(page) => setPage(page)}
              selectedPoolsView="Table"
            />
          )}
        </>
      )}
    </Stack>
  )
}
