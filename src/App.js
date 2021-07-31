import './App.css';
import React, { useState, useEffect } from 'react';
import 'styled-components'
import styled from 'styled-components'
import Header from './component/Header/Header';
import OptionsList from './component/Markets/OptionsList';
import TabPanel from './component/Header/TabPanel';
import Underlying from './component/Trade/Underlying';
import {optionsCount} from './DataService/FireStoreDB';



const AppPage = styled.div`
  text-align: center;
  background-color: #F8F8F8;
`;

export default function App() {
  const [optionData, setOptionData]  = useState([])
  const [activeTab, setActiveTab] = useState(0)

  const data = {
    Expiry: "2021-12-31",
    Range: "25k-35k",
    Direction: "Up",
    Collateral: "Dai",
    DataFeedProvider: "Uniswap v3",
    DataSource: "Uniswap"
  }

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

  const handleTabClick = (tab) => {
    setActiveTab(tab)
  }

  return (
    <AppPage>
      <Header optionData={optionData} handleTabClick={handleTabClick}/>
      <TabPanel value={activeTab} index={0}>
        <OptionsList optionData={optionData}/>
      </TabPanel>
      <TabPanel value={activeTab} index={1}>
        <Underlying optionData={optionData}/>
      </TabPanel>
    </AppPage>
  )
}