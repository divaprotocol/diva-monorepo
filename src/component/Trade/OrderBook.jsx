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

const BackGroundColor = styled.span `
    background-color: #F8F8F8;
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

export default function OrderBook(props) {
    const openOrderData = [
        {
            Expire : '5',
            NbrOptions : 10,
            Bid : 1.9,
            Ask : 0.19,
        },
        {
            Expire : '15',
            NbrOptions : 8,
            Bid : 10,
            Ask : 19,
        },
        {
            Expire : '1',
            NbrOptions : 38,
            Bid : 110,
            Ask : 191,
        }
    ]

    const classes = useStyles();
    return(
        <PageDiv>
            <TableHeader>Orderbook</TableHeader>
            <TableContainer component={Paper}>
            <Table className={classes.table} aria-label="simple table">
                <TableHeadStyle>
                
                <TableRow >
                    <TableHeaderCell>Expires in Minutes</TableHeaderCell>
                    <TableHeaderCell align="right">Nbr options</TableHeaderCell>
                    <TableHeaderCell align="right">BID</TableHeaderCell>
                    <TableHeaderCell align="right">ASK</TableHeaderCell>
                    <TableHeaderCell align="right">Nbr options</TableHeaderCell>
                    <TableHeaderCell>Expires in Minutes</TableHeaderCell>
                </TableRow>
                </TableHeadStyle>
                <TableBody>
                {openOrderData.map((order) => (
                    
                    <TableRow key={order.Expire}>
                    <TableCell component="th" scope="row">
                        {order.Expire}
                    </TableCell>
                    <TableCell align="right">{order.NbrOptions}</TableCell>
                    <TableCell align="right">{order.Bid}</TableCell>
                    <TableCell align="right">{order.Ask}</TableCell>
                    <TableCell align="right">{order.NbrOptions}</TableCell>
                    <TableCell align="right">{order.Expire}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>
        </PageDiv>
    );
}