import Underlying from './component/Trade/Underlying'
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom'
import { CreatePool } from './component/CreatePool/CreatePool'
import Markets from './component/Markets/Markets'
import { useAppSelector } from './Redux/hooks'
import { LoadingBox } from './component/LoadingBox'

import { config, DIVA_GOVERNANCE_ADDRESS } from './constants'
import { WrongChain } from './component/Wallet/WrongChain'
import Dashboard from './component/Dashboard/Dashboard'
import { Offer } from './component/CreatePool/Offer'
import Layout from './component/Layout'

export const App = () => {
  const chainId = useAppSelector((state) => state.appSlice.chainId)

  return (
    <Layout>
      {chainId == null ? (
        <LoadingBox />
      ) : config[chainId]?.isSupported ? (
        <Switch>
          {/* <Route exact path="/tasks">
                <Tasks />
              </Route> */}
          <Route
            exact
            path="/dashboard/:page?"
            render={(props) => <Dashboard {...props} />}
          />
          <Route path="/markets/:creatorAddress?">
            <Markets />
          </Route>
          <Route path="/offer/:chain/:hash">
            <Offer />
          </Route>
          <Route path="/:poolId/:tokenType">
            <Underlying />
          </Route>
          <Route path="/create">
            <CreatePool />
          </Route>
          <Route path="/">
            <Redirect from="/" to={`/markets/${DIVA_GOVERNANCE_ADDRESS}`} />
          </Route>
        </Switch>
      ) : (
        <WrongChain />
      )}
    </Layout>
  )
}
