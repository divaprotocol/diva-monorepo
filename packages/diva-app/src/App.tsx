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
import { useAccount, useNetwork } from 'wagmi'

export const App = () => {
  const [{ data: accountData }] = useAccount({
    fetchEns: true,
  })
  const [{ data: networkData }] = useNetwork()
  const chainId = networkData.chain?.id
  const dispatch = useDispatch()
  const pools = useAppSelector((state) => poolsSelector(state))

  useEffect(() => {
    if (chainId) {
      console.log('chainId', chainId)
      dispatch(
        setWallet({
          chainId: chainId,
          userAddress: accountData?.address,
        })
      )
      dispatch(fetchPools())
    }
    const pollPools = () => {
      dispatch(fetchPools())
    }

    /**
     * pool pools every minute
     */
    const interval = setInterval(pollPools, 1000 * 60)
    if (pools.length <= 0) {
      pollPools()
    }

    return () => {
      clearInterval(interval)
    }
  }, [chainId, accountData?.address, dispatch])

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
