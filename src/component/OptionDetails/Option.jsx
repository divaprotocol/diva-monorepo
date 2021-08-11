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
import { getDateTime } from '../../Util/Dates';
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

function createOptionRowDisplay(data) {
    const rangeStr = data.Floor + "/" + data.Strike +"/"+ data.Cap; 
    const expiryStr = getDateTime(data.ExpiryDate)
    const rowDisplay = {
        id : data.optionId,
        underlying : data.ReferenceAsset,
        payoutProfile : "TBD",
        range : rangeStr,
        expiry : expiryStr,
        sell : "TBD",
        buy : "TBD",
        maxYield : "TBD",
        tvl : "TBD"
    }
    return rowDisplay;     
  }

export default function Option(props) {
    const dispatch = useDispatch()
    const history = useHistory();
    const option = props.option
    const displayRow = createOptionRowDisplay(props.option)

    const handleRowSelect = () => {
        //Set raw option Data as app state
        dispatch(setTradingOption(option))
        console.log("Id "+props.option)
        history.push(`trade/${option.OptionId}`)
    }
    return(
        <TableRow onClick={handleRowSelect}>
            <TableCell component="th" scope="row">
                {displayRow.underlying}
            </TableCell>
            <TableCell align="right">{displayRow.payoutProfile}</TableCell>
            <TableCell align="right">{displayRow.range}</TableCell>
            <TableCell align="right">{displayRow.expiry}</TableCell>
            <TableCell align="right"><SellSpan >{displayRow.sell}</SellSpan></TableCell>
            <TableCell align="right"><BuySpan>{displayRow.buy}</BuySpan></TableCell>
            <TableCell align="right">{displayRow.maxYield}</TableCell>
            <TableCell align="right">{displayRow.tvl}</TableCell>
        </TableRow>
    );
}