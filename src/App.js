import './App.css';
import React, { useState, useEffect } from 'react';
import 'styled-components'
import styled from 'styled-components'
import Header from './component/Header/Header';
import OptionsList from './component/Markets/OptionsList';
import Underlying from './component/Trade/Underlying';
import {optionsCount} from './DataService/FireStoreDB';

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
  const [optionData, setOptionData]  = useState([])

  const componentDidMount = async () => {
  var oData = [];
  await optionsCount.get().then( function(responseData) {
    responseData.docs.forEach(doc => {
      let data = doc.data();  
      const odata =
        {
          id : oData.length,
          underlying : data.ReferenceAsset,
          payoutProfile : "TBD",
          rangeFloor : data.Floor,
          rangeStrike : data.Strike,
          rangeCap : data.Cap,
          expiry : data.ExpiryDate,
          sell : "TBD",
          buy : "TBD",
          maxYield : "TBD",
          tvl : "TBD"
        }      
      oData.push(odata);  
    })
  })
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
        <Header optionData={optionData}/>
        <Switch>
          <Route exact path="/">
            <OptionsList optionData={optionData} />
          </Route>
          <Route path="/trade/:id">
            <Underlying/>
          </Route>
        </Switch>
      </AppPage>
    </Router>
  )  
}