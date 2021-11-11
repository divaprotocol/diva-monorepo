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

import {
  BrowserRouter as Router,
  Switch,
  Route,
} from "react-router-dom";
import { Create } from './component/Create';

const AppPage = styled.div`
  text-align: center;
  background-color: #F8F8F8;
`;


export default function App() {
  return (
      <Router>
        <AppPage>
          <Header />
          <Switch>
            <Route exact path="/">
              <OptionsList />
            </Route>
            <Route path="/trade/:id">
              <Underlying />
            </Route>
            <Route path="/create">
              <Create />
            </Route>
          </Switch>
        </AppPage>
      </Router>
  );
}