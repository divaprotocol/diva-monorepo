import Header from './component/Header/Header'
import Underlying from './component/Trade/Underlying'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Create } from './component/Create'
import Markets from './component/Markets/Markets'

export const App = () => {
  return (
    <Router>
      <Header />
      <Switch>
        <Route exact path="/">
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
}
