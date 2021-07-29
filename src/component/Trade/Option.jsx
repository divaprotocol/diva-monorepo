import React from 'react'
import styled from 'styled-components'

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
    padding-right: 50px;
    padding-top: 5px;
`;

const OptionSecTdHead = styled.h5 `
    padding-right: 10px;
`;

const OptionTdData = styled.div `
    padding-right: 40px;
`;

const OptionSecTdData = styled.div `
    padding-right: 10px;
`;

const TableHeadTh = styled.th`
    padding-right : 40px; 
    border-bottom : solid 1px black; 
`;

const Table = styled.table` 
    font-size: 1rem;
    display: inline-block;
`;

export default function Option(props) {
    
    return(
        <PageDiv>
        <Table>
            <thead>
                <tr>
                    <TableHeadTh>Details</TableHeadTh>
                    <TableHeadTh></TableHeadTh>
                    <TableHeadTh></TableHeadTh>
                    <TableHeadTh></TableHeadTh>
                </tr>
            </thead>
            <tbody>  
                <tr>
                    <OptionTd>
                        <OptionTdHead>Expires at</OptionTdHead>
                        <OptionTdData>{props.optionData.Expiry}</OptionTdData>
                    </OptionTd>
                    <OptionTd>
                        <OptionTdHead>Range</OptionTdHead>
                        <OptionTdData>{props.optionData.Range}</OptionTdData>
                    </OptionTd>
                    <OptionTd>
                        <OptionTdHead>Direction</OptionTdHead>
                        <OptionTdData>{props.optionData.Direction}</OptionTdData>
                    </OptionTd>
                    <OptionTd>
                        <OptionTdHead>Collateral</OptionTdHead>
                        <OptionTdData>{props.optionData.Collateral}</OptionTdData>
                    </OptionTd>
                </tr>
                <tr>
                    <OptionTd>
                        <OptionSecTdHead>Data feed provider</OptionSecTdHead>
                        <OptionSecTdData>{props.optionData.DataFeedProvider}</OptionSecTdData>
                    </OptionTd>
                    <OptionTd>
                        <OptionSecTdHead>Data source</OptionSecTdHead>
                        <OptionSecTdData>{props.optionData.DataSource}</OptionSecTdData>
                    </OptionTd>
                </tr>    
            </tbody>
        </Table>
        </PageDiv>
    );
}
