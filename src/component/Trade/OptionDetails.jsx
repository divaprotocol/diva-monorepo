
import React from 'react'
import styled from 'styled-components'
import { getDateTime } from '../../Util/Dates';
import { Tooltip } from '@material-ui/core';
import { useSelector } from 'react-redux';
const PageDiv = styled.div `
    width: 100%;
    background-color: white;
`;


const HeaderDiv = styled.div`
    width: 100%;
    border-bottom: 1px solid rgba(224, 224, 224, 1);
    text-align: left;
    padding-bottom: 15px;
`;

const HeaderLabel = styled.label`
    font-size: 1rem;
    font-weight : bold;
    margin-left : 15px;
    color: #282c34;
`;

const FlexBoxHeader = styled.div`
    font-size: 0.9rem;
    font-weight : solid;
    text-align: left;
    padding-left: 15px; 
    color: #282c34;
`;

const FlexBoxData = styled.div`
    padding: 15px;
    font-size: 0.9rem;
    font-weight: bold;
    text-align: left;
    color: #282c34;
`;

const FlexDiv = styled.div`
    margin-top : 15px;
    display: -webkit-box;
    display: -moz-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display : flex;
    flex-direction : row;
    justify-content : flex-start;
`;

const FlexBox = styled.div`
    flex : 1;
    justify-content: flex-start;
`

const FlexSecondLineDiv = styled.div`
    width : 33.3%;
    margin-top : 15px;
    display: -webkit-box;
    display: -moz-box;
    display: -ms-flexbox;
    display: -webkit-flex;
    display : flex;
    flex-direction : row;
    justify-content : flex-start;
`;

const FlexBoxSecondLine = styled.div`
    width : 50%;
    flex : 1;
`;

const FlexToolTipBoxData = styled.div`
    margin-left : 15px;
    padding-top : 15px;
    font-size: 0.9rem;
    overflow : hidden;
    text-overflow : ellipsis;
    color: #282c34;
    font-weight: bold;
    text-align: left;
`;

const FlexBoxSecondLineData = styled.div`
    padding : 15px;
    font-size: 0.9rem;
    overflow : hidden;
    text-overflow : ellipsis;
    color: #282c34;
    font-weight: bold;
    text-align: left;
`;

function createData(option) {
    return {
       expiry : getDateTime(option.ExpiryDate).slice(0,10),
       Direction : "TBD",
       direction : option.isLong ? "Up" : "Down",
       cap : option.Cap,
       strike : option.Strike,
       inflection : option.Inflection,
       collateral : option.CollateralTokenName,
       dataFeedProvider : option.DataFeedProvider,
       dataFeedProviderAbbr : option.DataFeedProvider.length > 0 ? (String(option.DataFeedProvider).substring(0, 6) + "..." + String(option.DataFeedProvider).substring(38)) : ("n/a")
    }

}
export default function OptionDetailsFlex() {
    //Instead of calling redux to get selected option at each component level
    //we can call at root component of trade that is underlying and pass as porps
    //to each child component.
    const selectedOption = useSelector((state) => state.tradeOption.option)
    const option = createData(selectedOption);
    return(
        <PageDiv>            
            <HeaderDiv><HeaderLabel>Details</HeaderLabel></HeaderDiv>
            <FlexDiv>
                <FlexBox>
                    <FlexBoxHeader>Expires at</FlexBoxHeader>
                    <FlexBoxData>{option.expiry}</FlexBoxData>
                </FlexBox>
                <FlexBox>
                    <FlexBoxHeader>Direction</FlexBoxHeader>
                    <FlexBoxData>{option.direction}</FlexBoxData>
                </FlexBox>
                <FlexBox>
                    <FlexBoxHeader>Strike</FlexBoxHeader>
                    <FlexBoxData>{option.strike}</FlexBoxData>
                </FlexBox>
                <FlexBox>
                    <FlexBoxHeader>Inflection</FlexBoxHeader>
                    <FlexBoxData>{option.inflection}</FlexBoxData>
                </FlexBox>
                <FlexBox>
                    <FlexBoxHeader>Cap</FlexBoxHeader>
                    <FlexBoxData>{option.cap}</FlexBoxData>
                </FlexBox>
                <FlexBox>
                    <FlexBoxHeader>Collateral</FlexBoxHeader>
                    <FlexBoxData>{option.collateral}</FlexBoxData>
                </FlexBox>
            </FlexDiv>
            <FlexSecondLineDiv>
                <FlexBoxSecondLine>
                    <FlexBoxHeader>Data feed provider</FlexBoxHeader>
                    <Tooltip title={option.dataFeedProvider} arrow>
                        <FlexToolTipBoxData>{option.dataFeedProviderAbbr}</FlexToolTipBoxData>
                    </Tooltip>
                </FlexBoxSecondLine>
                <FlexBoxSecondLine>
                    <FlexBoxHeader>Data source</FlexBoxHeader>
                    <FlexBoxSecondLineData>TBD</FlexBoxSecondLineData>  
                </FlexBoxSecondLine>
            </FlexSecondLineDiv>
        </PageDiv>
    );
}
