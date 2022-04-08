import React from 'react'
import 'styled-components'
import styled from 'styled-components'
import { withStyles } from '@mui/styles'
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
//import { BigNumber } from '@0x/utils'
//import { formatEther } from 'ethers/lib/utils'
const PageDiv = styled.div`
  width: 100%;
`
const NoOrderTextDiv = styled.div`
  font-size: 1.1rem;
  width: 100%;
  margin-left: 140%;
  margin-top: 4%;
  margin-bottom: 4%;
`

const TableHeaderCell = withStyles(() => ({
  root: {
    fontWeight: 100,
  },
}))(TableCell)

const TableCellStyle = withStyles(() => ({
  root: {
    height: '10px',
    padding: '10px',
  },
}))(TableCell)

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

function mapOrderData(
  records: [],
  option: Pool,
  optionTokenAddress: string,
  sortOrder: string
) {
  let orderBy: string
  let sortedRecords: any = []
  const orderbook: any = records.map((record: any) => {
    const order = record.order
    const metaData = record.metaData
    const makerToken = order.makerToken
    const takerToken = order.takerToken
    const collateralToken = option.collateralToken.id.toLowerCase()
    const tokenAddress = optionTokenAddress.toLowerCase()
    const orders: any = {}
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
      if (remainingTakerAmount < takerAmount) {
        const nbrOptions = Number(remainingTakerAmount)
        orders.nbrOptions = nbrOptions
      } else {
        const nbrOptions = Number(takerAmount)
        orders.nbrOptions = nbrOptions
      }
    }
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
        const quantity = Number(remainingTakerAmount) / askAmount
        orders.nbrOptions = quantity
      }
    }
    return orders
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
        buyExpiry: buyOrder === undefined ? '-' : buyOrder.expiry + ' mins',
        buyQuantity: buyOrder === undefined ? '' : buyOrder.nbrOptions,
        bid: buyOrder === undefined ? '' : buyOrder.bid,
        sellExpiry: sellOrder === undefined ? '-' : sellOrder.expiry + ' mins',
        sellQuantity: sellOrder === undefined ? '' : sellOrder.nbrOptions,
        ask: sellOrder === undefined ? '' : sellOrder.ask,
      }
      table.push(row)
    }
    return table
  }
}

export default function OrderBook(props: {
  option: Pool
  tokenAddress: string
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

  const componentDidMount = async () => {
    const orders = []
    if (responseSell.length === 0) {
      const rSell = await get0xOpenOrders(
        optionTokenAddress,
        option.collateralToken.id
      )
      if (rSell.length > 0) {
        responseSell = rSell
      }
    }

    if (responseBuy.length === 0) {
      const rBuy = await get0xOpenOrders(
        option.collateralToken.id,
        optionTokenAddress
      )
      if (rBuy.length > 0) {
        responseBuy = rBuy
      }
    }

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
      <TableContainer component={Paper} sx={{ maxHeight: 340 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableHeaderCell align="center">Quantity</TableHeaderCell>
              <TableHeaderCell align="center">BID</TableHeaderCell>
              <TableHeaderCell align="center">ASK</TableHeaderCell>
              <TableHeaderCell align="center">Quantity</TableHeaderCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {orderBook.length > 0 ? (
              orderBook.map((row: any, index: number) => {
                const labelId = `table-${index}`
                return (
                  <TableRow hover tabIndex={-1} key={orderBook.indexOf(row)}>
                    <TableCellStyle
                      component="th"
                      id={labelId}
                      scope="row"
                      align="center"
                    >
                      <Box paddingBottom="20px">
                        <Typography variant="subtitle1">
                          {row.buyQuantity != ''
                            ? row.buyQuantity.toFixed(2).toString()
                            : '-'}
                        </Typography>
                        <label> </label>
                      </Box>
                    </TableCellStyle>
                    <TableCellStyle align="center">
                      <Box>
                        <Typography variant="subtitle1">
                          {row.bid != '' ? Number(row.bid).toFixed(2) : '-'}
                        </Typography>
                        <Typography variant="caption" noWrap>
                          {row.buyExpiry}
                        </Typography>
                      </Box>
                    </TableCellStyle>
                    <TableCellStyle align="center">
                      <Box>
                        <Typography variant="subtitle1">
                          {row.ask != '' ? row.ask.toFixed(2).toString() : '-'}
                        </Typography>
                        <Typography variant="caption" noWrap>
                          {row.sellExpiry}
                        </Typography>
                      </Box>
                    </TableCellStyle>
                    <TableCellStyle align="center">
                      <Box paddingBottom="20px">
                        <Typography variant="subtitle1">
                          {row.sellQuantity != ''
                            ? row.sellQuantity.toFixed(2).toString()
                            : '-'}
                        </Typography>
                      </Box>
                    </TableCellStyle>
                  </TableRow>
                )
              })
            ) : (
              <NoOrderTextDiv>None</NoOrderTextDiv>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </PageDiv>
  )
}
