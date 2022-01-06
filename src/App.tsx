import Header from './component/Header/Header'
import Underlying from './component/Trade/Underlying'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import Markets from './component/Markets/Markets'
import { Create } from './component/Create'
import { Container, useTheme } from '@mui/material'
import { Dashboard } from './component/Dashboard'

export const App = () => {
  const theme = useTheme()
  return (
    <Router>
      <Header />

      <Container
        disableGutters
        sx={{ alignItems: 'left', height: '100%' }}
        maxWidth={false}
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
            <Create />
          </Route>
        </Switch>
      </Container>
    </Router>
  )
}
