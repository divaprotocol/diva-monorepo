import './App.css'
import 'styled-components'
import styled from 'styled-components'
import Header from './component/Header/Header'
import OptionsList from './component/Markets/OptionsList'
import Underlying from './component/Trade/Underlying'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Create } from './component/CreateOption/CreateOption'

const AppPage = styled.div`
  text-align: center;
  background-color: #f8f8f8;
`

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
  )
}
