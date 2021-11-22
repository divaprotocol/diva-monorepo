import Header from './component/Header/Header'
import OptionsList from './component/Markets/OptionsList'
import Underlying from './component/Trade/Underlying'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { Create } from './component/Create'
import { Container, useTheme } from '@mui/material'

export const App = () => {
  const theme = useTheme()
  return (
    <Router>
      <Header />

      <Container sx={{ minHeight: '100vh', paddingTop: theme.spacing(4) }}>
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
      </Container>
    </Router>
  )
}
