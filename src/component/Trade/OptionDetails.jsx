import React from 'react'
import styled from 'styled-components'
import { getDateTime } from '../../Util/Dates';
import { Tooltip } from '@material-ui/core';

const PageDiv = styled.div `
    width: 100%;
    background-color: white;
`;

const OptionTd = styled.td `
    padding-bottom: 5px;
    width: 45vh;
    height: 10vh;
    
`;

const OptionTdHead = styled.h5 `
    padding-right: 35px;
    padding-top: 5px;
    textAlign : "center";
`;

const OptionTdData = styled.div `
    padding-right: 35px;
`;

const OptionSecTdHead = styled.h5 `
    padding-left: 5px;
`;

const OptionSecTdData = styled.div `
    padding-left: 10px;
    width : 100px;
    overflow : hidden;
    text-overflow : ellipsis;
`;

const TableHeadTh = styled.th`
    padding-right : 40px; 
     
`;

const Table = styled.table` 
    font-size: 1rem;
    display: inline-block;
`;

const Border = styled.div`
    border-bottom : 1px solid #70D9BA;
`

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
export default function Option(props) {
    //Instead of calling redux to get selected option at each component level
    //we can call at root component of trade that is underlying and pass as porps
    //to each child component.
    const option = createData(props.optionData);
    return(
        <PageDiv>
        <Table>
            <thead>
                <tr>
                    <TableHeadTh>Details</TableHeadTh>
                    <TableHeadTh></TableHeadTh>
                    <TableHeadTh></TableHeadTh>
                    <TableHeadTh></TableHeadTh>
                    <TableHeadTh></TableHeadTh>
                    <TableHeadTh></TableHeadTh>
                </tr>
            </thead>
                <Border></Border>
            <tbody>  
                <tr>
                    <OptionTd>
                        <OptionTdHead>Expires at</OptionTdHead>
                        <OptionTdData>{option.expiry}</OptionTdData>
                    </OptionTd>
                    <OptionTd>
                        <OptionTdHead>Direction</OptionTdHead>
                        <OptionTdData>{option.direction}</OptionTdData>
                    </OptionTd>
                    <OptionTd>
                        <OptionTdHead>Strike</OptionTdHead>
                        <OptionTdData>{option.strike}</OptionTdData>
                    </OptionTd>
                    <OptionTd>
                        <OptionTdHead>Inflection</OptionTdHead>
                        <OptionTdData>{option.inflection}</OptionTdData>
                    </OptionTd>
                    <OptionTd>
                        <OptionTdHead>Cap</OptionTdHead>
                        <OptionTdData>{option.cap}</OptionTdData>
                    </OptionTd>
                    <OptionTd>
                        <OptionTdHead>Collateral</OptionTdHead>
                        <OptionTdData>{option.collateral}</OptionTdData>
                    </OptionTd>
                </tr>
                <tr>
                    <OptionTd>
                        <OptionSecTdHead>Data feed provider</OptionSecTdHead>
                        <Tooltip title={option.dataFeedProvider} arrow>
                            <OptionSecTdData>{option.dataFeedProvider}</OptionSecTdData>
                        </Tooltip>    
                    </OptionTd>
                    <OptionTd>
                        <OptionSecTdHead>Data source</OptionSecTdHead>
                        <OptionSecTdData>TBD</OptionSecTdData>
                    </OptionTd>
                </tr>    
            </tbody>
        </Table>
        </PageDiv>
    );
}
