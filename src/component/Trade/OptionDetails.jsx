
import React from 'react'
import styled from 'styled-components'
import { getDateTime } from '../../Util/Dates';
import { Tooltip } from '@material-ui/core';

const PageDiv = styled.div `
    width: 100%;
    background-color: white;
`;

const HeaderDiv = styled.div`
    width: 100%;
    border-bottom: 1px solid gray;
    justify-content : start;
`;

const HeaderLabel = styled.label`
    font-size: 1rem;
    font-weight : bold;
    padding : 5px;
    margin-left : 25px;
    margin-right : 670px;
`;

const FlexBoxHeader = styled.label`
    font-size: 0.9rem;
    font-weight : bold;
`;

const FlexBoxData = styled.div`
    padding : 15px;
    font-size: 0.9rem;
`;

const FlexDiv = styled.div`
    margin-top : 15px;
    display : flex;
    flex-direction : row;
    justify-content : space-between;
`;

const FlexBox = styled.div`
    flex : 1;
`

const FlexSecondLineDiv = styled.div`
    width : 50%;
    margin-top : 15px;
    display : flex;
    flex-direction : row;
    justify-content : space-between;
`;

const FlexBoxSecondLine = styled.div`
    width : 50%;
    flex : 1;
`;
const FlexToolTipBoxData = styled.div`
    margin-left : 15px;
    padding : 15px;
    font-size: 0.9rem;
    overflow : hidden;
    text-overflow : ellipsis;
`;

const FlexBoxSecondLineData = styled.div`
    padding : 15px;
    font-size: 0.9rem;
    overflow : hidden;
    text-overflow : ellipsis;
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
       dataFeedProvider : option.DataFeedProvider
    }

}
export default function OptionDetailsFlex(props) {
    //Instead of calling redux to get selected option at each component level
    //we can call at root component of trade that is underlying and pass as porps
    //to each child component.
    const option = createData(props.optionData);
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
                    <FlexBoxHeader>Inflextion</FlexBoxHeader>
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
                        <FlexToolTipBoxData>{option.dataFeedProvider}</FlexToolTipBoxData>
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
