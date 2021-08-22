import React from 'react';
import 'styled-components';
import styled from 'styled-components';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Search from './Search';
import Option from '../OptionDetails/Option';
import { useSelector } from 'react-redux';

const useStyles = makeStyles({
    table: {
      minWidth: 250,  
    },
  });

const PageDiv = styled.div `
    width: 90%;
    margin-left:5%;
    margin-right:5%;
    padding: 10px;
    margin-top:0%;
    border : '1px solid #cccccc';
    border-radius: 5px;
`;

export default function OptionsList() {
  const classes = useStyles();
  const rows = useSelector(state => state.tradeOption.allOptions)
  return(
    <PageDiv>
      <Search/>
      <TableContainer style={{border: "1px solid #cccccc", borderRadius: "10px", backgroundColor: "white"}}>
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Underlying</TableCell>
              <TableCell align="center">Payoff profile</TableCell>
              <TableCell align="right">Strike</TableCell>
              <TableCell align="right">Inflection</TableCell>
              <TableCell align="right">Cap</TableCell>
              <TableCell align="right">Expiry</TableCell>
              <TableCell align="right">Sell</TableCell>
              <TableCell align="right">Buy</TableCell>
              <TableCell align="right">Max yield</TableCell>
              <TableCell align="right">TVL</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <Option key={row.OptionId} option={row}/>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </PageDiv>);
}