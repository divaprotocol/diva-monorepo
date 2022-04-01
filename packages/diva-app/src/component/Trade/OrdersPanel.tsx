import React, { useEffect } from 'react'
import { useAppDispatch } from '../../Redux/hooks'
import 'styled-components'
import styled from 'styled-components'
import { makeStyles } from '@mui/styles'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { Pool } from '../../lib/queries'
import OrderBook from './OrderBook'
import OptionOrders from './OptionOrders'

const PageDiv = styled.div`
  width: 200px;
  height: 10%;
`

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  }
}

const useStyles = makeStyles(() => ({
  root: {
    flexGrow: 1,
  },
}))

const TabsDiv = styled.div`
  display: flex;
  justify-content: flex-start;
  aligh-items: flex-start;
`

export default function OrdersPanel(props: {
  option: Pool
  tokenAddress: string
}) {
  const [orderType, setOrderTypeValue] = React.useState(0)
  const classes = useStyles()

  const handleOrderTypeChange = (event: any, newValue: number) => {
    setOrderTypeValue(newValue)
  }

  const renderOrderTables = () => {
    if (orderType === 0) {
      return (
        <OrderBook option={props.option} tokenAddress={props.tokenAddress} />
      )
    }
    if (orderType === 1) {
      return (
        <OptionOrders option={props.option} tokenAddress={props.tokenAddress} />
      )
    }
  }

  return (
    <PageDiv className={classes.root}>
      <TabsDiv>
        <Tabs
          value={orderType}
          onChange={handleOrderTypeChange}
          TabIndicatorProps={{ style: { backgroundColor: '#70D9BA' } }}
        >
          <Tab label="Order Book" {...a11yProps(0)} />
          <Tab label="Your open orders" {...a11yProps(1)} />
        </Tabs>
      </TabsDiv>
      {renderOrderTables()}
    </PageDiv>
  )
}