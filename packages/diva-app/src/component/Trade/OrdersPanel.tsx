import React, { useEffect } from 'react'
import 'styled-components'
import styled from 'styled-components'
import { makeStyles } from '@mui/styles'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { Pool } from '../../lib/queries'
import OrderBook from './OrderBook'
import OptionOrders from './OptionOrders'
import { TradeHistory } from './TradeHistory'
import BuyOrders from './BuyOrders'
import SellOrders from './SellOrders'
import { Box, Typography } from '@mui/material'
import { useAppSelector } from '../../Redux/hooks'
import { formatUnits } from 'ethers/lib/utils'
import { get0xOpenOrders } from '../../DataService/OpenOrders'
import { setBestBuyPrice, setBestSellPrice } from '../../Redux/TradeOption'
import { useDispatch } from 'react-redux'
import { selectChainId } from '../../Redux/appSlice'
import { useConnectionContext } from '../../hooks/useConnectionContext'

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
  exchangeProxy: string
}) {
  const [orderType, setOrderTypeValue] = React.useState(0)
  const classes = useStyles()
  const bestBuyPrice = useAppSelector((state) => state.tradeOption.bestBuyPrice)
  const bestSellPrice = useAppSelector(
    (state) => state.tradeOption.bestSellPrice
  )
  const dispatch = useDispatch()
  const chainId = useAppSelector(selectChainId)
  const { provider } = useConnectionContext()
  const handleOrderTypeChange = (event: any, newValue: number) => {
    setOrderTypeValue(newValue)
  }
  useEffect(() => {
    get0xOpenOrders(
      props.option.collateralToken.id,
      props.tokenAddress,
      chainId,
      provider,
      props.exchangeProxy
    ).then((responseBuy) => {
      if (responseBuy.length > 0) {
        dispatch(
          setBestBuyPrice(
            parseFloat(
              formatUnits(
                responseBuy[0].order.makerAmount,
                props.option.collateralToken.decimals
              )
            ) *
              (1 /
                parseFloat(
                  formatUnits(
                    responseBuy[0].order.takerAmount,
                    props.option.collateralToken.decimals
                  )
                ))
          )
        )
      } else {
        dispatch(setBestBuyPrice(0))
      }
    })

    get0xOpenOrders(
      props.tokenAddress,
      props.option.collateralToken.id,
      chainId,
      provider,
      props.exchangeProxy
    ).then((responseSell) => {
      if (responseSell.length > 0) {
        dispatch(
          setBestSellPrice(
            parseFloat(
              formatUnits(
                responseSell[0].order.takerAmount,
                props.option.collateralToken.decimals
              )
            ) *
              (1 /
                parseFloat(
                  formatUnits(
                    responseSell[0].order.makerAmount,
                    props.option.collateralToken.decimals
                  )
                ))
          )
        )
      } else {
        dispatch(setBestSellPrice(0))
      }
    })
  }, [props.option])
  const renderOrderTables = () => {
    if (orderType === 0) {
      return (
        <SellOrders
          option={props.option}
          tokenAddress={props.tokenAddress}
          exchangeProxy={props.exchangeProxy}
        />
      )
    }
    if (orderType === 1) {
      return (
        <BuyOrders
          option={props.option}
          tokenAddress={props.tokenAddress}
          exchangeProxy={props.exchangeProxy}
        />
      )
    }
    if (orderType === 2) {
      return (
        <OptionOrders
          option={props.option}
          tokenAddress={props.tokenAddress}
          exchangeProxy={props.exchangeProxy}
        />
      )
    }
    if (orderType === 3) {
      return <TradeHistory pool={props.option} />
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
          <Tab label="Buy" {...a11yProps(0)} />
          <Tab label="Sell" {...a11yProps(1)} />
          <Tab label="Your open orders" {...a11yProps(2)} />
          <Tab label="Trade History" {...a11yProps(3)} />
        </Tabs>
        <Box sx={{ pr: 2 }}>
          <Typography variant="h6" color="textSecondary">
            Best buy
          </Typography>
          <Typography variant="h2">{bestSellPrice.toFixed(2)}</Typography>
        </Box>
        <Box>
          <Typography variant="h6" color="textSecondary">
            Best sell
          </Typography>
          <Typography variant="h2">{bestBuyPrice.toFixed(2)}</Typography>
        </Box>
      </TabsDiv>
      {renderOrderTables()}
    </PageDiv>
  )
}
