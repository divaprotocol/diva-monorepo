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
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import DeleteIcon from '@mui/icons-material/Delete'
import { get0xOpenOrders } from '../../DataService/OpenOrders'
import { getDateTime } from '../../Util/Dates'
import { getExpiryMinutesFromNow } from '../../Util/Dates'
import { Pool } from '../../lib/queries'
import { formatUnits, parseEther } from 'ethers/lib/utils'
import { BigNumber } from '@0x/utils'
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
  margin-left: 120%;
  margin-top: 10%;
  margin-bottom: 10%;
`

const TableHeader = styled.h4`
  font-size: 1rem;
  font: regular;
  padding-left: 15px;
  text-align: left;
`

const TableHeadStyle = withStyles(() => ({
  root: {},
}))(TableHead)

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
    //const makerAmount = parseEther(order.makerAmount.toString())
    //const takerAmount = parseEther(order.takerAmount.toString()).div(
    //  parseEther('1')
    //)
    const makerAmount = new BigNumber(order.makerAmount)
    const takerAmount = new BigNumber(order.takerAmount)
    if (account === orderMaker) {
      const makerToken = order.makerToken
      const tokenAddress = optionTokenAddress.toLowerCase()
      const orderType = makerToken === tokenAddress ? 'Sell' : 'Buy'
      //const nbrOptions =
      //  (makerToken === tokenAddress ? order.makerAmount : order.takerAmount) /
      //  10 ** 18
      const amount = makerToken === tokenAddress ? makerAmount : takerAmount
      const nbrOptions = Number(
        formatUnits(amount.toString(), option.collateralDecimals)
      )
      //const payReceive =
      //  (makerToken === tokenAddress ? order.takerAmount : order.makerAmount) /
      //  10 ** option.collateralDecimals
      const receiveAmount =
        makerToken === tokenAddress ? takerAmount : makerAmount
      const payReceive = Number(
        formatUnits(receiveAmount.toString(), option.collateralDecimals)
      )
      const pricePerOption = payReceive / nbrOptions
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
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(5)
  const dispatch = useAppDispatch()
  const [orders, setOrders] = useState([])

  const componentDidMount = async () => {
    accounts = await window.ethereum.enable()
    const orderBook: any = []
    if (responseSell.length === 0) {
      const rSell = await get0xOpenOrders(
        optionTokenAddress,
        option.collateralToken
      )
      if (rSell.length > 0) {
        responseSell = rSell
      }
    }

    if (responseBuy.length === 0) {
      const rBuy = await get0xOpenOrders(
        option.collateralToken,
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

  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: any) => {
    setRowsPerPage(parseInt(event.target.value))
    setPage(0)
  }

  return (
    <PageDiv>
      <TableHeader>Your Open Orders</TableHeader>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-label="simple table">
          <TableHeadStyle>
            <TableRow>
              <TableHeaderCell>Type</TableHeaderCell>
              <TableHeaderCell align="center">Quantity</TableHeaderCell>
              <TableHeaderCell align="center">Price</TableHeaderCell>
              <TableHeaderCell align="center">Pay/Receive</TableHeaderCell>
              <TableHeaderCell align="right">Cancel</TableHeaderCell>
            </TableRow>
          </TableHeadStyle>
          <TableBody>
            {orders.length > 0 ? (
              orders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((order: any, index: number) => {
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
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={orders.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </PageDiv>
  )
}
