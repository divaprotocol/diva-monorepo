import './App.css';
import React, { useState, useEffect } from 'react';
import 'styled-components'
import styled from 'styled-components'
import Header from './component/Header/Header';
import OptionsList from './component/Markets/OptionsList';
import Underlying from './component/Trade/Underlying';
import {optionsCount} from './DataService/FireStoreDB';
import { useDispatch } from 'react-redux';
import { setAllOptions } from './Redux/TradeOption';
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
  var oData = [];
  await optionsCount.get().then( function(responseData) {
    responseData.docs.forEach(doc => {
      oData.push(doc.data());  
    })
  })
  dispatch(setAllOptions(oData))
  setOptionData(oData);
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