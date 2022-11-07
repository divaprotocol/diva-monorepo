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
  selectUserAddress,
} from '../../Redux/appSlice'
import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import { useWhitelist } from '../../hooks/useWhitelist'
import { useEffect, useMemo, useState } from 'react'
import { formatUnits } from 'ethers/lib/utils'
import Typography from '@mui/material/Typography'
import { GrayText, GreenText, RedText } from '../Trade/Orders/UiStyles'
import { CoinIconPair } from '../CoinIcon'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Checkbox,
  CircularProgress,
  Grid,
  InputAdornment,
  Pagination,
  Radio,
  TextField,
} from '@mui/material'
import PoolsTable from '../PoolsTable'
import { getDateTime } from '../../Util/Dates'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import { Box, Divider, Stack } from '@mui/material'
import DropDownFilter from '../PoolsTableFilter/DropDownFilter'
import ButtonFilter from '../PoolsTableFilter/ButtonFilter'
import FilterListIcon from '@mui/icons-material/FilterList'
import { FilterDrawerModal } from './FilterDrawerMobile'
import { Search } from '@mui/icons-material'
import { getTopNObjectByProperty } from '../../Util/dashboard'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import useTheme from '@mui/material/styles/useTheme'

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
          {DATA_ARRAY.map(({ label, value }, index) => (
            <Grid item key={index} xs={5}>
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

const MobileFilterOptions = ({
  rows,
  checkedState,
  setCheckedState,
  setSearch,
  searchInput,
  setSearchInput,
  buyClicked,
  setBuyClicked,
  sellClicked,
  setSellClicked,
}) => {
  const theme = useTheme()

  const top4UnderlyingTokens = useMemo(
    () => getTopNObjectByProperty(rows, 'Underlying', 4),
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
          marginTop: theme.spacing(3.5),
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
              sx={{
                width: '100%',
                height: '50px',
                marginTop: theme.spacing(2),
              }}
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
              marginTop: theme.spacing(2),
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
          paddingTop: theme.spacing(2.5),
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

export function TradeHistoryTab() {
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector((state) => state.appSlice.chainId)
  const pools = useAppSelector((state) => selectPools(state))
  const { collateralTokens } = useWhitelist()
  const [underlyingButtonLabel, setUnderlyingButtonLabel] =
    useState('Underlying')
  const [search, setSearch] = useState('')
  const [history, setHistory] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const [buyClicked, setBuyClicked] = useState(false)
  const [sellClicked, setSellClicked] = useState(false)
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [checkedState, setCheckedState] = useState(new Array(4).fill(false))
  const [searchInput, setSearchInput] = useState('')

  const orders: any[] = []
  const dispatch = useAppDispatch()
  const { isMobile } = useCustomMediaQuery()
  const theme = useTheme()

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
                  quantity: formatUnits(
                    order.makerTokenFilledAmount,
                    token.decimals
                  ),
                  price:
                    Number(
                      formatUnits(order.takerTokenFilledAmount, token.decimals)
                    ) /
                    Number(
                      formatUnits(order.makerTokenFilledAmount, token.decimals)
                    ),
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
                  quantity: formatUnits(
                    order.makerTokenFilledAmount,
                    token.decimals
                  ),
                  price:
                    Number(
                      formatUnits(order.takerTokenFilledAmount, token.decimals)
                    ) /
                    Number(
                      formatUnits(order.makerTokenFilledAmount, token.decimals)
                    ),
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
                  quantity: formatUnits(order.takerTokenFilledAmount, token.decimals),
                  price:
                    Number(formatUnits(order.makerTokenFilledAmount, token.decimals)) /
                    Number(formatUnits(order.takerTokenFilledAmount, token.decimals)),
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
                  quantity: formatUnits(order.takerTokenFilledAmount, token.decimals),
                  price:
                    Number(formatUnits(order.makerTokenFilledAmount, token.decimals)) /
                    Number(formatUnits(order.takerTokenFilledAmount, token.decimals)),
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
          .filter(
            (v) =>
              v.Underlying.toLowerCase().includes(search.toLowerCase()) ||
              search.toLowerCase().includes(v.Underlying.toLowerCase())
          )
      } else if (sellClicked) {
        return rows
          .filter((v) => v.type.includes('SELL'))
          .filter(
            (v) =>
              v.Underlying.toLowerCase().includes(search.toLowerCase()) ||
              search.toLowerCase().includes(v.Underlying.toLowerCase())
          )
      } else {
        return rows.filter(
          (v) =>
            v.Underlying.toLowerCase().includes(search.toLowerCase()) ||
            search.toLowerCase().includes(v.Underlying.toLowerCase())
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
                marginTop: theme.spacing(2),
                marginBottom: theme.spacing(2),
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
                    {filteredRows.map((row, index) => (
                      <TradeHistoryTabTokenCars row={row} key={index} />
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
                    rows={rows}
                    checkedState={checkedState}
                    setCheckedState={setCheckedState}
                    setSearch={setSearch}
                    searchInput={searchInput}
                    setSearchInput={setSearchInput}
                    buyClicked={buyClicked}
                    setBuyClicked={setBuyClicked}
                    sellClicked={sellClicked}
                    setSellClicked={setSellClicked}
                  />
                }
                onApplyFilter={() => {
                  setIsFilterDrawerOpen(false)
                }}
                onClearFilter={() => {
                  setSearch('')
                  setBuyClicked(false)
                  setSellClicked(false)
                  setSearchInput('')
                  setCheckedState(new Array(4).fill(false))
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
