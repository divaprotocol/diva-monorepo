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
import { getDateTime } from '../../Util/Dates';
import Option from '../OptionDetails/Option';
import Underlying from '../Trade/Underlying';
const useStyles = makeStyles({
    table: {
      minWidth: 250,  
    },
  });

const PageDiv = styled.div `
    width: 80%;
    margin-left:10%;
    margin-right:10%;
    padding: 10px;
    margin-top:2%;
    border : '1px solid #cccccc';
    border-radius: 5px;
`;

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

function createData(id, underlying, payoutProfile, floor, strike, cap, expiry, sell,buy, maxYield, tvl) {
  var range = floor + "/" + strike +"/"+ cap;
  var expiryDT = getDateTime(expiry)
  return { id, underlying, payoutProfile, range, expiryDT, sell, buy, maxYield, tvl };
}


export default function OptionsList(props) {
    const classes = useStyles();
    const rows = props.optionData.map((option) =>
      createData(option.id,option.underlying, option.payoutProfile, option.rangeFloor, option.rangeStrike, option.rangeCap, option.expiry, option.sell, option.buy, option.maxYield, option.tvl)
    );

    const handleRowSelect = (row) => {
      return(<Underlying/>);
    }

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
                <Option key={row.id} row={row} handleRowSelect={handleRowSelect}/>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </PageDiv>
    );
}