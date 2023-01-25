import React from 'react'
import 'styled-components'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import Tab from '@mui/material/Tab'
import TabPanel from '@mui/lab/TabPanel'
import { Pool } from '../../lib/queries'
import OrderBook from './OrderBook'
import OptionOrders from './OptionOrders'
import { TradeHistory } from './TradeHistory'
import { Box, useTheme } from '@mui/material'

export default function OrdersPanel(props: {
  option: Pool
  tokenAddress: string
  exchangeProxy: string
}) {
  const theme = useTheme()
  const [orderType, setOrderTypeValue] = React.useState('orderbook')

  const handleOrderTypeChange = (event: any, newValue: string) => {
    setOrderTypeValue(newValue)
  }
  return (
    <Box width="100%">
      <TabContext value={orderType}>
        <TabList
          onChange={handleOrderTypeChange}
          variant="standard"
          sx={{ ml: theme.spacing(3) }}
        >
          <Tab value="orderbook" label="Order Book" />
          <Tab value="openorders" label="Your open orders" />
          <Tab value="tradehistory" label="Trade History" />
        </TabList>
        <TabPanel value="orderbook">
          <OrderBook
            option={props.option}
            tokenAddress={props.tokenAddress}
            exchangeProxy={props.exchangeProxy}
          />
        </TabPanel>
        <TabPanel value="openorders">
          <OptionOrders
            option={props.option}
            tokenAddress={props.tokenAddress}
            exchangeProxy={props.exchangeProxy}
          />
        </TabPanel>
        <TabPanel value="tradehistory">
          <TradeHistory pool={props.option} />
        </TabPanel>
      </TabContext>
    </Box>
  )
}
