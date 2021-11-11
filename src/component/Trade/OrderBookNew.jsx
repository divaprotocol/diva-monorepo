import React from 'react'
import 'styled-components'
import styled from 'styled-components'
import { makeStyles, withStyles } from '@mui/styles'

import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { get0xOpenOrders } from '../../DataService/OpenOrders'
import { getExpiryMinutesFromNow } from '../../Util/Dates'
const useStyles = makeStyles({
  table: {
    minWidth: 250,
  },
})

const PageDiv = styled.div`
  width: 100%;
  background-color: white;
`

const TableHeader = styled.h4`
  font-size: 1rem;
  color: black;
  padding-left: 15px;
  text-align: left;
`

const NoOrderTextDiv = styled.div`
  font-size: 1.1rem;
  color: black;
  width: 100%;
  margin-left: 100%;
  margin-top: 10%;
  margin-bottom: 10%;
`

const TableHeadStyle = withStyles(() => ({
  root: {
    backgroundColor: 'rgb(134,217,192)',
  },
}))(TableHead)

const TableHeaderCell = withStyles(() => ({
  root: {
    color: '#282c34',
    fontWeight: 'solid',
  },
}))(TableCell)

function descendingComparator(a, b, orderBy) {
  console.log(orderBy + ' b ' + b[orderBy] + ' a ' + a[orderBy])
  if (b[orderBy] < a[orderBy]) {
    return -1
  }
  if (b[orderBy] > a[orderBy]) {
    return 1
  }
  return 0
}

function getComparator(order, orderBy) {
  if (order === 'ascOrder') {
    return (a, b) => -descendingComparator(a, b, orderBy)
  }
  if (order === 'desOrder') {
    return (a, b) => descendingComparator(a, b, orderBy)
  }
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index])
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0])
    if (order !== 0) {
      return order
    }
    return a[1] - b[1]
  })
  return stabilizedThis.map((el) => el[0])
}

function mapOrderData(records, selectedOption, sortOrder) {
  var orderBy = ''
  var sortedRecords = []
  const orderbook = records.map((record) => {
    const order = record.order
    const makerToken = order.makerToken
    const takerToken = order.takerToken
    const collateralToken = selectedOption.CollateralToken.toLowerCase()
    const tokenAddress = selectedOption.TokenAddress.toLowerCase()
    var orders = {}

    if (makerToken === collateralToken && takerToken === tokenAddress) {
      orders.expiry = getExpiryMinutesFromNow(order.expiry)
      orders.orderType = 'buy'
      orders.id = 'buy' + records.indexOf(record)
      orders.nbrOptions = order.takerAmount / 10 ** 18
      orders.bid =
        (order.makerAmount / order.takerAmount) *
        10 ** (18 - selectedOption.DecimalsCollateralToken)
    }
    if (makerToken === tokenAddress && takerToken === collateralToken) {
      orders.expiry = getExpiryMinutesFromNow(order.expiry)
      orders.orderType = 'sell'
      orders.id = 'sell' + records.indexOf(record)
      orders.nbrOptions = order.makerAmount / 10 ** 18
      orders.ask =
        (order.takerAmount / order.makerAmount) *
        10 ** (18 - selectedOption.DecimalsCollateralToken)
    }
    return orders
  })

  if (sortOrder === 'ascOrder') {
    orderBy = 'ask'
    sortedRecords = stableSort(orderbook, getComparator(sortOrder, orderBy))
  }
  if (sortOrder === 'desOrder') {
    orderBy = 'bid'
    sortedRecords = stableSort(orderbook, getComparator(sortOrder, orderBy))
  }

  return sortedRecords
}

export default function OrderBookNew() {
  const selectedOption = useSelector((state) => state.tradeOption.option)
  var responseBuy = useSelector((state) => state.tradeOption.responseBuy)
  var responseSell = useSelector((state) => state.tradeOption.responseSell)
  const [orderBook, setOrderBook] = useState([])
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(5)

  const componentDidMount = async () => {
    const orders = []

    if (responseSell.length === 0) {
      const rSell = await get0xOpenOrders(
        selectedOption.TokenAddress,
        selectedOption.CollateralToken
      )
      responseSell = rSell.data.records
    }

    if (responseBuy.length === 0) {
      const rBuy = await get0xOpenOrders(
        selectedOption.CollateralToken,
        selectedOption.TokenAddress
      )
      responseBuy = rBuy.data.records
    }

    const orderBookBuy = mapOrderData(responseBuy, selectedOption, 'desOrder')
    orders.push(orderBookBuy)
    const orderBookSell = mapOrderData(responseSell, selectedOption, 'ascOrder')
    orders.push(orderBookSell)
    //put both buy & sell orders in one array to simplify rendering
    //0 Index buy 1 Index sell need to refactor later
    const completeOrderBook = orders[0].concat(orders[1])
    setOrderBook(completeOrderBook)
  }

  useEffect(() => {
    componentDidMount()
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
      <TableHeader>OrderBook</TableHeader>
      <TableContainer component={Paper}>
        <Table className={classes.table} aria-labelledby="tableTitle">
          <TableHeadStyle>
            <TableRow>
              <TableHeaderCell align="left">Expires in Minutes</TableHeaderCell>
              <TableHeaderCell align="center">Nbr Options</TableHeaderCell>
              <TableHeaderCell align="center">BID</TableHeaderCell>
              <TableHeaderCell align="center">ASK</TableHeaderCell>
              <TableHeaderCell align="center">Nbr Options</TableHeaderCell>
              <TableHeaderCell align="right">
                Expires in Minutes
              </TableHeaderCell>
            </TableRow>
          </TableHeadStyle>

          <TableBody>
            {orderBook.length > 0 ? (
              orderBook
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, index) => {
                  const labelId = `enhanced-table-${index}`

                  return (
                    <TableRow hover tabIndex={-1} key={orderBook.indexOf(row)}>
                      <TableCell
                        component="th"
                        id={labelId}
                        scope="row"
                        align="left"
                      >
                        {row.orderType === 'buy' ? row.expiry : '-'}
                      </TableCell>
                      <TableCell align="center">
                        {row.orderType == 'buy' ? row.nbrOptions : '-'}
                      </TableCell>
                      <TableCell align="center">
                        {row.orderType === 'buy' ? row.bid : '-'}
                      </TableCell>
                      <TableCell align="center">
                        {row.orderType === 'sell' ? row.ask : '-'}
                      </TableCell>
                      <TableCell align="center">
                        {row.orderType === 'sell' ? row.nbrOptions : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {row.orderType === 'sell' ? row.expiry : '-'}
                      </TableCell>
                    </TableRow>
                  )
                })
            ) : (
              <NoOrderTextDiv>No orders exist for this option</NoOrderTextDiv>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={orderBook.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </PageDiv>
  )
}
