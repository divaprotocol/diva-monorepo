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
import { useConnectionContext } from '../../hooks/useConnectionContext'
const PageDiv = styled.div`
  width: 100%;
`

/**
 * Prepare all data to be displayed in the orderbook (price, quantity and expires in)
 */
function mapOrderData(
  records: [],
  option: Pool,
  orderType: number // 0 = BUY, 1 = SELL
) {
  // Get orderbook (before filtering out 0 quantities)
  const orderbookTemp: any = records.map((record: any) => {
    const order = record.order
    const metaData = record.metaData
    const orders: any = {}

    // Buy Limit (orderType = 0)
    if (orderType === 0) {
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
      const bidAmount = Number(makerAmount) / Number(takerAmount) // ok to have it that way as this is just for displaying information in the frontend and not for transactions
      orders.bid = bidAmount
      if (Number(remainingTakerAmount) < Number(takerAmount)) {
        const nbrOptions = Number(remainingTakerAmount)
        orders.nbrOptions = nbrOptions
      } else {
        orders.nbrOptions = Number(takerAmount)
      }
    }
    // Sell Limit (orderType = 1)
    if (orderType === 1) {
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

  return orderbook
}

function createTable(buyOrders: any, sellOrders: any) {
  // Get orderbook table length
  const buyOrdersCount = buyOrders !== 'undefined' ? buyOrders.length : 0
  const sellOrdersCount = sellOrders !== 'undefined' ? sellOrders.length : 0
  const tableLength =
    buyOrdersCount >= sellOrdersCount ? buyOrdersCount : sellOrdersCount

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
    console.log('provider', provider)
    if (responseSell.length === 0) {
      const rSell = await get0xOpenOrders(
        optionTokenAddress,
        option.collateralToken.id,
        chainId,
        provider,
        props.exchangeProxy
      )
      if (rSell.length > 0) {
        responseSell = rSell
      }
    }
    if (responseBuy.length === 0) {
      const rBuy = await get0xOpenOrders(
        option.collateralToken.id,
        optionTokenAddress,
        chainId,
        provider,
        props.exchangeProxy
      )
      if (rBuy.length > 0) {
        responseBuy = rBuy
      }
    }
    const orderBookBuy = mapOrderData(responseBuy, option, OrderType.BUY)
    orders.push(orderBookBuy)

    const orderBookSell = mapOrderData(responseSell, option, OrderType.SELL)
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
  }, [responseBuy, responseSell, provider])

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
