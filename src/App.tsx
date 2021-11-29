import Header from './component/Header/Header'
import Underlying from './component/Trade/Underlying'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import Markets from './component/Markets/Markets'
import { Create } from './component/Create'
import { Container, useTheme } from '@mui/material'

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
          <Route path="/trade/:id">
            <Underlying />
          </Route>
          <Route path="/create">
            <Create />
          </Route>
        </Switch>
      </Container>
    </Router>
  )
}
