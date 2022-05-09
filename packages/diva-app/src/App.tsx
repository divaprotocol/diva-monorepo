import Header from './component/Header/Header'
import Underlying from './component/Trade/Underlying'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { CreatePool } from './component/CreatePool/CreatePool'
import Markets from './component/Markets/Markets'
import { MyDataFeeds } from './component/Dashboard/MyDataFeeds'
import { MyPositions } from './component/Dashboard/MyPositions'
import { MyFeeClaims } from './component/Dashboard/MyFeeClaims'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchPools } from './Redux/appSlice'
import { useAppSelector } from './Redux/hooks'
import Container from '@mui/material/Container'
import MenuItems from './component/Header/MenuItems'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { LoadingBox } from './component/LoadingBox'
import { MyOrders } from './component/Dashboard/MyOrders'

export const App = () => {
  const dispatch = useDispatch()
  const chainId = useAppSelector((state) => state.appSlice.chainId)

  /**
   * Pooling fetchPools
   */
  useEffect(() => {
    const pollPools = () => {
      if (chainId != null) {
        dispatch(fetchPools())
      } else {
        console.warn('chain id undefined')
      }
    }

    /**
     * pool pools every minute
     */
    const interval = setInterval(pollPools, 1000 * 30)

    pollPools()

    return () => {
      clearInterval(interval)
    }
  }, [chainId, dispatch])

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
          ) : (
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
              <Route exact path="/dashboard/myorders">
                <MyOrders />
              </Route>
              <Route exact path="/dashboard/myfeeclaims">
                <MyFeeClaims />
              </Route>
              <Route path="/:poolId/:tokenType">
                <Underlying />
              </Route>
              <Route path="/create">
                <CreatePool />
              </Route>
            </Switch>
          )}
        </Container>
      </Stack>
    </Router>
  )
}
