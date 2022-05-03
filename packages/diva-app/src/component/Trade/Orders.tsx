import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Box, Tab, Tabs } from '@mui/material'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Pool } from '../../lib/queries'
import {
  fetchOrders,
  selectOrdersByTokens,
  selectOrderView,
  selectPool,
  setIsBuy,
} from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'

const Orders = ({
  takerToken,
  pool,
  makerToken,
}: {
  pool: Pool
  takerToken: string
  makerToken: string
}) => {
  const orders = useAppSelector(selectOrdersByTokens(makerToken, takerToken))
  const dispatch = useDispatch()

  console.log({ orders })

  useEffect(() => {
    if (pool != null) {
      /**
       * fetch buy orders
       */
      dispatch(
        fetchOrders({
          takerToken,
          makerToken,
        })
      )
    }
  }, [dispatch, makerToken, pool, takerToken])

  return (
    <ul>
      {orders.map((v) => (
        <li key={v.id}>
          Maker Amount: {v.makerAmount}, Taker amount{v.takerAmount}
        </li>
      ))}
    </ul>
  )
}

export function OrderView() {
  const params: { poolId: string; tokenType: string } = useParams()
  const pool = useAppSelector((state) => selectPool(state, params.poolId))
  const isLong = params.tokenType === 'long'
  const url = `${params.poolId}/${params.tokenType}`
  const poolToken = isLong ? pool.longToken.id : pool.shortToken.id
  const collateralToken = pool?.collateralToken.id
  const dispatch = useDispatch()

  const orderView = useAppSelector(selectOrderView(url))

  const value = orderView?.isBuy ? 'buy' : 'sell'

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    dispatch(
      setIsBuy({ value: newValue === 'buy' ? true : false, orderViewKey: url })
    )
  }

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="Item One" value="buy" />
            <Tab label="Item Two" value="sell" />
          </TabList>
        </Box>
        <TabPanel value="buy">
          <Orders
            pool={pool}
            makerToken={poolToken}
            takerToken={collateralToken}
          />
        </TabPanel>
        <TabPanel value="sell">
          {' '}
          <Orders
            pool={pool}
            makerToken={collateralToken}
            takerToken={poolToken}
          />
        </TabPanel>
      </TabContext>
    </Box>
  )
}
