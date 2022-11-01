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
import { Box, Divider, Stack, Typography, useTheme } from '@mui/material'

export default function OrdersPanel(props: {
  option: Pool
  tokenAddress: string
  exchangeProxy: string
  isShowSellOrder?: boolean
}) {
  const [orderType, setOrderTypeValue] = React.useState('buy')
  const theme = useTheme()

  const handleOrderTypeChange = (event: any, newValue: string) => {
    setOrderTypeValue(newValue)
  }
  return (
    <TabContext value={orderType}>
      <Stack direction="column" width={theme.spacing(95)}>
        <Stack direction="row" justifyContent="space-between">
          <TabList onChange={handleOrderTypeChange}>
            <Tab label="Buy" value="buy" />
            <Tab label="Sell" value="sell" />
            <Tab label="Your open orders" value="openorders" />
            <Tab label="Trade History" value="tradehistory" />
          </TabList>
          <Stack direction="row" spacing={2}>
            <Box>
              <Typography variant="h4" color="gray">
                Best Buy
              </Typography>
              <Typography variant="h2" color="white">
                1.78
              </Typography>
            </Box>
            <Box>
              <Typography variant="h4" color="gray">
                Best Buy
              </Typography>
              <Typography variant="h2" color="white">
                1.78
              </Typography>
            </Box>
          </Stack>
        </Stack>
        <Divider orientation="horizontal" />
        <TabPanel value="buy">
          <OrderBook
            option={props.option}
            tokenAddress={props.tokenAddress}
            exchangeProxy={props.exchangeProxy}
          />
        </TabPanel>
        <TabPanel value="sell">
          <OrderBook
            isSellOrder
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
      </Stack>
    </TabContext>
  )
}
