import React from 'react';
import 'styled-components'
import styled from 'styled-components'
import OptionHeader from './OptionHeader';
import OptionDetails from './OptionDetails';
import OpenOrders from './OptionOrders'
import OrderBook from './OrderBook';
import CreateOrder from './CreateOrder';
// import LineSeries from '../Graphs/LineSeries';
import TradeChart from '../Graphs/TradeChart';
import './Underlying.css';
import { useSelector } from 'react-redux'
import {
    BrowserRouter as Router,
    useHistory,
  } from "react-router-dom";
import generatePayoffChartData from '../../Graphs/DataGenerator.js';


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
    border : 2px solid white;
    margin : 25px;
    padding : 1%;
    border-radius: 15px;
    background-color : white;
`
const RightCompDiv = styled.div `
    border : 2px solid white;
    margin : 25px;
    padding : 1%;
    border-radius: 15px;
    background-color : white;
`





export default function Underlying() {
    const w = 380;
    const h = 200;

    // Call option example 
    const OptionParams = {
    CollateralBalanceLong: 20,
    CollateralBalanceShort: 10,
    Strike: 20,
    Inflection: 35,
    Cap: 40,
    TokenSupply: 30,
    IsLong: true
    };

    // Put option example 
    // const OptionParams = {
    //     collateralBalanceLong: 20,
    //     collateralBalanceShort: 10,
    //     strike: 40,
    //     inflection: 35,
    //     cap: 20,
    //     tokenSupply: 30,
    //     isLong: false
    // };

    // Generate the data array
    // const data = generatePayoffChartData(OptionParams)
    const data = generatePayoffChartData(OptionParams)    
    
    
    const selectedOption = useSelector((state) => state.tradeOption.option)
    const history = useHistory();
    if(Object.keys(selectedOption).length === 0) {
        history.push("/")
        return(<div/>)
    }

    return(
        <PageDiv>
            <PageLeftDiv>
               <LeftCompDiv>
                    <OptionHeader optionData={selectedOption}/>
                    <OptionDetails optionData={selectedOption}/>
                </LeftCompDiv>
                <LeftCompDiv><OpenOrders/></LeftCompDiv>
                <LeftCompDiv><OrderBook/></LeftCompDiv>
            </PageLeftDiv>
            <PageRightDiv>
                <RightCompDiv><CreateOrder option={selectedOption}/></RightCompDiv>
                <RightCompDiv><TradeChart data={data} w={w} h={h} isLong={OptionParams.isLong}/></RightCompDiv>
            </PageRightDiv>
        </PageDiv>
    );
}