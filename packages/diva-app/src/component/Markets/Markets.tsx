import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import PoolsTable, { PayoffCell } from '../PoolsTable'
import { formatUnits } from 'ethers/lib/utils'
import {
  getDateTime,
  getExpiryMinutesFromNow,
  userTimeZone,
} from '../../Util/Dates'
import { Pool } from '../../lib/queries'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { BigNumber } from 'ethers'
import { GrayText } from '../Trade/Orders/UiStyles'
import { useEffect, useMemo, useState } from 'react'
import { CoinIconPair } from '../CoinIcon'
import {
  fetchPools,
  selectPools,
  selectRequestStatus,
} from '../../Redux/appSlice'
import { useAppDispatch, useAppSelector } from '../../Redux/hooks'
import {
  AppBar,
  Box,
  Button,
  Stack,
  Tooltip,
  Toolbar,
  useTheme,
  Checkbox,
  Divider,
  Switch,
} from '@mui/material'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline'
import { DIVA_GOVERNANCE_ADDRESS, WEBSOCKET_URL } from '../../constants'
import Typography from '@mui/material/Typography'
import { ShowChartOutlined } from '@mui/icons-material'
import { ORDER_TYPE } from '../../Models/orderbook'
import { getAppStatus, statusDescription } from '../../Util/getAppStatus'
import {
  createTable,
  getResponse,
  mapOrderData,
} from '../../DataService/OpenOrders'
import { useHistory, useParams } from 'react-router-dom'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import DropDownFilter from '../PoolsTableFilter/DropDownFilter'
import ButtonFilter from '../PoolsTableFilter/ButtonFilter'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import FilterListIcon from '@mui/icons-material/FilterList'
import { FilterDrawerModal } from '../Dashboard/FilterDrawerMobile'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import AccordionDetails from '@mui/material/AccordionDetails'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import { Search } from '@mui/icons-material'
import { getTopNObjectByProperty } from '../../Util/dashboard'
import { useWhitelist } from '../../hooks/useWhitelist'

export const ExpiresInCell = (props: any) => {
  //replaces all occurances of "-" with "/", firefox doesn't support "-" in a date string
  const expTimestamp = new Date(props.row.Expiry.replace(/-/g, '/')).getTime()
  const minUntilExp = getExpiryMinutesFromNow(expTimestamp / 1000)
  if (minUntilExp > 0) {
    if ((minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) > 0) {
      // More than a day
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) +
              'd ' +
              ((minUntilExp % (60 * 24)) - (minUntilExp % 60)) / 60 +
              'h ' +
              (minUntilExp % 60) +
              'm '}
          </span>
        </Tooltip>
      )
    } else if (
      (minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) === 0 &&
      (minUntilExp - (minUntilExp % 60)) / 60 > 0
    ) {
      // Less than a day but more than an hour
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp - (minUntilExp % 60)) / 60 +
              'h ' +
              (minUntilExp % 60) +
              'm '}
          </span>
        </Tooltip>
      )
    } else if ((minUntilExp - (minUntilExp % 60)) / 60 === 0) {
      // Less than an hour
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp % 60) + 'm '}
          </span>
        </Tooltip>
      )
    }
  } else if (Object.is(0, minUntilExp)) {
    // Using Object.is() to differentiate between +0 and -0
    return (
      <Tooltip
        placement="top-end"
        title={props.row.Expiry + ', ' + userTimeZone()}
      >
        <span className="table-cell-trucate">{'<1m'}</span>
      </Tooltip>
    )
  } else {
    return (
      <Tooltip
        placement="top-end"
        title={props.row.Expiry + ', ' + userTimeZone()}
      >
        <span className="table-cell-trucate">{'-'}</span>
      </Tooltip>
    )
  }
}

