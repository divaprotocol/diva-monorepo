import { Box, Tab, Tabs } from '@mui/material'

import { useState } from 'react'
import { MyDataFeeds } from './MyDataFeeds'
import { MyFeeClaims } from './MyFeeClaims'
import { MyOrders } from './MyOrders'
import { MyPositions } from './MyPositions'
export default function Dashboard() {
  const [value, setValue] = useState(0)
  const handleChange = (event: any, newValue: any) => {
    setValue(newValue)
  }
  return (
    <>
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
          <Tab label="DATAFEEDS" />
          <Tab label="FEE CLAIMS" />
        </Tabs>
        {value === 0 && <MyPositions />}
        {value === 1 && <MyOrders />}
        {value === 2 && <MyDataFeeds />}
        {value === 3 && <MyFeeClaims />}
      </Box>
    </>
  )
}
