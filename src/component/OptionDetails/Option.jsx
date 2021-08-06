import React from 'react'
import 'styled-components'
import styled from 'styled-components';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { useDispatch } from 'react-redux'
import { setTradingOption } from '../../Redux/TradeOption'
import {
    BrowserRouter as Router,
    useHistory,   
} from "react-router-dom";
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

export default function Option(props) {
    const row = props.row
    const dispatch = useDispatch()
    const history = useHistory();
    
    const handleRowSelect = () => {
        dispatch(setTradingOption(row))
        history.push(`trade/${row.id}`)
    }
    return(
        <TableRow onClick={handleRowSelect}>
            <TableCell component="th" scope="row">
                {row.underlying}
            </TableCell>
            <TableCell align="right">{row.payoutProfile}</TableCell>
            <TableCell align="right">{row.range}</TableCell>
            <TableCell align="right">{row.expiryDT}</TableCell>
            <TableCell align="right"><SellSpan >{row.sell}</SellSpan></TableCell>
            <TableCell align="right"><BuySpan>{row.buy}</BuySpan></TableCell>
            <TableCell align="right">{row.maxYield}</TableCell>
            <TableCell align="right">{row.tvl}</TableCell>
        </TableRow>
    );
}