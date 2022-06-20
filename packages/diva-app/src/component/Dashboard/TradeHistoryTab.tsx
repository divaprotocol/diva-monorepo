import { useQuery } from 'react-query'
import {
  OrderFill,
  queryOrderFills,
  queryOrderFillsMaker,
} from '../../lib/queries'
import request from 'graphql-request'
import { config } from '../../constants'
import { useAppSelector } from '../../Redux/hooks'
import { selectPools, selectUserAddress } from '../../Redux/appSlice'
import { DataGrid, GridColDef, GridRowModel } from '@mui/x-data-grid'
import { useWhitelist } from '../../hooks/useWhitelist'
import React, { useEffect, useState } from 'react'
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
import { GrayText, GreenText, RedText } from '../Trade/Orders/UiStyles'
import { CoinIconPair } from '../CoinIcon'
import { Stack } from '@mui/material'
import PoolsTable from '../PoolsTable'
import { getDateTime } from '../../Util/Dates'
import { ContinuousSizeLegend } from 'react-vis'
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
export function TradeHistoryTab() {
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector((state) => state.appSlice.chainId)
  const pools = useAppSelector((state) => selectPools(state))
  const { collateralTokens } = useWhitelist()
  const [history, setHistory] = useState<any[]>([])
  const [page, setPage] = useState(0)
  const orders: any[] = []

  const orderFills = useQuery<OrderFill[]>('orderFills', async () => {
    if (userAddress != null) {
      const response = request(
        config[chainId].divaSubgraph,
        queryOrderFills(userAddress)
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
      everyOrder.map((order) => {
        collateralTokens.map((token) => {
          if (order.takerToken.toLowerCase() === token.id.toLowerCase()) {
            pools.map((pool) => {
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
  return (
    <Stack
      direction="row"
      sx={{
        height: '100%',
      }}
      spacing={6}
      paddingRight={6}
    >
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
          <PoolsTable
            disableRowClick
            page={page}
            rows={rows}
            columns={columns}
            onPageChange={(page) => setPage(page)}
          />
        </>
      )}
    </Stack>
  )
}
