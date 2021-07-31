import React from 'react'
import styled from 'styled-components';
import logo from '../../Images/logo.svg'
import '../../Util/Dates'

const AppHeader = styled.header`
    background-color: white;
    min-height: 10vh;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    color: #f8f8f8;
`;

const OptionTitle = styled.h2`
    font-size: 1rem;
    color: black;
    padding: 15px;
`;

const Image = styled.img`
    height: 3.5vmin;
    width: 6vmin;
    margin-left: 50px;
    pointer-events: none;
`;

export default function OptionHeader(props) {
    const header = 'WBTC/USDC';
    return(
        <AppHeader>
            <Image src={logo} alt="ReactApp"/>
            <OptionTitle>{header}</OptionTitle>
        </AppHeader>
    );
}