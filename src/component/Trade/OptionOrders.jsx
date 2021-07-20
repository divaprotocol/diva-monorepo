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
    padding-right : 515px;
`;

const TableHeadStyle = withStyles(theme => ({
    root: {
      backgroundColor: 'orange'
    }
  }))(TableHead);
  
  const TableHeaderCell = withStyles(theme => ({
    root: {
      color: 'white'
    }
  }))(TableCell);

export default function OpenOrdersMT(props) {
    const openOrderData = [
        {
            orderType : 'BUY',
            NbrOptions : 10,
            PayReceive : 1.9,
            pricePerOption : 0.19,
            cancel : 'Cancel'
        },
        {
            orderType : 'SELL',
            NbrOptions : 8,
            PayReceive : 1.5,
            pricePerOption : 0.1875,
            cancel : 'Cancel'
        }
    ]

    const classes = useStyles();
    return(
        <PageDiv>
            <TableHeader>Your Open Orders</TableHeader>
            <TableContainer component={Paper}>
            <Table className={classes.table} aria-label="simple table">
                <TableHeadStyle>
                
                <TableRow >
                    <TableHeaderCell>OrderType</TableHeaderCell>
                    <TableHeaderCell align="right">Nbr options</TableHeaderCell>
                    <TableHeaderCell align="right">Pay/Receive</TableHeaderCell>
                    <TableHeaderCell align="right">Price per option</TableHeaderCell>
                    <TableHeaderCell align="right">Cancel</TableHeaderCell>
                </TableRow>
                </TableHeadStyle>
                <TableBody>
                {openOrderData.map((order) => (
                    
                    <TableRow key={order.orderType}>
                        <TableCell component="th" scope="row">
                            {order.orderType}
                        </TableCell>
                        <TableCell align="right">{order.NbrOptions}</TableCell>
                        <TableCell align="right">{order.PayReceive}</TableCell>
                        <TableCell align="right">{order.pricePerOption}</TableCell>
                        <TableCell align="right">{order.cancel}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        </PageDiv>
    );
}