const columns: GridColDef[] = [
  {
    field: 'Id',
    align: 'left',
    renderHeader: (header) => <GrayText>{'Asset Id'}</GrayText>,
    renderCell: (cell) => <GrayText>{cell.value}</GrayText>,
  },
  {
    field: 'Icon',
    align: 'right',
    disableReorder: true,
    disableColumnMenu: true,
    headerName: '',
    width: 70,
    renderCell: (cell) => <CoinIconPair assetName={cell.value} />,
  },
  {
    field: 'Underlying',
    minWidth: 150,
    flex: 1,
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
  { field: 'Cap', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Inflection', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Gradient', align: 'right', headerAlign: 'right', type: 'number' },
  {
    field: 'Expiry',
    minWidth: 170,
    align: 'right',
    headerAlign: 'right',
    type: 'dateTime',
    headerName: 'Expires in',
    renderCell: (props) => <ExpiresInCell {...props} />,
  },
  {
    field: 'Sell',
    align: 'right',
    headerAlign: 'right',
    headerName: 'Sell',
    renderCell: (cell) => (
      <Typography color="#66ffa6" fontSize={'0.875rem'}>
        {cell.value}
      </Typography>
    ),
  },
  {
    field: 'Buy',
    align: 'right',
    headerAlign: 'right',
    headerName: 'Buy',
    renderCell: (cell) => (
      <Typography color="#ff5c8d" fontSize={'0.875rem'}>
        {cell.value}
      </Typography>
    ),
  },
  {
    field: 'MaxYield',
    align: 'right',
    headerAlign: 'right',
    headerName: 'MaxYield',
    renderCell: (cell) => (
      <Typography color="#3393e0" fontSize={'0.875rem'}>
        {cell.value.buy}
      </Typography>
    ),
  },
  {
    field: 'Status',
    align: 'right',
    headerAlign: 'right',
    renderCell: (cell: any) => {
      return (
        <Tooltip placement="top-end" title={statusDescription[cell.value]}>
          <span className="table-cell-trucate">{cell.value}</span>
        </Tooltip>
      )
    },
  },
  {
    field: 'TVL',
    align: 'right',
    headerAlign: 'right',
    minWidth: 200,
  },
]

const MobileFilterOptions = ({
  setSearch,
  expiredPoolClicked,
  setExpiredPoolClicked,
  rows,
  checkedState,
  setCheckedState,
  searchInput,
  setSearchInput,
  createdBy,
  setCreatedBy,
  handleCreatorInput,
  handleSellPriceFilter,
  sellPriceFilter,
  handleBuyPriceFilter,
  buyPriceFilter,
  idInput,
  handleIdFilterChange,
  handleWhitelistFilter,
  whitelistFilter,
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
    <Box
      sx={{
        overflowY: 'scroll',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
      }}
    >
      <Accordion
        sx={{
          backgroundColor: '#000000',
          '&:before': {
            display: 'none',
          },
          marginTop: theme.spacing(3.5),
          marginBottom: theme.spacing(1),
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
            Asset Id
          </Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            backgroundColor: '#000000',
            padding: 0,
          }}
        >
          <Box>
            <TextField
              value={idInput}
              aria-label="Filter creator"
              sx={{
                width: '100%',
                height: theme.spacing(6.25),
                marginTop: theme.spacing(2),
              }}
              onChange={handleIdFilterChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="secondary" />
                  </InputAdornment>
                ),
              }}
              placeholder="Enter Asset Id"
              color="secondary"
            />
          </Box>
        </AccordionDetails>
      </Accordion>
      <Divider />
      <Accordion
        sx={{
          backgroundColor: '#000000',
          '&:before': {
            display: 'none',
          },
          marginTop: theme.spacing(3.5),
          marginBottom: theme.spacing(1),
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
            Creator
          </Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            backgroundColor: '#000000',
            padding: 0,
          }}
        >
          <Box>
            <TextField
              value={createdBy}
              aria-label="Filter creator"
              sx={{
                width: '100%',
                height: theme.spacing(6.25),
                marginTop: theme.spacing(2),
              }}
              onChange={handleCreatorInput}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="secondary" />
                  </InputAdornment>
                ),
              }}
              placeholder="Enter Creator"
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
            <Stack
              direction="row"
              justifyContent={'space-between'}
              alignItems={'center'}
            >
              <Box>Diva Governance</Box>
              <Checkbox
                checked={createdBy === DIVA_GOVERNANCE_ADDRESS}
                id={`checkbox-diva-governance`}
                onChange={() => {
                  if (createdBy === DIVA_GOVERNANCE_ADDRESS) {
                    setCreatedBy('')
                  } else {
                    setCreatedBy(DIVA_GOVERNANCE_ADDRESS)
                  }
                }}
              />
            </Stack>
          </Stack>
        </AccordionDetails>
      </Accordion>
      <Divider />
      <Accordion
        sx={{
          backgroundColor: '#000000',
          '&:before': {
            display: 'none',
          },
          marginY: theme.spacing(1),
        }}
      >
        <AccordionSummary
          aria-controls="panel1a-content"
          id="panel1a-header"
          sx={{
            padding: 0,
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
            padding: 0,
          }}
        >
          <Box>
            <TextField
              value={searchInput}
              aria-label="Filter creator"
              sx={{
                width: '100%',
                height: theme.spacing(6.25),
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
          <Box>Whitelisted Oracle</Box>
          <Switch checked={whitelistFilter} onChange={handleWhitelistFilter} />
        </Stack>
      </Stack>
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
          <Box>Hide Expired Pools</Box>
          <Switch
            checked={expiredPoolClicked}
            onChange={() => setExpiredPoolClicked(!expiredPoolClicked)}
          />
        </Stack>
      </Stack>
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
          <Box>Has Buy Price</Box>
          <Switch checked={buyPriceFilter} onChange={handleBuyPriceFilter} />
        </Stack>
      </Stack>
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
          <Box>Has Sell Price</Box>
          <Switch checked={sellPriceFilter} onChange={handleSellPriceFilter} />
        </Stack>
      </Stack>
    </Box>
  )
}

