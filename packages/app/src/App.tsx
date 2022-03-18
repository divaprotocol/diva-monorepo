import Header from './component/Header/Header'
import Underlying from './component/Trade/Underlying'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { CreatePool } from './component/CreatePool/CreatePool'
import Markets from './component/Markets/Markets'
import { Container } from '@mui/material'
import { MyDataFeeds } from './component/Dashboard/MyDataFeeds'
import { MyPositions } from './component/Dashboard/MyPositions'
import { useWallet } from '@web3-ui/hooks'
import { useQuery } from 'react-query'
import { Pool, queryPools } from './lib/queries'
import { request } from 'graphql-request'
import { config } from './constants'

export const App = () => {
  const wallet = useWallet()
  const chainId = wallet?.provider?.network?.chainId || 3

  const query = useQuery<{ pools: Pool[] }>(
    `pools-${chainId}`,
    () =>
      chainId != null &&
      request(config[chainId as number].divaSubgraph, queryPools)
  )
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
          <Route exact path="/dashboard/mydatafeeds">
            <MyDataFeeds />
          </Route>
          <Route exact path="/dashboard/mypositions">
            <MyPositions />
          </Route>
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
