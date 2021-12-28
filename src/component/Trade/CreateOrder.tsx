import React, { useEffect } from 'react'
import { useAppDispatch } from '../../Redux/hooks'
import 'styled-components'
import styled from 'styled-components'
import { makeStyles } from '@mui/styles'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import BuyMarket from './Orders/BuyMarket'
import BuyLimit from './Orders/BuyLimit'
import SellLimit from './Orders/SellLimit'
import SellMarket from './Orders/SellMarket'
import {
  setMetamaskAccount,
  setResponseBuy,
  setResponseSell,
} from '../../Redux/TradeOption'
import { get0xOpenOrders } from '../../DataService/OpenOrders'
import { Pool } from '../../lib/queries'
const PageDiv = styled.div`
  width: 400px;
  height: 420px;
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
  tab: {
    width: 100,
    minWidth: 50,
  },
}))
const TabsDiv = styled.div`
  display: flex;
  justify-content: space-around;
  aligh-items: flex-start;
`

const LeftTabDiv = styled.div`
  flex: 1;
`

const RightTabDiv = styled.div`
  flex: 1;
`

const useDividerStyle = makeStyles(() => ({
  tab: {
    width: 100,
    minWidth: 50,
    borderRight: '1px solid #cccccc',
  },
}))

const useTabsBorder = makeStyles(() => ({
  tabs: {
    borderBottom: '1px solid #cccccc',
  },
}))

let accounts

export default function CreateOrder(props: {
  option: Pool
  tokenAddress: string
}) {
  //const op = useSelector((state) => state.tradeOption.option)
  const option = props.option
  const optionTokenAddress = props.tokenAddress
  const dispatch = useAppDispatch()
  const classes = useStyles()
  const dividerClass = useDividerStyle()
  const tabsClass = useTabsBorder()
  const [orderType, setOrderTypeValue] = React.useState(0)
  const [priceType, setPriceTypeValue] = React.useState(0)
  const [userAccount, setUserAccount] = React.useState('')

  const componentDidMount = async () => {
    accounts = await window.ethereum.enable()
    setUserAccount(accounts[0])
  }

  useEffect(() => {
    if (Object.keys(userAccount).length === 0) {
      componentDidMount()
    }
    dispatch(setMetamaskAccount(userAccount))
  })
  const handleOrderTypeChange = (event: any, newValue: number) => {
    setOrderTypeValue(newValue)
  }

  const handlePriceTypeChange = (event: any, newValue: number) => {
    setPriceTypeValue(newValue)
  }

  const handleDisplayOrder = async () => {
    const responseSell: any = await get0xOpenOrders(
      optionTokenAddress,
      option.collateralToken
    )
    const responseBuy: any = await get0xOpenOrders(
      option.collateralToken,
      optionTokenAddress
    )
    if (responseSell.length > 0) {
      dispatch(setResponseSell(responseSell))
    }
    if (responseBuy.length > 0) {
      dispatch(setResponseBuy(responseBuy))
    }
  }

  const renderOrderInfo = () => {
    if (orderType === 0 && priceType === 0) {
      //Buy Market
      return (
        <BuyMarket
          option={option}
          tokenAddress={optionTokenAddress}
          handleDisplayOrder={handleDisplayOrder}
        />
      )
    }
    if (orderType === 0 && priceType === 1) {
      //Buy Limit
      return (
        <BuyLimit
          option={option}
          tokenAddress={optionTokenAddress}
          handleDisplayOrder={handleDisplayOrder}
        />
      )
    }
    if (orderType === 1 && priceType === 0) {
      //Sell Market
      return (
        <SellMarket
          option={option}
          tokenAddress={optionTokenAddress}
          handleDisplayOrder={handleDisplayOrder}
        />
      )
    }
    if (orderType === 1 && priceType === 1) {
      //Sell Limit
      return (
        <SellLimit
          option={option}
          tokenAddress={optionTokenAddress}
          handleDisplayOrder={handleDisplayOrder}
        />
      )
    }
  }

  return (
    <PageDiv className={classes.root}>
      <TabsDiv>
        <LeftTabDiv>
          <Tabs
            className={tabsClass.tabs}
            value={orderType}
            onChange={handleOrderTypeChange}
            TabIndicatorProps={{ style: { backgroundColor: '#70D9BA' } }}
          >
            <Tab label="BUY" {...a11yProps(0)} className={classes.tab} />
            <Tab label="SELL" {...a11yProps(1)} className={dividerClass.tab} />
          </Tabs>
        </LeftTabDiv>

        <RightTabDiv>
          <Tabs
            className={tabsClass.tabs}
            value={priceType}
            onChange={handlePriceTypeChange}
            TabIndicatorProps={{ style: { backgroundColor: '#70D9BA' } }}
          >
            <Tab label="MARKET" {...a11yProps(0)} className={classes.tab} />
            <Tab label="LIMIT" {...a11yProps(1)} className={classes.tab} />
          </Tabs>
        </RightTabDiv>
      </TabsDiv>
      {renderOrderInfo()}
    </PageDiv>
  )
}
