import Header from './component/Header/Header'
import Underlying from './component/Trade/Underlying'

import { Container, useTheme } from '@mui/material'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { CreateOption } from './component/CreateOption/CreateOption'
import Markets from './component/Markets/Markets'
import { Dashboard } from './component/Dashboard'

export const App = () => {
  const theme = useTheme()
  return (
    <Router>
      <Header />

      <Container
        sx={{ height: '100%', paddingTop: theme.spacing(4) }}
        maxWidth="xl"
      >
        <Switch>
          <Route exact path="/">
            <Markets />
          </Route>
          <Route path="/:poolId/:tokenType">
            <Underlying />
          </Route>
          <Route exact path="/dashboard">
            <Dashboard />
          </Route>
          <Route path="/create">
            <CreateOption />
          </Route>
        </Switch>
      </Container>
    </Router>
  )
}
