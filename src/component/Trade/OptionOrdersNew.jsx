import React from 'react'
import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
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
    fontWeight: 'solid',
  },
}))(TableCell)

function mapOrderData(records, selectedOption, account) {
  const orderbook = records.map((record) => {
    const order = record.order
    const orderMaker = order.maker
    if (account === orderMaker) {
      const makerToken = order.makerToken
      const tokenAddress = selectedOption.TokenAddress.toLowerCase()
      const orderType = makerToken === tokenAddress ? 'Sell' : 'Buy'
      const nbrOptions =
        (makerToken === tokenAddress ? order.makerAmount : order.takerAmount) /
        10 ** 18
      const payReceive =
        (makerToken === tokenAddress ? order.takerAmount : order.makerAmount) /
        10 ** selectedOption.DecimalsCollateralToken
      const pricePerOption = payReceive / nbrOptions
      const expiry = getDateTime(order.expiry)
      const expiryMins = getExpiryMinutesFromNow(order.expiry)
      var orders = {
        id: orderType + records.indexOf(record),
        orderType: orderType,
        nbrOptions: nbrOptions,
        payReceive: payReceive,
        pricePerOption: pricePerOption,
        expiry: expiry,
        expiryMins: expiryMins + ' mins',
      }
    }
    return orders
  })
  return orderbook
}

let accounts
export default function OpenOrdersNew() {
  const selectedOption = useSelector((state) => state.tradeOption.option)

  var responseBuy = useSelector((state) => state.tradeOption.responseBuy)
  var responseSell = useSelector((state) => state.tradeOption.responseSell)
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(5)
  const dispatch = useDispatch()
  const [orders, setOrders] = useState([])

  const componentDidMount = async () => {
    accounts = await window.ethereum.enable()
    var orderBook = []
    if (responseSell.length === 0) {
      const rSell = await get0xOpenOrders(
        selectedOption.TokenAddress,
        selectedOption.CollateralToken
      )
      responseSell = rSell.data.records
      dispatch(setResponseSell(responseSell))
    }

    if (responseBuy.length === 0) {
      const rBuy = await get0xOpenOrders(
        selectedOption.CollateralToken,
        selectedOption.TokenAddress
      )
      responseBuy = rBuy.data.records
      dispatch(setResponseBuy(responseBuy))
    }

    const orderBookBuy = mapOrderData(responseBuy, selectedOption, accounts[0])
    const orderBookSell = mapOrderData(
      responseSell,
      selectedOption,
      accounts[0]
    )

    if (orderBookSell.length > 0) {
      orderBookSell.forEach((order) => {
        if (order) {
          orderBook.push(order)
        }
      })
    }

    if (Object.keys(orderBookBuy).length > 0) {
      orderBookBuy.forEach((order) => {
        if (order) {
          orderBook.push(order)
        }
      })
    }
    setOrders(orderBook)
  }

  useEffect(() => {
    if (responseBuy.length === 0 || responseSell === 0) {
      componentDidMount()
    }
  }, [])

  useEffect(() => {
    if (responseBuy.length > 0 || responseSell > 0) {
      componentDidMount()
    }
    return () => {
      if (responseBuy.length > 0 || responseSell > 0) {
        dispatch(setResponseSell([]))
        dispatch(setResponseBuy([]))
      }
    }
  }, [responseBuy, responseSell])

  const classes = useStyles()

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(+event.target.value))
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
              <TableHeaderCell align="center">Pay/Recei</TableHeaderCell>
              <TableHeaderCell align="right">Cancel</TableHeaderCell>
            </TableRow>
          </TableHeadStyle>
          <TableBody>
            {orders.length > 0 ? (
              orders
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((order, index) => {
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
                          <Typography variant="h6">
                            {order.orderType}
                          </Typography>
                          <Typography variant="caption" noWrap>
                            {order.expiry}
                          </Typography>
                        </Box>
                      </TableCellStyle>
                      <TableCellStyle align="center">
                        <Box paddingBottom="20px">
                          <Typography variant="h6">
                            {order.nbrOptions}
                          </Typography>
                        </Box>
                      </TableCellStyle>
                      <TableCellStyle align="center">
                        <Box paddingBottom="20px">
                          <Typography variant="h6">
                            {order.pricePerOption}
                          </Typography>
                        </Box>
                      </TableCellStyle>
                      <TableCellStyle align="center">
                        <Box paddingBottom="20px">
                          <Typography variant="h6">
                            {order.payReceive}
                          </Typography>
                        </Box>
                      </TableCellStyle>
                      <TableCellStyle align="right">
                        <Box paddingBottom="20px">
                          <Typography variant="h6">
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
