import React from 'react';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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
    padding-left : 15px;
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
        const orderMaker = order.maker
        const makerToken = order.makerToken
        const takerToken = order.takerToken
        const collateralToken = selectedOption.CollateralToken.toLowerCase()
        const tokenAddress = selectedOption.TokenAddress.toLowerCase()
        
        const orderType = makerToken === tokenAddress ? 'Sell' : 'Buy'
        
        const payReceive = orderMaker === tokenAddress ? order.makerAmount : order.takerAmount
        const nbrOptions = payReceive/10**18
        const payment = orderMaker === tokenAddress ? order.takerAmount/10**18 : order.makerAmount/10**18
        const pricePerOption = payment/nbrOptions

        var orders = {
            id : records.indexOf(record),
            orderType : orderType,
            nbrOptions : nbrOptions,
            payReceive : payReceive,
            paymentType : payment,
            pricePerOption : pricePerOption
         }
         return orders
        })
    return orderbook
}

export default function OpenOrdersMT() {
    const selectedOption = useSelector((state) => state.tradeOption.option)
    const userAccount = useSelector((state) => state.userMetaMaskAccount)

    const [orders, setOrders] = useState([])
    const [response, setResponse] = useState({})
    
    const componentDidMount = async () => {
        const response = await get0xOpenOrders(selectedOption.CollateralToken, selectedOption.TokenAddress)
        const orderBook = mapOrderData(response, selectedOption)
        setResponse(response)
        setOrders(orderBook)        
    }

    useEffect(() => {
        if(Object.keys(response).length === 0) {
            componentDidMount()
        }
    });
    const classes = useStyles();
    return(
        <PageDiv>
            <TableHeader>Your Open Orders</TableHeader>
            <TableContainer component={Paper}>
            <Table className={classes.table} aria-label="simple table">
                <TableHeadStyle>
                
                <TableRow >
                    <TableHeaderCell>Order Type</TableHeaderCell>
                    <TableHeaderCell align="center">Nbr Options</TableHeaderCell>
                    <TableHeaderCell align="center">Pay/Receive</TableHeaderCell>
                    <TableHeaderCell align="center">Price per Option</TableHeaderCell>
                    <TableHeaderCell align="right">Cancel</TableHeaderCell>
                </TableRow>
                </TableHeadStyle>
                <TableBody>
                {orders.map((order) => (
                    <TableRow key={order.orderType}>
                        <TableCell align="left" component="th" scope="row">
                            {order.orderType}
                        </TableCell>
                        <TableCell align="center">{order.nbrOptions}</TableCell>
                        <TableCell align="center">{order.payReceive}</TableCell>
                        <TableCell align="center">{order.pricePerOption}</TableCell>
                        <TableCell align="right">{order.cancel}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        </PageDiv>
    );
}