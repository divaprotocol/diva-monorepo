import { Person } from '@mui/icons-material'
import { Box, Tab, Tabs } from '@mui/material'
import { useState } from 'react'
import { MyDataFeeds } from './MyDataFeeds'
import { MyFeeClaims } from './MyFeeClaims'
import { MyOrders } from './MyOrders'
import { MyPositions } from './MyPositions'
import { TradeHistoryTab } from './TradeHistoryTab'
const Dashboard = (props: any) => {
  const { match, history } = props
  const { params } = match
  const { page } = params

  const tabNameToIndex = {
    0: 'mypositions',
    1: 'myorders',
    2: 'mydatafeeds',
    3: 'myfeeclaims',
    4: 'tradehistory',
  }
  const indexToTabName = {
    mypositions: 0,
    myorders: 1,
    mydatafeeds: 2,
    myfeeclaims: 3,
    tradehistory: 4,
  }

  const [value, setValue] = useState(indexToTabName[page])
  const handleChange = (event: any, newValue: any) => {
    history.push(`/dashboard/${tabNameToIndex[newValue]}`)
    setValue(newValue)
  }
  return (
    <>
      <Box
        paddingX={6}
        sx={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <Person style={{ fontSize: 34, padding: 20, paddingRight: 10 }} />
        <h2> My Dashboard</h2>
      </Box>
      <Box
        paddingX={6}
        sx={{
          height: 'calc(100% - 6em)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Tabs value={value} onChange={handleChange} variant="standard">
          <Tab label="POSITIONS" />
          <Tab label="ORDERS" />
          <Tab label="DATA FEEDS" />
          <Tab label="FEE CLAIMS" />
          <Tab label="TRADE HISTORY" />
        </Tabs>
        {value === 0 && <MyPositions />}
        {value === 1 && <MyOrders />}
        {value === 2 && <MyDataFeeds />}
        {value === 3 && <MyFeeClaims />}
        {value === 4 && <TradeHistoryTab />}
      </Box>
    </>
  )
}
export default Dashboard
