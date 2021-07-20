import React from 'react';
import 'styled-components';
import styled from 'styled-components';
import { DataGrid } from '@material-ui/data-grid'
import { Height } from '@material-ui/icons';
import  { useState, useEffect } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Search from './Search';


const useStyles = makeStyles({
    table: {
      minWidth: 250,  
    },
  });

const FlexTableContainer = withStyles((theme) => ({
    root: {
        width: "max-content"
    }
}))(TableContainer);

const PageDiv = styled.div `
    width: 80%;
    margin-left:10%;
    margin-right:10%;
    padding: 10px;
    margin-top:2%;
    border : '1px solid #cccccc';
    border-radius: 5px;
`;

const BuyTableCell = withStyles((theme) => ({
    root: {
        padding: "2px 2px",
        textAlign: "center",
        backgroundColor: "Yellow"
    }
}))(TableCell);

const BuySpan = styled.span `
    background-color: green; 
    padding: 15px;
`;

const SellSpan = styled.span `
    background-color: pink; 
    padding: 15px;
    margin: 0px auto 0px auto;
    width: 2rem%;
`;

function createData(key, name, ticker, date, price, maxYield, tvl) {
  return { key, name, ticker, date, price, price, maxYield, tvl };
}

export default function OptionsList(props) {
    const classes = useStyles();
    
    const rows = props.optionData.map((option) =>
        //key, name, ticker, price, balance
        createData(option.key, option.name, option.ticker, '2021-12-31', option.price, '5.2x', 'DAI 1m')
    );
    return(
    <PageDiv>
    <Search/>
    <TableContainer style={{border: "1px solid #cccccc", borderRadius: "10px", backgroundColor: "white"}}>
      <Table className={classes.table} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell>Underlying</TableCell>
            <TableCell align="right">Payoff profile</TableCell>
            <TableCell align="right">Range</TableCell>
            <TableCell align="right">Expiry</TableCell>
            <TableCell align="right">Sell</TableCell>
            <TableCell align="right">Buy</TableCell>
            <TableCell align="right">Max yield</TableCell>
            <TableCell align="right">TVL</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
              
            <TableRow key={row.name}>
              <TableCell component="th" scope="row">
                {row.key}
              </TableCell>
              <TableCell align="right">{row.name}</TableCell>
              <TableCell align="right">{row.ticker}</TableCell>
              <TableCell align="right">{row.date}</TableCell>
              <TableCell align="right"><SellSpan >{row.price}</SellSpan></TableCell>
              <TableCell align="right"><BuySpan>{row.price}</BuySpan></TableCell>
              <TableCell align="right">{row.maxYield}</TableCell>
              <TableCell align="right">{row.tvl}</TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    </PageDiv>
    );
}