import Header from './component/Header/Header'
import Underlying from './component/Trade/Underlying'

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom'
import { CreatePool } from './component/CreatePool/CreatePool'
import Markets from './component/Markets/Markets'
import MenuItems from './component/Header/MenuItems'
import { useAppSelector } from './Redux/hooks'
import { LoadingBox } from './component/LoadingBox'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { config, divaGovernanceAddress } from './constants'
import { WrongChain } from './component/Wallet/WrongChain'
import { Tasks } from './component/Tasks/Tasks'
import Dashboard from './component/Dashboard/Dashboard'
import { useCustomMediaQuery } from './hooks/useCustomMediaQuery'
import { Offer } from './component/CreatePool/Offer'

export const App = () => {
  const chainId = useAppSelector((state) => state.appSlice.chainId)
  const { isMobile } = useCustomMediaQuery()

  return (
    <Router>
      <Stack height="100%" direction="row" justifyContent="space-between">
        {!isMobile && (
          <>
            <MenuItems />
            <Divider orientation="vertical" />
          </>
        )}

        <Container
          sx={{
            alignItems: 'left',
            width: '100%',
            height: '100%',
            overflow: 'auto',
          }}
          maxWidth={false}
        >
          <Header />
          {chainId == null ? (
            <LoadingBox />
          ) : config[chainId]?.isSupported ? (
            <Switch>
              <Route exact path="/tasks">
                <Tasks />
              </Route>
              <Route
                exact
                path="/dashboard/:page?"
                render={(props) => <Dashboard {...props} />}
              />
              <Route path="/markets/:creatorAddress?">
                <Markets />
              </Route>
              <Route path="/offer/:hash">
                <Offer />
              </Route>
              <Route path="/:poolId/:tokenType">
                <Underlying />
              </Route>
              <Route path="/create">
                <CreatePool />
              </Route>

              <Route path="/">
                <Redirect from="/" to={`/markets/${divaGovernanceAddress}`} />
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
