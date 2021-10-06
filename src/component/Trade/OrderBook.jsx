import React from 'react';
import 'styled-components';
import styled from 'styled-components';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import Web3 from 'web3';
import { get0xOpenOrders } from '../../DataService/OpenOrders';
import { getExpiryMinutesFromNow } from '../../Util/Dates';
const useStyles = makeStyles({
    table: {
      minWidth: 250,  
    },
  });

const PageDiv = styled.div `
    width: 100%;
    background-color: white;
`;

const TableHeader = styled.h4 `
    font-size: 1rem;
    color: black;
    padding-left: 15px;
    text-align: left;
`;

const TableHeadStyle = withStyles(theme => ({
    root: {
      backgroundColor: 'rgb(134,217,192)'
    }
  }))(TableHead);
  
  const TableHeaderCell = withStyles(theme => ({
    root: {
        color: '#282c34',
        fontWeight: 'solid'
    }
  }))(TableCell);

function mapOrderData(records, selectedOption) {
    const orderbook = records.map(record => {
        const order = record.order;
        const makerToken = order.makerToken
        const takerToken = order.takerToken
        const collateralToken = selectedOption.CollateralToken.toLowerCase()
        const tokenAddress = selectedOption.TokenAddress.toLowerCase()
        var orders ={}
    
        if(makerToken === collateralToken && takerToken === tokenAddress) {
            orders.expiry = getExpiryMinutesFromNow(order.expiry)  
            orders.orderType = 'buy'
            orders.id = 'buy'+records.indexOf(record)
            orders.nbrOptions = order.takerAmount / (10 ** 18)
            orders.bid = order.makerAmount / order.takerAmount * 10**(18-selectedOption.DecimalsCollateralToken)
        }
        if(makerToken === tokenAddress && takerToken === collateralToken) {
            orders.expiry = getExpiryMinutesFromNow(order.expiry)
            orders.orderType = 'sell'
            orders.id = 'sell'+records.indexOf(record)
            orders.nbrOptions = order.makerAmount / (10 ** 18)
            orders.ask = order.takerAmount / order.makerAmount * 10**(18-selectedOption.DecimalsCollateralToken)
        }
        return orders
    }
    )
    return orderbook
}

const web3 = new Web3(Web3.givenProvider);
let accounts;
export default function OrderBook() {
    const selectedOption = useSelector((state) => state.tradeOption.option)
    const responseBuy = useSelector((state) => state.tradeOption.responseBuy)
    const responseSell = useSelector((state) => state.tradeOption.responseSell)
    const [orderBook, setOrderBook] = useState([])
    const orderBookRef = useRef(orderBook);
    orderBookRef.current = orderBook

    const componentDidMount = async () => {
        const orders = []
        if(Object.keys(responseBuy).length > 0) {
            const orderBookBuy = mapOrderData(responseBuy, selectedOption)
            orders.push(orderBookBuy)
        }
        if(Object.keys(responseSell).length > 0) {
            const orderBookSell = mapOrderData(responseSell, selectedOption)
            orders.push(orderBookSell)
        }
        setOrderBook(orders)        
    }

    useEffect(() => {
        componentDidMount()
        console.log("Order book")
        
        console.log("Use effect orders")
    }, [responseBuy, responseSell])

    const classes = useStyles();
    return(
        <PageDiv>
            <TableHeader>Orderbook</TableHeader>
            <TableContainer component={Paper}>
            <Table className={classes.table} aria-label="simple table">
                <TableHeadStyle>
                <TableRow >
                    <TableHeaderCell align="left">Expires in Minutes</TableHeaderCell>
                    <TableHeaderCell align="center">Nbr Options</TableHeaderCell>
                    <TableHeaderCell align="center">BID</TableHeaderCell>
                    <TableHeaderCell align="center">ASK</TableHeaderCell>
                    <TableHeaderCell align="center">Nbr Options</TableHeaderCell>
                    <TableHeaderCell align="right">Expires in Minutes</TableHeaderCell>
                </TableRow>
                </TableHeadStyle>
                <TableBody>
                {orderBook.map((order) => (
                    order.map(orderRow =>(
                        <TableRow key={orderBook.indexOf(order)}>
                            <TableCell align="left" component="th" scope="row">
                            {orderRow.orderType === 'buy' ? orderRow.expiry : '-'}
                            </TableCell>
                            <TableCell align="center">{orderRow.orderType == 'buy' ? orderRow.nbrOptions : '-'}</TableCell>
                            <TableCell align="center">{orderRow.orderType === 'buy' ? orderRow.bid : '-'}</TableCell>
                            <TableCell align="center">{orderRow.orderType === 'sell' ? orderRow.ask : '-'}</TableCell>
                            <TableCell align="center">{orderRow.orderType === 'sell' ? orderRow.nbrOptions : '-'}</TableCell>
                            <TableCell align="right">{orderRow.orderType === 'sell' ? orderRow.expiry : '-'}</TableCell>
                        </TableRow>
                    ))
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        </PageDiv>
    );
}
