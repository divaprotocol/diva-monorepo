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
import { config } from '../../constants'
import { useAppSelector } from '../../Redux/hooks'
import { ORDER_TYPE } from '../../Models/orderbook'
import {
  createTable,
  get0xOpenOrders,
  getResponse,
  mapOrderData,
} from '../../DataService/OpenOrders'
import { Pool } from '../../lib/queries'
import { selectChainId } from '../../Redux/appSlice'
import { useConnectionContext } from '../../hooks/useConnectionContext'

export default function OrderBook(props: {
  option: Pool
  tokenAddress: string
  exchangeProxy: string
  currentTab: string // LONG/SHORT tab
}) {
  const option = props.option
  const optionTokenAddress = props.tokenAddress
  // let responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  // let responseSell = useAppSelector((state) => state.tradeOption.responseSell)
  const [orderBook, setOrderBook] = useState([] as any)
  const [responseBuy, setResponseBuy] = useState([] as any)
  const [responseSell, setResponseSell] = useState([] as any)
  const chainId = useAppSelector(selectChainId)
  const { provider } = useConnectionContext()
  const [websocketClient, setWebsocketClient] = useState(
    new WebSocket(config[chainId].websocket)
  )

  useEffect(() => {
    console.log('props.currentTab', props.currentTab)
    const fetchOrders = async () => {
      const orders = []
      // if (responseSell.length === 0) {
      const rSell = await get0xOpenOrders(
        optionTokenAddress,
        option.collateralToken.id,
        chainId,
        provider,
        props.exchangeProxy
      )
      // if (rSell.length > 0) {
      //   responseSell = rSell
      // }
      setResponseSell(rSell.length > 0 ? rSell : [])
      // }
      // if (responseBuy.length === 0) {
      const rBuy = await get0xOpenOrders(
        option.collateralToken.id,
        optionTokenAddress,
        chainId,
        provider,
        props.exchangeProxy
      )
      console.log('hi')
      // if (rBuy.length > 0) {
      //   responseBuy = rBuy
      // }
      setResponseBuy(rBuy.length > 0 ? rBuy : [])
      // }

      // Keep this for debugging
      // const buyOrdersByMakerAddress = responseBuy.filter((v) =>
      //   v.order.maker.includes('0xfb34097980eb94bdec8ee4a1eafab92d29d177d9')
      // )
      // console.log('buyOrdersByMakerAddress', buyOrdersByMakerAddress)

      // Keep for debugging
      // const sellOrdersByMakerAddress = responseSell.filter((v) =>
      //   v.order.maker.includes('0xfb34097980eb94bdec8ee4a1eafab92d29d177d9')
      // )
      // console.log('sellOrdersByMakerAddress', sellOrdersByMakerAddress)

      const orderBookBuy = mapOrderData(
        responseBuy,
        option.collateralToken.decimals,
        ORDER_TYPE.BUY
      )
      orders.push(orderBookBuy)

      const orderBookSell = mapOrderData(
        responseSell,
        option.collateralToken.decimals,
        ORDER_TYPE.SELL
      )
      orders.push(orderBookSell)

      //put both buy & sell orders in one array to format table rows
      const completeOrderBook = createTable(
        orders[ORDER_TYPE.BUY],
        orders[ORDER_TYPE.SELL]
      )
      setOrderBook(completeOrderBook)
      console.log(completeOrderBook)
      console.log('orderbook updated', props.currentTab)
    }

    fetchOrders()

    // // Cleanup function
    // return () => {
    //   // Close the websocket connection
    //   if (websocketClient) {
    //     websocketClient.close()
    //   }
    // }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, props.currentTab])

  useEffect(() => {
    if (websocketClient !== undefined) {
      // Connect to server using websocket
      websocketClient.onopen = () => {
        console.log('WebSocket Connected')
      }

      // Receive data using websocket
      websocketClient.onmessage = (e) => {
        const message = JSON.parse(e.data)
        const orders = message.filter((item) => item.poolId === option.id)

        if (orders.length !== 0) {
          const updateOrders = []
          const checkOrders = orders[0]

          // Get first and second order's bids
          const firstRecords = checkOrders.first.bids.records
          const secondRecords = checkOrders.second.bids.records

          // Get updated pool's buy and sell data
          const { responseBuy, responseSell } = getResponse(
            optionTokenAddress,
            firstRecords,
            secondRecords
          )

          // Get updated orderbook buy data
          const orderBookBuy = mapOrderData(
            responseBuy,
            option.collateralToken.decimals,
            ORDER_TYPE.BUY
          )
          updateOrders.push(orderBookBuy)

          // Get updated orderbook buy data
          const orderBookSell = mapOrderData(
            responseSell,
            option.collateralToken.decimals,
            ORDER_TYPE.SELL
          )
          updateOrders.push(orderBookSell)

          //put both buy & sell orders in one array to format table rows
          const completeOrderBook = createTable(
            updateOrders[ORDER_TYPE.BUY],
            updateOrders[ORDER_TYPE.SELL]
          )

          setOrderBook(completeOrderBook)
        }
      }

      return () => {
        websocketClient.onclose = () => {
          console.log('WebSocket Disconnected')
          setWebsocketClient(new WebSocket(config[chainId].websocket))
        }
      }
    }
  }, [
    websocketClient.onmessage,
    websocketClient.onopen,
    websocketClient.onclose,
  ])

  return (
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
                          ? Number(row.buyQuantity)?.toFixed(4)
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
                        {row.ask != '' ? Number(row.ask)?.toFixed(4) : '-'}
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
                          ? Number(row.sellQuantity)?.toFixed(4)
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
  )
}
