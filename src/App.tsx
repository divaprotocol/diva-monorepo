import Header from './component/Header/Header'
import OptionsList from './component/Markets/OptionsList'
import Underlying from './component/Trade/Underlying'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Create } from './component/Create'

export const App = () => (
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
)
