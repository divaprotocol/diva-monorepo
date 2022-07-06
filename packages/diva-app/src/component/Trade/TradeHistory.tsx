import { useQuery } from 'react-query'
import {
  OrderFill,
  queryOrderFillsTaker,
  queryOrderFillsMaker,
} from '../../lib/queries'
import request from 'graphql-request'
import { config } from '../../constants'
import { useAppSelector } from '../../Redux/hooks'
import { selectUserAddress } from '../../Redux/appSlice'
import TableContainer from '@mui/material/TableContainer'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableBody from '@mui/material/TableBody'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import styled from 'styled-components'
import { useEffect, useState } from 'react'
import { formatEther, formatUnits } from 'ethers/lib/utils'
import { Stack } from '@mui/material'
import { GrayText } from './Orders/UiStyles'
import { getDateTime } from '../../Util/Dates'

const PageDiv = styled.div`
  width: 100%;
`
type Props = {
  pool?: any
}
type FilledOrder = {
  type: string
  quantity: string
  paidReceived: string
  price: number
  timestamp: number
}
export const TradeHistory = ({ pool }: Props) => {
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector((state) => state.appSlice.chainId)
  const isLong = window.location.pathname.split('/')[2] === 'long'
  const positionTokenAddress = isLong ? pool?.longToken.id : pool?.shortToken.id
  const collateralTokenAddress = pool.collateralToken.id
  const [history, setHistory] = useState<FilledOrder[]>([])
  const orders: FilledOrder[] = []
  const ids: string[] = []
  const orderFills = useQuery<OrderFill[]>('orderFills', async () => {
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
  })
  const orderFillsMaker = useQuery<OrderFill[]>('orderFillsMaker', async () => {
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
  })

  useEffect(() => {
    if (orderFills.data && orderFillsMaker.data) {
      orderFillsMaker.data.map((order) => {
        if (
          order.makerToken.toLowerCase() ===
            positionTokenAddress.toLowerCase() &&
          order.takerToken.toLowerCase() ===
            collateralTokenAddress.toLowerCase() &&
          ids.includes(order.id) === false
        ) {
          orders.push({
            type: 'SELL',
            paidReceived: formatUnits(
              order.takerTokenFilledAmount,
              pool.collateralToken.decimals
            ),
            quantity: formatEther(order.makerTokenFilledAmount),
            price:
              Number(formatUnits(order.takerTokenFilledAmount)) /
              Number(formatUnits(order.makerTokenFilledAmount)),
            timestamp: order.timestamp,
          })
          ids.push(order.id)
        } else if (
          order.makerToken.toLowerCase() ===
            collateralTokenAddress.toLowerCase() &&
          order.takerToken.toLowerCase() ===
            positionTokenAddress.toLowerCase() &&
          ids.includes(order.id) === false
        ) {
          orders.push({
            type: 'BUY',
            paidReceived: formatUnits(
              order.makerTokenFilledAmount,
              pool.collateralToken.decimals
            ),
            quantity: formatEther(order.takerTokenFilledAmount),
            price:
              Number(formatUnits(order.makerTokenFilledAmount)) /
              Number(formatUnits(order.takerTokenFilledAmount)),
            timestamp: order.timestamp,
          })
          ids.push(order.id)
        }
      })
      orderFills.data.map((order) => {
        if (
          order.makerToken.toLowerCase() ===
            positionTokenAddress.toLowerCase() &&
          order.takerToken.toLowerCase() ===
            collateralTokenAddress.toLowerCase() &&
          ids.includes(order.id) === false
        ) {
          orders.push({
            type: 'BUY',
            paidReceived: formatUnits(
              order.takerTokenFilledAmount,
              pool.collateralToken.decimals
            ),
            quantity: formatEther(order.makerTokenFilledAmount),
            price:
              Number(formatUnits(order.takerTokenFilledAmount)) /
              Number(formatUnits(order.makerTokenFilledAmount)),
            timestamp: order.timestamp,
          })
          ids.push(order.id)
        } else if (
          order.makerToken.toLowerCase() ===
            collateralTokenAddress.toLowerCase() &&
          order.takerToken.toLowerCase() ===
            positionTokenAddress.toLowerCase() &&
          ids.includes(order.id) === false
        ) {
          orders.push({
            type: 'SELL',
            paidReceived: formatUnits(
              order.makerTokenFilledAmount,
              pool.collateralToken.decimals
            ),
            quantity: formatEther(order.takerTokenFilledAmount),
            price:
              Number(formatUnits(order.makerTokenFilledAmount)) /
              Number(formatUnits(order.takerTokenFilledAmount)),
            timestamp: order.timestamp,
          })
          ids.push(order.id)
        }
      })
      orders.sort((a, b) => {
        if (a.timestamp > b.timestamp) return -1
        if (a.timestamp < b.timestamp) return 1
        return 0
      })
    }
    setHistory(orders)
  }, [
    collateralTokenAddress,
    pool.collateralToken.decimals,
    positionTokenAddress,
  ])

  return (
    <PageDiv>
      <TableContainer component={Paper} sx={{ maxHeight: 550 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell align="left">Type</TableCell>
              <TableCell align="center">Quantity</TableCell>
              <TableCell align="center">Price</TableCell>
              <TableCell align="center">Paid/Received</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.length > 0 ? (
              history.map((order: any, index: number) => {
                if (order.quantity != 0) {
                  const labelId = `enhanced-history-${index}`
                  return (
                    <TableRow key={index} hover>
                      <TableCell
                        component="th"
                        id={labelId}
                        scope="row"
                        align="left"
                      >
                        <Box>
                          {order.type === 'BUY' ? (
                            <Stack>
                              <Typography variant="subtitle1" color="#66ffa6">
                                {order.type}
                              </Typography>
                              <Typography color="dimgray" fontSize={'0.75rem'}>
                                {getDateTime(order.timestamp)}
                              </Typography>
                            </Stack>
                          ) : (
                            <Stack>
                              <Typography variant="subtitle1" color="#ff5c8d">
                                {order.type}
                              </Typography>
                              <Typography color="dimgray" fontSize={'0.75rem'}>
                                {getDateTime(order.timestamp)}
                              </Typography>
                            </Stack>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell
                        component="th"
                        id={labelId}
                        scope="row"
                        align="center"
                      >
                        <Box>
                          <Typography variant="subtitle1">
                            {Number(order.quantity).toFixed(2)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        component="th"
                        id={labelId}
                        scope="row"
                        align="center"
                      >
                        <Box>
                          <Typography variant="subtitle1">
                            {Number(order.price).toFixed(4)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell
                        component="th"
                        id={labelId}
                        scope="row"
                        align="center"
                      >
                        <Box>
                          <Typography variant="subtitle1">
                            {Number(order.paidReceived).toFixed(4)}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                }
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
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
