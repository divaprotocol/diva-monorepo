import React from 'react'
import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '../../Redux/hooks'
import { setResponseBuy, setResponseSell } from '../../Redux/TradeOption'
import 'styled-components'
import styled from 'styled-components'
import { makeStyles, withStyles } from '@mui/styles'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import DeleteIcon from '@mui/icons-material/Delete'
import { get0xOpenOrders } from '../../DataService/OpenOrders'
import { getDateTime } from '../../Util/Dates'
import { getExpiryMinutesFromNow } from '../../Util/Dates'
import { Pool } from '../../lib/queries'
import { formatUnits } from 'ethers/lib/utils'
import { BigNumber } from '@0x/utils'
import { useAccount } from 'wagmi'

const useStyles = makeStyles({
  table: {
    minWidth: 250,
  },
})

const TableCellStyle = withStyles(() => ({
  root: {
    height: '10px',
    padding: '10px',
  },
}))(TableCell)

const PageDiv = styled.div`
  width: 100%;
`

const NoOrderTextDiv = styled.div`
  font-size: 1.1rem;
  width: 100%;
  margin-left: 267%;
  margin-top: 8%;
  margin-bottom: 8%;
`

const TableHeaderCell = withStyles(() => ({
  root: {
    fontWeight: 100,
  },
}))(TableCell)

function mapOrderData(
  records: [],
  option: Pool,
  optionTokenAddress: string,
  account: string
) {
  const orderbook: any = records.map((record: any) => {
    const order = record.order
    const orderMaker = order.maker
    const makerAmount = new BigNumber(order.makerAmount)
    const takerAmount = new BigNumber(order.takerAmount)
    const metaData = record.metaData
    if (account === orderMaker) {
      const makerToken = order.makerToken
      const tokenAddress = optionTokenAddress.toLowerCase()
      const orderType = makerToken === tokenAddress ? 'Sell' : 'Buy'
      let nbrOptions = 0
      let pricePerOption = 0
      let payReceive = 0
      if (makerToken === tokenAddress) {
        const askAmount = takerAmount.dividedBy(makerAmount)
        const remainingTakerAmount = new BigNumber(
          metaData.remainingFillableTakerAmount
        )
        if (remainingTakerAmount.eq(makerAmount)) {
          nbrOptions = Number(
            formatUnits(makerAmount.toString(), option.collateralToken.decimals)
          )
        } else {
          const quantity = remainingTakerAmount.dividedBy(askAmount)
          nbrOptions = Number(
            formatUnits(quantity.toString(), option.collateralToken.decimals)
          )
        }
        const receiveAmount = metaData.remainingFillableTakerAmount
        payReceive = Number(
          formatUnits(receiveAmount.toString(), option.collateralToken.decimals)
        )
        pricePerOption = payReceive / nbrOptions
      } else {
        const remainingTakerAmount = new BigNumber(
          metaData.remainingFillableTakerAmount
        )
        if (remainingTakerAmount.lt(takerAmount)) {
          nbrOptions = Number(
            formatUnits(
              remainingTakerAmount.toString(),
              option.collateralToken.decimals
            )
          )
        } else {
          nbrOptions = Number(
            formatUnits(takerAmount.toString(), option.collateralToken.decimals)
          )
        }
        payReceive = Number(
          formatUnits(makerAmount.toString(), option.collateralToken.decimals)
        )
        pricePerOption = makerAmount.dividedBy(takerAmount).toNumber()
      }
      const expiry = getDateTime(order.expiry)
      const expiryMins = getExpiryMinutesFromNow(order.expiry)
      const orders = {
        id: orderType + records.indexOf(record as never),
        orderType: orderType,
        nbrOptions: nbrOptions,
        payReceive: payReceive,
        pricePerOption: pricePerOption,
        expiry: expiry,
        expiryMins: expiryMins + ' mins',
      }
      return orders
    }
  })
  return orderbook
}

let accounts
export default function OpenOrders(props: {
  option: Pool
  tokenAddress: string
}) {
  const option = props.option
  const optionTokenAddress = props.tokenAddress
  let responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  let responseSell = useAppSelector((state) => state.tradeOption.responseSell)
  const dispatch = useAppDispatch()
  const [orders, setOrders] = useState([])
  const [{ data: accountData }] = useAccount({
    fetchEns: true,
  })

  const componentDidMount = async () => {
    accounts = accountData.address
    const orderBook: any = []
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
      accounts[0]
    )
    const orderBookSell = mapOrderData(
      responseSell,
      option,
      optionTokenAddress,
      accounts[0]
    )

    if (orderBookSell.length > 0) {
      orderBookSell.forEach((order: any) => {
        if (order) {
          orderBook.push(order)
        }
      })
    }

    if (Object.keys(orderBookBuy).length > 0) {
      orderBookBuy.forEach((order: any) => {
        if (order) {
          orderBook.push(order)
        }
      })
    }
    setOrders(orderBook)
  }

  useEffect(() => {
    if (responseBuy.length === 0 || responseSell.length === 0) {
      componentDidMount()
    }
  }, [])

  useEffect(() => {
    if (responseBuy.length > 0 || responseSell.length > 0) {
      componentDidMount()
    }
    return () => {
      if (responseBuy.length > 0 || responseSell.length > 0) {
        dispatch(setResponseSell([]))
        dispatch(setResponseBuy([]))
      }
    }
  }, [responseBuy, responseSell])

  const classes = useStyles()

  return (
    <PageDiv>
      <TableContainer component={Paper} sx={{ maxHeight: 340 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell align="center">Quantity</TableHeaderCell>
              <TableHeaderCell align="center">Price</TableHeaderCell>
              <TableHeaderCell align="center">Pay/Receive</TableHeaderCell>
              <TableHeaderCell align="right">Cancel</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order: any, index: number) => {
                const labelId = `enhanced-table-${index}`
                return (
                  <TableRow key={index} hover>
                    <TableCellStyle
                      component="th"
                      id={labelId}
                      scope="row"
                      align="left"
                    >
                      <Box>
                        <Typography variant="subtitle1">
                          {order.orderType}
                        </Typography>
                        <Typography variant="caption" noWrap>
                          {order.expiry}
                        </Typography>
                      </Box>
                    </TableCellStyle>
                    <TableCellStyle align="center">
                      <Box paddingBottom="20px">
                        <Typography variant="subtitle1">
                          {order.nbrOptions}
                        </Typography>
                      </Box>
                    </TableCellStyle>
                    <TableCellStyle align="center">
                      <Box paddingBottom="20px">
                        <Typography variant="subtitle1">
                          {order.pricePerOption.toFixed(2)}
                        </Typography>
                      </Box>
                    </TableCellStyle>
                    <TableCellStyle align="center">
                      <Box paddingBottom="20px">
                        <Typography variant="subtitle1">
                          {order.payReceive.toFixed(2)}
                        </Typography>
                      </Box>
                    </TableCellStyle>
                    <TableCellStyle align="right">
                      <Box paddingBottom="20px">
                        <Typography variant="subtitle1">
                          <Button
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            size="small"
                          >
                            Cancel
                          </Button>
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
