import Header from './component/Header/Header'
import Underlying from './component/Trade/Underlying'

import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'
import { CreatePool } from './component/CreatePool/CreatePool'
import Markets from './component/Markets/Markets'
import { Container } from '@mui/material'
import { MyDataFeeds } from './component/Dashboard/MyDataFeeds'
import { MyPositions } from './component/Dashboard/MyPositions'
import { MyFeeClaims } from './component/Dashboard/MyFeeClaims'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchPools, poolsSelector, setWallet } from './Redux/poolSlice'
import { useAppSelector } from './Redux/hooks'
import { useConnectionContext } from './hooks/useConnectionContext'

export const App = () => {
  const { provider, address: userAddress } = useConnectionContext()
  const dispatch = useDispatch()
  const chainId = provider?.network?.chainId
  const pools = useAppSelector((state) => poolsSelector(state))

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

    console.log(1)
    if (pools.length <= 0) {
      console.log(2)
      pollPools()
    }

    return () => {
      clearInterval(interval)
    }
  }, [chainId, userAddress, dispatch])

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
    </Router>
  )
}
