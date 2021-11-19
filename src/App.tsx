import Header from './component/Header/Header'
import OptionsList from './component/Markets/OptionsList'
import Underlying from './component/Trade/Underlying'
import { Web3ReactProvider } from '@web3-react/core'
import Web3 from 'web3'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Create } from './component/Create'

function getLibrary(provider: any) {
  return new Web3(provider)
}

export const App = () => (
  <Web3ReactProvider getLibrary={getLibrary}>
    <Router>
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
    </Router>
  </Web3ReactProvider>
)