export default function Markets() {
  const history = useHistory()
  const theme = useTheme()
  const { isMobile } = useCustomMediaQuery()
  const currentAddress = history.location.pathname.split('/')
  const [page, setPage] = useState(0)
  const pools = useAppSelector(selectPools)
  const [tablePools, setTablePools] = useState<Pool[]>(pools)
  const poolsRequestStatus = useAppSelector(selectRequestStatus('app/pools'))
  const dispatch = useAppDispatch()
  const params = useParams() as { creatorAddress: string; status: string }
  const [createdBy, setCreatedBy] = useState(params.creatorAddress)
  const [creatorButtonLabel, setCreatorButtonLabel] = useState(
    getShortenedAddress(currentAddress[2])
  )
  const [underlyingButtonLabel, setUnderlyingButtonLabel] =
    useState('Underlying')
  const [search, setSearch] = useState(null)
  const [expiredPoolClicked, setExpiredPoolClicked] = useState(false)
  const [selectedPoolsView, setSelectedPoolsView] = useState<'Grid' | 'Table'>(
    'Table'
  )
  const [websocketClient, setWebsocketClient] = useState(
    new WebSocket(WEBSOCKET_URL)
  )
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false)
  const [searchInput, setSearchInput] = useState<string>('')
  const [checkedState, setCheckedState] = useState(new Array(4).fill(false))
  const [mobileCreatorFilter, setMobileCreatorFilter] = useState<string>('')
  const [idFilter, setIdFilter] = useState('')
  const [whitelistFilter, setWhitelistFilter] = useState(false)
  const [hasBuyPriceFilter, setHasBuyPriceFilter] = useState(false)
  const [hasSellPriceFilter, setHasSellPriceFilter] = useState(false)
  const whitelist = useWhitelist()
  const handleSellPriceFilter = () => {
    setHasSellPriceFilter(!hasSellPriceFilter)
  }
  const handleBuyPriceFilter = () => {
    setHasBuyPriceFilter(!hasBuyPriceFilter)
  }
  const handleWhitelistFilter = () => {
    setWhitelistFilter(!whitelistFilter)
  }

  const handleIdFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIdFilter(event.target.value)
  }

  const handleCreatorInput = (e: any) => {
    setCreatedBy(e.target.value)
    setCreatorButtonLabel(
      e.target.value === '' ? 'Creator' : getShortenedAddress(e.target.value)
    )
  }

  const handleUnderLyingInput = (e) => {
    setSearch(e.target.value)
    setUnderlyingButtonLabel(
      e.target.value === '' ? 'Underlying' : e.target.value
    )
  }

  const handleExpiredPools = () => {
    if (expiredPoolClicked) {
      setExpiredPoolClicked(false)
    } else {
      setExpiredPoolClicked(true)
    }
  }

  // orders structure
  // - orders.poolId = poolId
  // - orders.first = baseToken is makerToken and quoteToken is takerToken
  // - orders.second = baseToken is takerToken and quoteToken is makerToken

  // rSell and rBuy structure
  // - rSell: baseToken is collateralToken and quoteToken is tokenAddress
  // - rBuy: baseToken is tokenAddress and quoteToken is collateralToken

  const getMakerTakerTokens = (orders: any) => {
    const tokens: string[] = []

    // Get makerToken and takerToken of orders
    orders.first.bids.records.map((bid: any) => {
      if (tokens.indexOf(bid.order.makerToken) === -1) {
        tokens.push(bid.order.makerToken)
      }
      if (tokens.indexOf(bid.order.takerToken) === -1) {
        tokens.push(bid.order.takerToken)
      }
    })

    orders.second.bids.records.map((bid: any) => {
      if (tokens.indexOf(bid.order.makerToken) === -1) {
        tokens.push(bid.order.makerToken)
      }
      if (tokens.indexOf(bid.order.takerToken) === -1) {
        tokens.push(bid.order.takerToken)
      }
    })

    return tokens
  }

  const getUpdatedRows = (ordersArray: any[]) => {
    const updatedTablePools = tablePools.map((tablePool) => {
      const orders = ordersArray.filter((item) => item.poolId === tablePool.id)

      if (orders.length === 0) {
        return tablePool
      } else {
        let updatePool = tablePool
        const orderPrices = []
        const checkOrders = orders[0]

        // Get all maker and taker token ids of order data
        const tokens = getMakerTakerTokens(checkOrders)

        // Check pool type
        const poolType =
          tokens.indexOf(tablePool.shortToken.id) !== -1 ? 'S' : 'L'

        // Check the token address of table row
        const tokenAddress =
          poolType === 'S' ? tablePool.shortToken.id : tablePool.longToken.id

        // Get first records and second records
        const firstRecords = checkOrders.first.bids.records
        const secondRecords = checkOrders.second.bids.records

        // Get updated pool's buy and sell data
        const { responseBuy, responseSell } = getResponse(
          tokenAddress,
          firstRecords,
          secondRecords
        )

        // Get updated orderbook buy data
        const orderBookBuy = mapOrderData(
          responseBuy,
          tablePool.collateralToken.decimals,
          ORDER_TYPE.BUY
        )
        orderPrices.push(orderBookBuy)

        // Get updated orderbook buy data
        const orderBookSell = mapOrderData(
          responseSell,
          tablePool.collateralToken.decimals,
          ORDER_TYPE.SELL
        )
        orderPrices.push(orderBookSell)

        // Calculate table row data with updated information
        const completeOrderBook = createTable(
          orderPrices[ORDER_TYPE.BUY],
          orderPrices[ORDER_TYPE.SELL]
        )

        if (completeOrderBook.length !== 0) {
          if (poolType === 'L') {
            // Update the pool's long price information with the updated information
            updatePool = {
              ...tablePool,
              prices: {
                ...tablePool.prices,
                long: {
                  ask: completeOrderBook[0].ask,
                  askExpiry: completeOrderBook[0].sellExpiry,
                  askQuantity: completeOrderBook[0].sellQuantity,
                  bid: completeOrderBook[0].bid,
                  bidExpiry: completeOrderBook[0].buyExpiry,
                  bidQuantity: completeOrderBook[0].buyQuantity,
                  orderType: poolType,
                  poolId: poolType + tablePool.id,
                },
              },
            }
          } else {
            // Update the pool's short price information with the updated information
            updatePool = {
              ...tablePool,
              prices: {
                ...tablePool.prices,
                short: {
                  ask: completeOrderBook[0].ask,
                  askExpiry: completeOrderBook[0].sellExpiry,
                  askQuantity: completeOrderBook[0].sellQuantity,
                  bid: completeOrderBook[0].bid,
                  bidExpiry: completeOrderBook[0].buyExpiry,
                  bidQuantity: completeOrderBook[0].buyQuantity,
                  orderType: poolType,
                  poolId: poolType + tablePool.id,
                },
              },
            }
          }
        }

        return updatePool
      }
    })

    setTablePools(updatedTablePools)
  }

  useEffect(() => {
    if (websocketClient !== undefined) {
      setTablePools(pools)
      // Connect to server using websocket
      setTablePools(pools)
      websocketClient.onopen = () => {
        console.log('WebSocket Connected')
      }

      // Receive data using websocket
      websocketClient.onmessage = (e) => {
        const message = JSON.parse(e.data)
        getUpdatedRows(message)
      }

      return () => {
        websocketClient.onclose = () => {
          console.log('WebSocket Disconnected')
          setWebsocketClient(new WebSocket(WEBSOCKET_URL))
        }
      }
    }
  }, [
    websocketClient.onmessage,
    websocketClient.onopen,
    websocketClient.onclose,
    pools,
  ])

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(fetchPools({ page, createdBy }))
    }, 300)

    return () => clearTimeout(timeout)
  }, [createdBy, dispatch, history, page])

  useEffect(() => {
    const timeout = setTimeout(() => {
      history.replace(`/markets/${createdBy || ''}`)
    }, 100)

    return () => clearTimeout(timeout)
  }, [createdBy, history])

  const rows: GridRowModel[] = tablePools.reduce((acc, val) => {
    const { status } = getAppStatus(
      val.expiryTime,
      val.statusTimestamp,
      val.statusFinalReferenceValue,
      val.finalReferenceValue,
      val.inflection,
      parseFloat(val.submissionPeriod),
      parseFloat(val.challengePeriod),
      parseFloat(val.reviewPeriod),
      parseFloat(val.fallbackSubmissionPeriod)
    )

    const shared = {
      Icon: val.referenceAsset,
      Underlying: val.referenceAsset,
      Floor: formatUnits(val.floor),
      Inflection: formatUnits(val.inflection),
      Cap: formatUnits(val.cap),
      Gradient: formatUnits(val.gradient, val.collateralToken.decimals),
      Expiry: getDateTime(val.expiryTime),
      Sell: '-',
      Buy: '-',
      MaxYield: {
        buy: '-',
        sell: '-',
      },
      dataProvider: val.dataProvider,
    }

    const payOff = {
      Gradient: Number(formatUnits(val.gradient, val.collateralToken.decimals)),
      Floor: Number(formatUnits(val.floor)),
      Inflection: Number(formatUnits(val.inflection)),
      Cap: Number(formatUnits(val.cap)),
    }

    return [
      ...acc,
      {
        ...shared,
        id: `${val.id}/long`,
        Id: 'L' + val.id,
        address: val.longToken,
        PayoffProfile: generatePayoffChartData({
          ...payOff,
          IsLong: true,
        }),
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalance),
              val.collateralToken.decimals
            )
          ).toFixed(2) +
          ' ' +
          val.collateralToken.symbol,
        Status: status,
        finalValue:
          val.statusFinalReferenceValue === 'Open'
            ? '-'
            : formatUnits(val.finalReferenceValue),
        Sell:
          val.prices?.long !== undefined &&
          Number(val.prices.long.bid).toFixed(2) !== '0.00'
            ? Number(val.prices.long.bid).toFixed(2)
            : '-',
        Buy:
          val.prices?.long !== undefined &&
          Number(val.prices.long.ask).toFixed(2) !== '0.00'
            ? Number(val.prices.long.ask).toFixed(2)
            : '-',
        MaxYield: {
          buy:
            val.prices?.long !== undefined && val.prices.long.ask !== ''
              ? Number(1 / Number(val.prices.long.ask)).toFixed(2) + 'x'
              : '-',
          sell:
            val.prices?.long !== undefined && val.prices.long.bid !== ''
              ? Number(1 / Number(val.prices.long.bid)).toFixed(2) + 'x'
              : '-',
        },
      },
      {
        ...shared,
        id: `${val.id}/short`,
        Id: 'S' + val.id,
        address: val.shortToken,
        PayoffProfile: generatePayoffChartData({
          ...payOff,
          IsLong: false,
        }),
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalance),
              val.collateralToken.decimals
            )
          ).toFixed(2) +
          ' ' +
          val.collateralToken.symbol,
        Status: status,
        finalValue:
          val.statusFinalReferenceValue === 'Open'
            ? '-'
            : formatUnits(val.finalReferenceValue),
        Sell:
          val.prices?.short !== undefined &&
          Number(val.prices.short.bid).toFixed(2) !== '0.00'
            ? Number(val.prices.short.bid).toFixed(2)
            : '-',
        Buy:
          val.prices?.short !== undefined &&
          Number(val.prices.short.ask).toFixed(2) !== '0.00'
            ? Number(val.prices.short.ask).toFixed(2)
            : '-',
        MaxYield: {
          buy:
            val.prices?.short !== undefined && val.prices.short.ask !== ''
              ? Number(1 / Number(val.prices.short.ask)).toFixed(2) + 'x'
              : '-',
          sell:
            val.prices?.short !== undefined && val.prices.short.bid !== ''
              ? Number(1 / Number(val.prices.short.bid)).toFixed(2) + 'x'
              : '-',
        },
      },
    ]
  }, [] as GridRowModel[])

  // set card view on mobile devices
  useEffect(() => {
    if (isMobile) {
      setSelectedPoolsView('Grid')
    }
  }, [isMobile])
  const filteredRows = whitelistFilter
    ? rows.filter((row) =>
        whitelist.dataProviders.map((dp) => dp.id).includes(row.dataProvider)
      )
    : hasBuyPriceFilter
    ? rows.filter((row) =>
        hasSellPriceFilter
          ? row.Sell !== '-' && row.Buy !== '-'
          : row.Buy !== '-'
      )
    : hasSellPriceFilter
    ? rows.filter((row) =>
        hasBuyPriceFilter
          ? row.Sell !== '-' && row.Buy !== '-'
          : row.Sell !== '-'
      )
    : idFilter !== ''
    ? rows.filter((row) => row.Id.includes(idFilter))
    : search != null && search.length > 0
    ? expiredPoolClicked
      ? rows
          .filter((v) => v.Status.includes('Open'))
          .filter(
            (v) =>
              v.Underlying.toLowerCase().includes(search.toLowerCase()) ||
              search.toLowerCase().includes(v.Underlying.toLowerCase())
          )
      : rows.filter(
          (v) =>
            v.Underlying.toLowerCase().includes(search.toLowerCase()) ||
            search.toLowerCase().includes(v.Underlying.toLowerCase())
        )
    : expiredPoolClicked
    ? rows.filter((v) => v.Status.includes('Open'))
    : rows

  useEffect(() => {
    if (searchInput.length > 0 && searchInput !== null) {
      setCheckedState(new Array(4).fill(false))
      setSearch(searchInput)
    }
  }, [searchInput])

  return (
    <>
      <Box
        paddingRight={isMobile ? 0 : theme.spacing(2)}
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          fontSize: isMobile ? '14px' : '24px',
        }}
      >
        <ShowChartOutlined
          style={{
            fontSize: isMobile ? 24 : 34,
            padding: 20,
            paddingRight: 10,
          }}
        />
        <h2> Markets</h2>
      </Box>
      <Stack
        direction="column"
        sx={{
          height: '100%',
        }}
        spacing={4}
      >
        {!isMobile && (
          <AppBar
            position="static"
            sx={{
              background: theme.palette.background.default,
              justifyContent: 'space-between',
              boxShadow: 'none',
            }}
          >
            <Toolbar>
              <Box
                paddingX={3}
                paddingY={2}
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                }}
                justifyContent="space-between"
              >
                <DropDownFilter
                  id="Asset Id"
                  DropDownButtonLabel={'Asset Id'}
                  InputValue={idFilter}
                  onInputChange={handleIdFilterChange}
                />
                <DropDownFilter
                  id="Creator Filter"
                  DropDownButtonLabel={
                    history.location.pathname === `/markets/`
                      ? 'Creator'
                      : creatorButtonLabel
                  }
                  InputValue={createdBy}
                  onInputChange={handleCreatorInput}
                  MenuItemLabel="Diva Governance"
                  onMenuItemClick={() => {
                    setCreatedBy(DIVA_GOVERNANCE_ADDRESS)
                    setCreatorButtonLabel(
                      getShortenedAddress(DIVA_GOVERNANCE_ADDRESS)
                    )
                  }}
                />
                <DropDownFilter
                  id="Underlying Filter"
                  DropDownButtonLabel={underlyingButtonLabel}
                  InputValue={search}
                  onInputChange={handleUnderLyingInput}
                />
                <ButtonFilter
                  id="Whitelisted Oracle"
                  ButtonLabel="Whitelisted Oracle"
                  onClick={handleWhitelistFilter}
                  sx={{ marginRight: theme.spacing(2) }}
                />
                <ButtonFilter
                  id="Hide expired pools"
                  ButtonLabel="Hide Expired"
                  onClick={handleExpiredPools}
                  sx={{ marginRight: theme.spacing(2) }}
                />
                <Stack direction={'row'}>
                  <ButtonFilter
                    id="Has Buy Price"
                    ButtonLabel="Has Buy Price"
                    onClick={handleBuyPriceFilter}
                    sx={{
                      borderRight: 0,
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0,
                    }}
                  />
                  <Divider orientation="vertical" />
                  <ButtonFilter
                    id="Has Sell Price"
                    ButtonLabel="Has Sell Price"
                    onClick={handleSellPriceFilter}
                    sx={{
                      borderLeft: 0,
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                    }}
                  />
                </Stack>
              </Box>
              <Box
                sx={{
                  marginLeft: 'auto',
                }}
              >
                <Button
                  onClick={() => setSelectedPoolsView('Table')}
                  color={selectedPoolsView === 'Table' ? 'primary' : 'inherit'}
                >
                  <ViewHeadlineIcon />
                </Button>
                <Button
                  onClick={() => setSelectedPoolsView('Grid')}
                  color={selectedPoolsView === 'Grid' ? 'primary' : 'inherit'}
                >
                  <ViewModuleIcon />
                </Button>
              </Box>
            </Toolbar>
          </AppBar>
        )}
        {isMobile && (
          <Stack
            width={'100%'}
            sx={{
              marginTop: theme.spacing(1),
              marginLeft: theme.spacing(2),
            }}
            spacing={2}
          >
            <Button
              onClick={() => {
                setIsFilterDrawerOpen(!isFilterDrawerOpen)
              }}
              startIcon={<FilterListIcon fontSize="small" />}
              variant="outlined"
              sx={{
                width: theme.spacing(10.5),
                height: theme.spacing(3.75),
                fontSize: '13px',
                paddingY: theme.spacing(0.5),
                paddingX: theme.spacing(1.25),
                textTransform: 'none',
              }}
              color={isFilterDrawerOpen ? 'primary' : 'secondary'}
            >
              Filters
            </Button>
            <FilterDrawerModal
              open={isFilterDrawerOpen}
              onClose={setIsFilterDrawerOpen}
              children={
                <MobileFilterOptions
                  setSearch={setSearch}
                  expiredPoolClicked={expiredPoolClicked}
                  setExpiredPoolClicked={setExpiredPoolClicked}
                  rows={rows}
                  checkedState={checkedState}
                  setCheckedState={setCheckedState}
                  searchInput={searchInput}
                  setSearchInput={setSearchInput}
                  createdBy={createdBy}
                  setCreatedBy={setCreatedBy}
                  handleCreatorInput={handleCreatorInput}
                  handleBuyPriceFilter={handleBuyPriceFilter}
                  buyPriceFilter={hasBuyPriceFilter}
                  handleSellPriceFilter={handleSellPriceFilter}
                  sellPriceFilter={hasSellPriceFilter}
                  handleWhitelistFilter={handleWhitelistFilter}
                  handleIdFilterChange={handleIdFilterChange}
                  idInput={idFilter}
                  whitelistFilter={whitelistFilter}
                />
              }
              onApplyFilter={() => {
                setIsFilterDrawerOpen(false)
              }}
              onClearFilter={() => {
                setSearch('')
                setCreatedBy(DIVA_GOVERNANCE_ADDRESS)
                setExpiredPoolClicked(false)
                setSearchInput('')
                setCheckedState(new Array(4).fill(false))
                setIdFilter('')
                setWhitelistFilter(false)
                setHasBuyPriceFilter(false)
                setHasSellPriceFilter(false)
              }}
            />
          </Stack>
        )}
        <Box
          paddingX={6}
          sx={{
            height: 'calc(100% - 6em)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <PoolsTable
            columns={columns}
            rows={filteredRows}
            rowCount={8000}
            page={page}
            loading={poolsRequestStatus === 'pending'}
            onPageChange={(page) => setPage(page)}
            selectedPoolsView={selectedPoolsView}
          />
        </Box>
      </Stack>
    </>
  )
}
