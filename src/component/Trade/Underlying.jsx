import React from 'react';
import { useEffect, useState } from 'react';
import 'styled-components'
import styled from 'styled-components'
import OptionHeader from './OptionHeader';
import OptionDetails from './OptionDetails';
//import OpenOrders from './OptionOrders'
import OpenOrdersNew from './OptionOrdersNew';
//import OrderBook from './OrderBook';
import OrderBook from './OrderBookNew';
import CreateOrder from './CreateOrder';
// import LineSeries from '../Graphs/LineSeries';
import TradeChart from '../Graphs/TradeChart';
import './Underlying.css';
import { useSelector, useDispatch } from 'react-redux'
import { setTradingOption } from '../../Redux/TradeOption';
import { setAllOptions } from '../../Redux/TradeOption';
import { setUserMetaMaskAccount } from '../../Redux/TradeOption';
import {
    BrowserRouter as Router,
    useHistory,
  } from "react-router-dom";
import generatePayoffChartData from '../../Graphs/DataGenerator.js';
import { getAllOptions } from '../../DataService/FireStoreDB'
import { mapCollateralUpdate } from '../../DataService/FireStoreDB';
import { optionLiquidity } from '../../DataService/FireStoreDB';
import firebase from "firebase/app";
import "firebase/database";
import 'firebase/firestore';

const PageDiv = styled.div `
    display: flex;
    justify-content: space-around;
    aligh-items: flex-start;
    flex-basis: 80%;
    margin-left:10%;
    margin-right:10%;
    padding: 10px;
    margin-top:2%;
    border-radius : 1%;
`;

const PageLeftDiv = styled.div`
    flex : 2;
`;

const PageRightDiv = styled.div`
    flex : 1;
    padding-left:30px;
    
`;

const LeftCompDiv = styled.div `
    border : 1px solid rgba(224,224,224,1);
    margin : 25px;
    padding : 1%;
    border-radius: 15px;
    background-color : white;
`
const RightCompDiv = styled.div `
    border : 1px solid rgba(224,224,224,1);
    margin : 25px;
    padding : 1%;
    border-radius: 15px;
    background-color : white;
`
export default function Underlying() {
    const w = 380;
    const h = 200;
    const dispatch = useDispatch()
    const selectedOption = useSelector((state) => state.tradeOption.option)
    const [option, setOption] = useState([])

    const OptionParams = {
        CollateralBalanceLong: 100,
        CollateralBalanceShort: 100,
        Strike: selectedOption.Strike,
        Inflection: selectedOption.Inflection,
        Cap: selectedOption.Cap,
        TokenSupply: 200,
        IsLong: selectedOption.IsLong
    };
    
    // Temporarily
    const breakEvenOptionPrice = 0 
    // Generate the data array
    // const data = generatePayoffChartData(OptionParams)
    const data = generatePayoffChartData(OptionParams)    
    
    // breakEven: Take option payout as reference and not underlying
    
    const history = useHistory();
    if(Object.keys(selectedOption).length === 0) {
        //Page refresh logic
        const localOption = JSON.parse(window.localStorage.getItem('option'))
        setOption(localOption)
        dispatch(setTradingOption(localOption))
        history.push(`/trade/${localOption.OptionId}`)
    }

    useEffect(() => {
        //selected option stored in local browser storage to reference on page refresh.
        window.localStorage.setItem('option', JSON.stringify(selectedOption))
    });

    return(
        <PageDiv>
            <PageLeftDiv>
               <LeftCompDiv>
                    <OptionHeader/>
                    <OptionDetails optionData={option}/>
                </LeftCompDiv>
                <LeftCompDiv><OpenOrdersNew/></LeftCompDiv>
                <LeftCompDiv><OrderBook/></LeftCompDiv>
            </PageLeftDiv>
            <PageRightDiv>
                <RightCompDiv><CreateOrder/></RightCompDiv>
                <RightCompDiv><TradeChart data={data} w={w} h={h} isLong={OptionParams.isLong} breakEven={breakEvenOptionPrice}/></RightCompDiv>
            </PageRightDiv>
        </PageDiv>
    );
}