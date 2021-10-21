import './App.css';
import React, { useState, useEffect } from 'react';
import 'styled-components'
import styled from 'styled-components'
import Header from './component/Header/Header';
import OptionsList from './component/Markets/OptionsList';
import Underlying from './component/Trade/Underlying';
import { getAllOptions } from './DataService/FireStoreDB';
import { useDispatch, useSelector } from 'react-redux';
import { setAllOptions } from './Redux/TradeOption';
import { getOptionCollateralUpdates } from './DataService/FireStoreDB';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";

const AppPage = styled.div`
  text-align: center;
  background-color: #F8F8F8;
`;

export default function App() {
  //Need to set initial state
  const [optionData, setOptionData]  = useState([])
  const dispatch = useDispatch()
  
  const componentDidMount = async () => {
    const oData = await getAllOptions()
    setOptionData(oData);
    dispatch(setAllOptions(oData))
  }

  useEffect(() => {
    if(optionData.length === 0) {
      componentDidMount()
    } 
  })

  return (
    <Router>
      <AppPage>
        <Header/>
        <Switch>
          <Route exact path="/">
            <OptionsList/>
          </Route>
          <Route path="/trade/:id">
            <Underlying/>
          </Route>
        </Switch>
      </AppPage>
    </Router>
  )  
}