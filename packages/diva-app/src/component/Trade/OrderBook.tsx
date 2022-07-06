import React from 'react'
import 'styled-components'
import styled from 'styled-components'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { useState, useEffect } from 'react'
import { useAppSelector } from '../../Redux/hooks'
import { get0xOpenOrders } from '../../DataService/OpenOrders'
import { getExpiryMinutesFromNow } from '../../Util/Dates'
import { Pool } from '../../lib/queries'
import { formatUnits } from 'ethers/lib/utils'
import { selectChainId } from '../../Redux/appSlice'
import { config } from '../../constants'
import { BigNumber, ethers } from 'ethers'
import BalanceCheckerABI from '../../abi/BalanceCheckerABI.json'
import { useConnectionContext } from '../../hooks/useConnectionContext'

const PageDiv = styled.div`
  width: 100%;
`
function descendingComparator(a: [], b: [], orderBy: any) {
  let comparator = 0
  if (b[orderBy] < a[orderBy]) {
    comparator = -1
  }
  if (b[orderBy] > a[orderBy]) {
    comparator = 1
  }
  return comparator
}

function getComparator(
  order: string,
  orderBy: string
): (a: string, b: string) => number {
  if (order === 'ascOrder') {
    return (a: any, b: any) => -descendingComparator(a, b, orderBy)
  }
  if (order === 'desOrder') {
    return (a: any, b: any): number => descendingComparator(a, b, orderBy)
  }
  //this step will never reached however need it to silent typescript
  return (a: any, b: any): number => descendingComparator(a, b, orderBy)
}

function stableSort(array: any, comparator: (a: string, b: string) => number) {
  const stabilizedThis: any = array.map((el: any, index: number) => [el, index])
  stabilizedThis.sort((a: any, b: any) => {
    const order = comparator(a[0], b[0])
    if (order !== 0) {
      return order
    }
    return a[1] - b[1]
  })
  return stabilizedThis.map((el: any) => el[0])
}

/**
 * gets only oders that can be filled and where makers
 * have sufficient allowances
 */
async function getFillableOrders(
  orders,
  chainId,
  provider,
  tokenAddress,
  exchangeProxy
) {
  // Connect to BalanceChecker contract which implements a function (called allowances)
  // to obtain multiple allowances with one single call
  const contract = new ethers.Contract(
    config[chainId].balanceCheckAddress,
    BalanceCheckerABI,
    provider
  )

  console.log('orders[0] ' + JSON.stringify(orders[0]))
  // takerAmount: 100000000000000000 // 0.1 positionTokens
  // makerAmount: 80000000000000000000 // 80 dUSD
  // -> price: 800 dUSD / position token
  // remainingFillableTakerAmount: 1
  // -> remainigFillableMakerAmount = 800
  // makerToken allowance: 30 instead of 800
  console.log('orders[1] ' + JSON.stringify(orders[1]))

  // Get all maker addresses from orders array
  const makers: string[] = orders.map((data) => {
    return data.order.maker
  })
  // TODO: Filter out duplicates to reduce the size of the array and the number of allowances calls
  const addresses = Array.from({ length: makers.length }).fill(exchangeProxy)

  // Prepare token address input for allowances function (array of same length as maker addresses array
  // populated with the position token address)
  const tokens = Array.from({ length: makers.length }).fill(tokenAddress)
  //console.log('tokens ' + JSON.stringify(tokens))

  // TODO: query in batches of max 400
  // Get allowances
  const res = await contract.allowances(makers, addresses, tokens)

  const makerAllowances: {
    [address: string]: string
  } = {}

  makers.forEach((maker, index) => {
    if (makerAllowances[maker] != null) {
      makerAllowances[maker] = res[index].toString()
    }
  })

  const filteredOrders = []

  orders.forEach((order) => {
    const remainingMakerAllowance = BigNumber.from(makerAllowances[order.maker])
    order.metaData.remainingMakerAllowance = remainingMakerAllowance
    // makerAmount * remainingFillableTakerAmount / takerAmount = Remaining fillable maker amount
    const makerAmount = BigNumber.from(order.makerAmount)
    if (makerAmount.lte(remainingMakerAllowance)) {
      filteredOrders.push(order)
    }

    makerAllowances[order.maker] = remainingMakerAllowance
      .sub(makerAmount)
      .toString()
  })

  return filteredOrders
}

