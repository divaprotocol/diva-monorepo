import React from 'react'
import styled from 'styled-components';
import logo_small from '../../Images/logo_small.svg'
import MenuItems from './MenuItems'

const Image = styled.img`
    height: 5vmin;
    margin-left: 20px;
    margin-right: 20px;
    pointer-events: none;
    width: 2.5%;
    height: 2.5%;
`;

const AppHeader = styled.header`
    background-color:  #141534;
    min-height: 5vh;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    color: white;
`;

export default function Header(props) {
    return(
        <AppHeader>
            <Image src={logo_small} alt="ReactApp"/>
            {/* <MenuItems/> */}
        </AppHeader>
    );
}