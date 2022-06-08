import { useQuery } from 'react-query'
import {
  OrderFill,
  queryOrderFills,
  queryOrderFillsMaker,
} from '../../lib/queries'
import request from 'graphql-request'
import { config } from '../../constants'
import { useAppSelector } from '../../Redux/hooks'
import { selectUserAddress } from '../../Redux/appSlice'
import { useWhitelist } from '../../hooks/useWhitelist'
import { useEffect, useState } from 'react'
import { formatEther, formatUnits } from 'ethers/lib/utils'
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
const PageDiv = styled.div`
  width: 100%;
`
type FilledOrder = {
  type: string
  quantity: string
  paidReceived: string
  price: number
}
export function TradeHistoryTab() {
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector((state) => state.appSlice.chainId)
  const { collateralTokens } = useWhitelist()
  const [history, setHistory] = useState<FilledOrder[]>([])
  const orders: FilledOrder[] = []
  const ids: string[] = []

  const orderFills = useQuery<OrderFill[]>('orderFills', async () => {
    const response = request(
      config[chainId].zeroxSubgraph,
      queryOrderFills(userAddress)
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
      config[chainId].zeroxSubgraph,
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
        collateralTokens.map((token) => {
          if (
            order.takerToken.toLowerCase() === token.id.toLowerCase() &&
            ids.includes(order.id) === false
          ) {
            orders.push({
              type: 'SELL',
              paidReceived: formatUnits(
                order.takerTokenFilledAmount,
                token.decimals
              ),
              quantity: formatEther(order.makerTokenFilledAmount),
              price:
                Number(formatUnits(order.takerTokenFilledAmount)) /
                Number(formatUnits(order.makerTokenFilledAmount)),
            })
            ids.push(order.id)
          } else if (
            order.makerToken.toLowerCase() === token.id.toLowerCase() &&
            ids.includes(order.id) === false
          ) {
            orders.push({
              type: 'BUY',
              paidReceived: formatUnits(
                order.makerTokenFilledAmount,
                token.decimals
              ),
              quantity: formatEther(order.takerTokenFilledAmount),
              price:
                Number(formatUnits(order.makerTokenFilledAmount)) /
                Number(formatUnits(order.takerTokenFilledAmount)),
            })
            ids.push(order.id)
          }
        })
      })
      orderFills.data.map((order) => {
        collateralTokens.map((token) => {
          if (
            order.takerToken.toLowerCase() === token.id.toLowerCase() &&
            ids.includes(order.id) === false
          ) {
            orders.push({
              type: 'BUY',
              paidReceived: formatUnits(
                order.takerTokenFilledAmount,
                token.decimals
              ),
              quantity: formatEther(order.makerTokenFilledAmount),
              price:
                Number(formatUnits(order.takerTokenFilledAmount)) /
                Number(formatUnits(order.makerTokenFilledAmount)),
            })
            ids.push(order.id)
          } else if (
            order.makerToken.toLowerCase() === token.id.toLowerCase() &&
            ids.includes(order.id) === false
          ) {
            orders.push({
              type: 'SELL',
              paidReceived: formatUnits(
                order.makerTokenFilledAmount,
                token.decimals
              ),
              quantity: formatEther(order.takerTokenFilledAmount),
              price:
                Number(formatUnits(order.makerTokenFilledAmount)) /
                Number(formatUnits(order.takerTokenFilledAmount)),
            })
            ids.push(order.id)
          }
        })
      })
    }
    setHistory(orders)
  }, [orderFills, orderFillsMaker])
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
                            <Typography variant="subtitle1" color="#66ffa6">
                              {order.type}
                            </Typography>
                          ) : (
                            <Typography variant="subtitle1" color="#ff5c8d">
                              {order.type}
                            </Typography>
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
