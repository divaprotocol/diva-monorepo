import './App.css';
import React, { useState, useEffect } from 'react';
import 'styled-components'
import styled from 'styled-components'
import axios from 'axios';
import Header from './component/Header/Header';
import OptionsList from './component/Overview/OptionsList';
import TabPanel from './component/Header/TabPanel';
import Underlying from './component/Trade/Underlying';
import firebase from "firebase/app";
import "firebase/database";
import 'firebase/firestore';
import Data from './Data.json'


const AppPage = styled.div`
  text-align: center;
  background-color: #F8F8F8;
`;

const COIN_COUNT = 10;
const formatPrice = price => parseFloat(Number(price).toFixed(4))

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

  /*const componentDidMount = async () => {
    const response = await axios.get('https://api.coinpaprika.com/v1/coins')
    const coinId = response.data.slice(0, COIN_COUNT).map(coin => coin.id)
    let tickerUrl = "https://api.coinpaprika.com/v1/tickers/"
    const promises = coinId.map((id) => axios.get(tickerUrl + id))
    const coinData = await Promise.all(promises)
    const coinPriceData = coinData.map(function(response) {
      let coin = response.data
      return{
       key : coin.id,
       name : coin.name,
       ticker : coin.symbol,
       price : formatPrice(coin.quotes.USD.price),
       balance : 0
      }
    });
    
    setOptionData(coinPriceData)
   }*/

   const componentDidMount = async () => {
    var oData = {};
    
    const firebaseConfig = {
      apiKey: "AIzaSyDdYKD_rbV2ssyZOlXYc6by6-AxgWQfpz4",
      authDomain: "divaprotocol-7afc0.firebaseapp.com",
      databaseURL: "https://divaprotocol-7afc0-default-rtdb.firebaseio.com/",
      projectId: "divaprotocol-7afc0",
      storageBucket: "divaprotocol-7afc0.appspot.com",
      messagingSenderId: "753300443145",
      appId: "1:753300443145:web:b5df12e21e8db85b6068d8",
      measurementId: "G-DNP0BT03CD"
    };

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
   }else {
      firebase.app(); // if already initialized, use that one
   }

    const database = firebase.firestore()
    
    var optionsCount = database.collection('T_Options');
    
    optionsCount.get().then( function(snapshot) {
      snapshot.docs.forEach(doc => {
        console.log(doc.data());
      })
    })

    console.log("oData - "+oData);
   }

  useEffect(() => {
    if(optionData.length == 0) {
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
        <Underlying optionData={data}/>
      </TabPanel>
    </AppPage>
  )
}