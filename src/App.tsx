import Header from './component/Header/Header'
import Underlying from './component/Trade/Underlying'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { CreatePool } from './component/CreatePool/CreatePool'
import Markets from './component/Markets/Markets'
import { Container } from '@mui/material'
import { MyDataFeeds } from './component/Dashboard/MyDataFeeds'
import { MyPositions } from './component/Dashboard/MyPositions'

export const App = () => {
  return (
    <Router>
      <Header />

      <Container
        disableGutters
        sx={{ alignItems: 'left', height: '100%', overflow: 'auto' }}
        maxWidth={false}
      >
        <Switch>
          <Route exact path="/">
            <Markets />
          </Route>
          <Route exact path="/dashboard/mydatafeeds" component={MyDataFeeds} />
          <Route exact path="/dashboard/mypositions" component={MyPositions} />
          <Route path="/:poolId/:tokenType">
            <Underlying />
          </Route>
          <Route path="/create">
            <CreatePool />
          </Route>
        </Switch>
      </Container>
    </Router>
  )
}
