import React, { useEffect } from 'react'
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
import { fetchOrders, setIsBuy } from '../../Redux/appSlice'
import { useDispatch } from 'react-redux'
import { getUnderlyingPrice } from '../../lib/getUnderlyingPrice'
import { setBreakEven } from '../../Redux/Stats'
import { useAppSelector } from '../../Redux/hooks'
const PageDiv = styled.div`
  justify-content: center
  height: 500px;
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
    width: 96,
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

export default function CreateOrder(props: {
  option: Pool
  tokenAddress: string
  exchangeProxy: string
  chainId: number
}) {
  //const op = useSelector((state) => state.tradeOption.option)
  const option = props.option
  const dispatch = useDispatch()
  const classes = useStyles()
  const dividerClass = useDividerStyle()
  const tabsClass = useTabsBorder()
  const [orderType, setOrderTypeValue] = React.useState(0)
  const [priceType, setPriceTypeValue] = React.useState(0)
  const [usdPrice, setUsdPrice] = React.useState('')
  let responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  let responseSell = useAppSelector((state) => state.tradeOption.responseSell)
  useEffect(() => {
    getExistingOrders()
  }, [orderType, priceType])

  const handleOrderTypeChange = (event: any, newValue: number) => {
    dispatch(setIsBuy(newValue === 0))
    setOrderTypeValue(newValue)
  }

  const handlePriceTypeChange = (event: any, newValue: number) => {
    setPriceTypeValue(newValue)
  }

  const getExistingOrders = async () => {
    //updates orders components
    responseSell = await get0xOpenOrders(
      props.tokenAddress,
      option.collateralToken.id,
      props.chainId
    )
    responseBuy = await get0xOpenOrders(
      option.collateralToken.id,
      props.tokenAddress,
      props.chainId
    )
    if (responseSell.length > 0) {
      dispatch(setResponseSell(responseSell))
    }
    if (responseBuy.length > 0) {
      dispatch(setResponseBuy(responseBuy))
    }
  }

  useEffect(() => {
    getUnderlyingPrice(option.referenceAsset).then((data) => {
      if (data != null || data != undefined) {
        setUsdPrice(data)
      } else {
        //handle undefined object return
        console.log('Please handle me i am undefined')
      }
    })
  }, [option.referenceAsset])

  const renderOrderInfo = () => {
    if (orderType === 0 && priceType === 0) {
      //Buy Market
      return (
        <BuyMarket
          option={option}
          handleDisplayOrder={getExistingOrders}
          tokenAddress={props.tokenAddress}
          exchangeProxy={props.exchangeProxy}
          chainId={props.chainId}
          usdPrice={usdPrice}
        />
      )
    }
    if (orderType === 0 && priceType === 1) {
      //Buy Limit
      return (
        <BuyLimit
          handleDisplayOrder={getExistingOrders}
          option={option}
          tokenAddress={props.tokenAddress}
          exchangeProxy={props.exchangeProxy}
          chainId={props.chainId}
          usdPrice={usdPrice}
        />
      )
    }
    if (orderType === 1 && priceType === 0) {
      //Sell Market
      return (
        <SellMarket
          option={option}
          handleDisplayOrder={getExistingOrders}
          tokenAddress={props.tokenAddress}
          exchangeProxy={props.exchangeProxy}
          chainId={props.chainId}
          usdPrice={usdPrice}
        />
      )
    }
    if (orderType === 1 && priceType === 1) {
      //Sell Limit
      return (
        <SellLimit
          option={option}
          handleDisplayOrder={getExistingOrders}
          tokenAddress={props.tokenAddress}
          exchangeProxy={props.exchangeProxy}
          chainId={props.chainId}
          usdPrice={usdPrice}
        />
      )
    }
  }

  return (
    <PageDiv className={classes.root}>
      <TabsDiv className={classes.root}>
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