function mapOrderData(
  records: [],
  option: Pool,
  optionTokenAddress: string,
  sortOrder: string
) {
  let orderBy: string
  let sortedRecords: any = []
  const orderbookTemp: any = records.map((record: any) => {
    const order = record.order

    const metaData = record.metaData
    const makerToken = order.makerToken
    const takerToken = order.takerToken
    const collateralToken = option.collateralToken.id.toLowerCase()
    const tokenAddress = optionTokenAddress.toLowerCase()
    const orders: any = {}
    // Buy Limit
    if (makerToken === collateralToken && takerToken === tokenAddress) {
      const takerAmount = formatUnits(order.takerAmount)
      const makerAmount = formatUnits(
        order.makerAmount.toString(),
        option.collateralToken.decimals
      )
      const remainingTakerAmount = formatUnits(
        metaData.remainingFillableTakerAmount
      )
      orders.expiry = getExpiryMinutesFromNow(order.expiry)
      orders.orderType = 'buy'
      orders.id = 'buy' + records.indexOf(record as never)
      const bidAmount = Number(makerAmount) / Number(takerAmount)
      orders.bid = bidAmount
      if (Number(remainingTakerAmount) < Number(takerAmount)) {
        const nbrOptions = Number(remainingTakerAmount)
        orders.nbrOptions = nbrOptions
      } else {
        const nbrOptions = Number(takerAmount)
        orders.nbrOptions = nbrOptions
      }
    }
    // Sell Limit
    if (makerToken === tokenAddress && takerToken === collateralToken) {
      const takerAmount = formatUnits(
        order.takerAmount,
        option.collateralToken.decimals
      )
      const remainingTakerAmount = formatUnits(
        metaData.remainingFillableTakerAmount,
        option.collateralToken.decimals
      )
      const makerAmount = formatUnits(order.makerAmount)
      orders.expiry = getExpiryMinutesFromNow(order.expiry)
      orders.orderType = 'sell'
      orders.id = 'sell' + records.indexOf(record as never)
      const askAmount = Number(takerAmount) / Number(makerAmount)
      orders.ask = askAmount
      if (remainingTakerAmount == makerAmount) {
        orders.nbrOptions = Number(makerAmount)
      } else {
        const quantity = Number(remainingTakerAmount) / askAmount // TODO
        orders.nbrOptions = quantity
      }
    }

    return orders
  })

  // Filter out orders with quantity = 0 (may happen if maker has revoked the approval)
  const orderbook = orderbookTemp.filter((object) => {
    return object.nbrOptions !== 0
  })

  if (sortOrder === 'ascOrder') {
    orderBy = 'ask'
    const comparator = getComparator(sortOrder, orderBy)
    sortedRecords = stableSort(orderbook, comparator)
  }
  if (sortOrder === 'desOrder') {
    orderBy = 'bid'
    sortedRecords = stableSort(orderbook, getComparator(sortOrder, orderBy))
  }

  return sortedRecords
}

function getTableLength(buyOrdersCount: number, sellOrdersCount: number) {
  if (buyOrdersCount === 0 && sellOrdersCount === 0) {
    return 0
  }
  if (buyOrdersCount === 0) {
    return sellOrdersCount
  }
  if (sellOrdersCount === 0) {
    return buyOrdersCount
  }
  if (buyOrdersCount > 0 && sellOrdersCount > 0) {
    if (buyOrdersCount > sellOrdersCount) {
      return buyOrdersCount
    } else {
      //This else will also satisfy the condition of both counts being equal
      return sellOrdersCount
    }
  }
  return 0
}

function createTable(buyOrders: any, sellOrders: any) {
  const buyOrdersCount = buyOrders !== 'undefined' ? buyOrders.length : 0
  const sellOrdersCount = sellOrders !== 'undefined' ? sellOrders.length : 0
  const tableLength = getTableLength(buyOrdersCount, sellOrdersCount)
  const table: any = []
  if (tableLength === 0) {
    return table
  } else {
    for (let j = 0; j < tableLength; j++) {
      const buyOrder = buyOrders[j]
      const sellOrder = sellOrders[j]
      const row = {
        buyExpiry: buyOrder?.expiry == null ? '-' : buyOrder.expiry + ' mins',
        buyQuantity: buyOrder?.nbrOptions == null ? '' : buyOrder.nbrOptions,
        bid: buyOrder?.bid == null ? '' : buyOrder.bid,
        sellExpiry:
          sellOrder?.expiry == null ? '-' : sellOrder.expiry + ' mins',
        sellQuantity: sellOrder?.nbrOptions == null ? '' : sellOrder.nbrOptions,
        ask: sellOrder?.ask == null ? '' : sellOrder.ask,
      }
      table.push(row)
    }
    return table
  }
}

