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

const ImgDiv = styled.div`
    display: flex;
    justify-content: flex-end;
`;

const Image = styled.img`
    height: 2.5vmin;
    width: 2.5vmin;
    justify-content: center;
    pointer-events: none;
`;

const LeftAssetImg = styled.img`
    flex:2;
    flex-grow: 0;
    height: 2.5vmin;
    width: 2.5vmin;
    display: inline-block;
`
const RightAssetImg = styled.img`
    flex:1;
    flex-grow: 0;
    height: 2.5vmin;
    width: 2.5vmin;
    display: inline-block;
`

const refAssetImgs = [
    {refAsset : "ETH/USDT", img0 : "/images/coin-logos/ETH.png", img1 : "/images/coin-logos/USDT.png"},
    {refAsset : "UNI/DAI", img0 : "/images/coin-logos/UNI.png", img1 : "/images/coin-logos/DAI.png"}
];

function renderRefImgs(assetName) {
    if(assetName === 'ETH Gas Price') {
        return(<Image src={'/images/coin-logos/ETH_GAS.png'} alt="ReactApp"/>)
    } else {
        const asset = refAssetImgs.find(asset => asset.refAsset === assetName)
        
        return(
            <ImgDiv>
                <LeftAssetImg src={asset.img0} alt="ReactApp"/>
                <RightAssetImg src={asset.img1} alt="ReactApp"/>
            </ImgDiv>
        )
    }
}

function createOptionRowDisplay(data) {
    const expiryStr = getDateTime(data.ExpiryDate)
    const rowDisplay = {
        id : data.optionId,
        underlying : data.ReferenceAsset,
        payoutProfile : "TBD",
        strike : data.Strike,
        inflection : data.Inflection,
        cap : data.Cap,
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
            <TableCell align="right">{renderRefImgs(displayRow.underlying)}</TableCell>
            <TableCell component="th" scope="row">
                {displayRow.underlying}
            </TableCell>
            <TableCell align="center">{displayRow.payoutProfile}</TableCell>
            <TableCell align="right">{displayRow.strike}</TableCell>
            <TableCell align="right">{displayRow.inflection}</TableCell>
            <TableCell align="right">{displayRow.cap}</TableCell>
            <TableCell align="right">{displayRow.expiry}</TableCell>
            <TableCell align="right"><SellSpan >{displayRow.sell}</SellSpan></TableCell>
            <TableCell align="right"><BuySpan>{displayRow.buy}</BuySpan></TableCell>
            <TableCell align="right">{displayRow.maxYield}</TableCell>
            <TableCell align="right">{displayRow.tvl}</TableCell>
        </TableRow>
    );
}
