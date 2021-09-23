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
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

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
                    <TableHeaderCell>Order Type</TableHeaderCell>
                    <TableHeaderCell align="center">Nbr Options</TableHeaderCell>
                    <TableHeaderCell align="center">Pay/Receive</TableHeaderCell>
                    <TableHeaderCell align="center">Price per Option</TableHeaderCell>
                    <TableHeaderCell align="right">Cancel</TableHeaderCell>
                </TableRow>
                </TableHeadStyle>
                <TableBody>
                {openOrderData.map((order) => (
                    
                    <TableRow key={order.orderType}>
                        <TableCell align="left" component="th" scope="row">
                            {order.orderType}
                        </TableCell>
                        <TableCell align="center">{order.NbrOptions}</TableCell>
                        <TableCell align="center">{order.PayReceive}</TableCell>
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