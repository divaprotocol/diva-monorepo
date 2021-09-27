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

function mapOrderData(response, selectedOption) {
    const records = response.data.records
    const orderbook = records.map(record => {
        const order = record.order;
        const makerToken = order.makerToken
        const takerToken = order.takerToken
        const collateralToken = selectedOption.CollateralToken.toLowerCase()
        const tokenAddress = selectedOption.TokenAddress.toLowerCase()
        var orders ={
            id : records.indexOf(record),
            expiry: getExpiryMinutesFromNow(order.expiry)
        }
        if(makerToken === collateralToken && takerToken === tokenAddress) {    
            orders.orderType = 'buy'
            orders.nbrOptions = order.takerAmount / (10 ** 18)
            orders.bid = order.makerAmount / order.takerAmount * 10**(18-selectedOption.DecimalsCollateralToken)
        }
        if(makerToken === tokenAddress && takerToken === collateralToken) {
            orders.orderType = 'sell'
            orders.nbrOptions = order.makerAmount / (10 ** 18)
            orders.ask = order.takerAmount / order.makerAmount * 10**(18-selectedOption.DecimalsCollateralToken)
        }
        return orders
    })
    return orderbook
}

export default function OrderBook(props) {
    const selectedOption = useSelector((state) => state.tradeOption.option)
    const [orderBook, setOrderBook] = useState([])
    const [response, setResponse] = useState({})
    const orderBookRef = useRef(orderBook);
    orderBookRef.current = orderBook

    const componentDidMount = async () => {
        //setTimeout(async () => {
            const response = await get0xOpenOrders(selectedOption.CollateralToken, selectedOption.TokenAddress)

            const orderBook = mapOrderData(response, selectedOption)
            if(orderBookRef.current !== orderBook) { 
                setOrderBook(orderBook)
            }
            setResponse(response)
        //}, 1000);
          
    }
    
    useEffect(() => {
        if(Object.keys(response).length === 0) {
            componentDidMount()
        }
    });

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
                    <TableRow key={order.id}>
                        <TableCell align="left" component="th" scope="row">
                            {order.orderType === 'buy' ? order.expiry : ''}
                        </TableCell>
                        <TableCell align="center">{order.orderType === 'buy' ? order.nbrOptions : '-'}</TableCell>
                        <TableCell align="center">{order.orderType === 'buy' ? order.bid : '-'}</TableCell>
                        <TableCell align="center">{order.orderType === 'sell' ? order.ask : '-'}</TableCell>
                        <TableCell align="center">{order.orderType === 'sell' ? order.nbrOptions : '-'}</TableCell>
                        <TableCell align="right">{order.orderType === 'sell' ? order.expiry : ''}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        </PageDiv>
    );
}