export default function OrderBook(props: {
  option: Pool
  tokenAddress: string
  exchangeProxy: string
}) {
  const option = props.option
  const optionTokenAddress = props.tokenAddress
  let responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  let responseSell = useAppSelector((state) => state.tradeOption.responseSell)
  const [orderBook, setOrderBook] = useState([] as any)
  const OrderType = {
    BUY: 0,
    SELL: 1,
  }
  const chainId = useAppSelector(selectChainId)
  const { provider } = useConnectionContext()
  const componentDidMount = async () => {
    const orders = []
    if (responseSell.length === 0) {
      const rSell = await get0xOpenOrders(
        optionTokenAddress,
        option.collateralToken.id,
        chainId
      )
      if (rSell.length > 0) {
        responseSell = rSell
      }
    }

    if (responseBuy.length === 0) {
      const rBuy = await get0xOpenOrders(
        option.collateralToken.id,
        optionTokenAddress,
        chainId
      )
      if (rBuy.length > 0) {
        responseBuy = rBuy
      }
    }
    // const fillableSellOrders = getFillableOrders(
    //   responseSell,
    //   chainId,
    //   provider,
    //   optionTokenAddress,
    //   props.exchangeProxy
    // )

    const fillableBuyOrders = await getFillableOrders(
      responseBuy,
      chainId,
      provider,
      option.collateralToken.id,
      props.exchangeProxy
    )
    console.log('fillable buy orders ' + JSON.stringify(fillableBuyOrders))

    const orderBookBuy = mapOrderData(
      responseBuy,
      option,
      optionTokenAddress,
      'desOrder'
    )
    orders.push(orderBookBuy)
    const orderBookSell = mapOrderData(
      responseSell,
      option,
      optionTokenAddress,
      'ascOrder'
    )
    orders.push(orderBookSell)
    //put both buy & sell orders in one array to format table rows
    const completeOrderBook = createTable(
      orders[OrderType.BUY],
      orders[OrderType.SELL]
    )
    setOrderBook(completeOrderBook)
  }

  useEffect(() => {
    componentDidMount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseBuy, responseSell])

  return (
    <PageDiv>
      <TableContainer component={Paper} sx={{ maxHeight: 550 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell align="center">Quantity</TableCell>
              <TableCell align="center">BID</TableCell>
              <TableCell align="center">ASK</TableCell>
              <TableCell align="center">Quantity</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {orderBook.length > 0 ? (
              orderBook.map((row: any, index: number) => {
                const labelId = `table-${index}`
                return (
                  <TableRow hover tabIndex={-1} key={orderBook.indexOf(row)}>
                    <TableCell
                      component="th"
                      id={labelId}
                      scope="row"
                      align="center"
                    >
                      <Box paddingBottom="20px">
                        <Typography variant="subtitle1">
                          {row.buyQuantity != ''
                            ? row.buyQuantity?.toFixed(4)
                            : '-'}
                        </Typography>
                        <label> </label>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box>
                        <Typography variant="subtitle1" color="#66ffa6">
                          {row.bid != '' ? Number(row.bid)?.toFixed(4) : '-'}
                        </Typography>
                        <Typography variant="caption" color="#8e8e8e" noWrap>
                          {row.buyExpiry}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box>
                        <Typography variant="subtitle1" color="#ff5c8d">
                          {row.ask != '' ? row.ask?.toFixed(4) : '-'}
                        </Typography>
                        <Typography variant="caption" color="#8e8e8e" noWrap>
                          {row.sellExpiry}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box paddingBottom="20px">
                        <Typography variant="subtitle1">
                          {row.sellQuantity != ''
                            ? row.sellQuantity?.toFixed(4)
                            : '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  None
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </PageDiv>
  )
}
