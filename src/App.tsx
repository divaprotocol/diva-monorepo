import Header from './component/Header/Header'
import Underlying from './component/Trade/Underlying'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Create } from './component/Create'
import OptionsList from './component/Markets/OptionsList'
import Markets from './component/Markets/Markets'

export const App = () => (
  <Router>
    <Header />
    <Switch>
      <Route exact path="/">
        <OptionsList />
      </Route>
      <Route exact path="/markets">
        <Markets />
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
