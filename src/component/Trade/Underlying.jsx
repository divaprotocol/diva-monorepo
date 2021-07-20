import React from 'react';
import 'styled-components'
import styled from 'styled-components'
import OptionHeader from './OptionHeader';
import Option from './Option';
import OpenOrders from './OptionOrders'
import OrderBook from './OrderBook';
import CreateOrder from './CreateOrder';
import PayOffChart from './PayOffChart';
import './Underlying.css';

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
export default function Underlying(props) {
    return(
        
        <PageDiv>
            <PageLeftDiv>
               <LeftCompDiv>
                    <OptionHeader/>
                    <Option optionData={props.optionData}/>
                </LeftCompDiv>
                <LeftCompDiv><OpenOrders/></LeftCompDiv>
                <LeftCompDiv><OrderBook/></LeftCompDiv>
            </PageLeftDiv>
            <PageRightDiv>
                <RightCompDiv><CreateOrder/></RightCompDiv>
                <RightCompDiv><PayOffChart/></RightCompDiv>
            </PageRightDiv>
        </PageDiv>
    );
}