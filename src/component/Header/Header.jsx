import React from 'react'
import styled from 'styled-components';
import logo from '../../Images/logo.svg'
import MenuItems from './MenuItems'

const Image = styled.img`
    height: 7vmin;
    width: 15vmin;
    margin-left: 20px;
    pointer-events: none;
`;

const AppHeader = styled.header`
    background-color:  #141534;
    min-height: 10vh;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    color: white;
`;

export default function Header(props) {
    return(
        <AppHeader>
            <Image src={logo} alt="ReactApp"/>
            <MenuItems optionData={props.optionData}/>
        </AppHeader>
    );
}