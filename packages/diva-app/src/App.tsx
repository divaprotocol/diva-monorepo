import Header from './component/Header/Header'
import Underlying from './component/Trade/Underlying'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { CreatePool } from './component/CreatePool/CreatePool'
import Markets from './component/Markets/Markets'
import { Container, Divider, Stack } from '@mui/material'
import { MyDataFeeds } from './component/Dashboard/MyDataFeeds'
import { MyPositions } from './component/Dashboard/MyPositions'
import { MyFeeClaims } from './component/Dashboard/MyFeeClaims'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchPools, poolsSelector, setWallet } from './Redux/poolSlice'
import { useAppSelector } from './Redux/hooks'
import { useConnectionContext } from './hooks/useConnectionContext'
import MenuItems from './component/Header/MenuItems'

export const App = () => {
  const { address: userAddress, chainId } = useConnectionContext()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(
      setWallet({
        chainId,
        userAddress,
      })
    )

    const pollPools = () => {
      dispatch(fetchPools())
    }

    /**
     * pool pools every minute
     */
    const interval = setInterval(pollPools, 1000 * 60)

    pollPools()

    return () => {
      clearInterval(interval)
    }
  }, [chainId, userAddress, dispatch])

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
        </Container>
      </Stack>
    </Router>
  )
}
