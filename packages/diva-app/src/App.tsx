import Header from './component/Header/Header'
import Underlying from './component/Trade/Underlying'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { CreatePool } from './component/CreatePool/CreatePool'
import Markets from './component/Markets/Markets'
import { useEffect } from 'react'
import { fetchPools } from './Redux/appSlice'
import MenuItems from './component/Header/MenuItems'
import { useAppSelector } from './Redux/hooks'
import { LoadingBox } from './component/LoadingBox'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { config } from './constants'
import { WrongChain } from './component/Wallet/WrongChain'
import { Tasks } from './component/Tasks/Tasks'
import Dashboard from './component/Dashboard/Dashboard'

export const App = () => {
  const chainId = useAppSelector((state) => state.appSlice.chainId)
  return (
    <Router>
      <Stack height="100%" direction="row" justifyContent="space-between">
        <MenuItems />
        <Divider orientation="vertical" />
        <Container
          disableGutters
          sx={{ alignItems: 'left', height: '100%', overflow: 'auto' }}
          maxWidth={false}
        >
          <Header />
          {chainId == null ? (
            <LoadingBox />
          ) : config[chainId] ? (
            <Switch>
              <Route exact path="/">
                <Markets />
              </Route>
              <Route exact path="/tasks">
                <Tasks />
              </Route>
              <Route
                exact
                path="/dashboard/:page?"
                render={(props) => <Dashboard {...props} />}
              />
              <Route path="/:poolId/:tokenType">
                <Underlying />
              </Route>
              <Route path="/create">
                <CreatePool />
              </Route>
            </Switch>
          ) : (
            <WrongChain />
          )}
        </Container>
      </Stack>
    </Router>
  )
}
