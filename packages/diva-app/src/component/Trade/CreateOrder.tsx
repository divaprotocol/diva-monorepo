import React, { useState, useEffect } from 'react'
import 'styled-components'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { setResponseBuy, setResponseSell } from '../../Redux/TradeOption'
import { get0xOpenOrders } from '../../DataService/OpenOrders'
import { Pool } from '../../lib/queries'
import { useDispatch } from 'react-redux'
import { getUnderlyingPrice } from '../../lib/getUnderlyingPrice'
import { Card, useTheme } from '@mui/material'
import BuyOrder from './Orders/BuyOrder'
import { TabContext, TabPanel } from '@mui/lab'
import SellOrder from './Orders/SellOrder'
import { OrderbookPriceResponse } from '../../Models/orderbook'

export default function CreateOrder(props: {
  option: Pool
  tokenAddress: string
  exchangeProxy: string
  chainId: number
  provider: any
}) {
  const option = props.option
  const dispatch = useDispatch()
  const theme = useTheme()
  const [value, setValue] = useState('buyorder')
  const [usdPrice, setUsdPrice] = useState('')

  useEffect(() => {
    getExistingOrders()
  }, [])

  const handleChange = (event: any, newValue: string) => {
    setValue(newValue)
  }

  const approve = async (amount, tokenContract, spender, owner) => {
    try {
      const approveResponse = await tokenContract.methods
        .approve(spender, amount)
        .send({ from: owner })
      if ('events' in approveResponse) {
        // Check allowance amount in events to avoid another contract call
        return approveResponse.events.Approval.returnValues.value
      } else {
        // In case the approve call does not or delay emit events, read the allowance again
        await new Promise((resolve) => setTimeout(resolve, 4000))

        // Set allowance for collateral token (<= 18 decimals)
        const allowance = await tokenContract.methods
          .allowance(owner, spender)
          .call()
        return allowance
      }
    } catch (error) {
      // If rejected by user in Metamask pop-up
      console.error('error ' + JSON.stringify(error))
      return 'undefined'
    }
  }

  const getExistingOrders = async () => {
    //updates orders components
    const responseSell: OrderbookPriceResponse[] = await get0xOpenOrders(
      props.tokenAddress,
      option.collateralToken.id,
      props.chainId,
      props.provider,
      props.exchangeProxy
    )
    const responseBuy: OrderbookPriceResponse[] = await get0xOpenOrders(
      option.collateralToken.id,
      props.tokenAddress,
      props.chainId,
      props.provider,
      props.exchangeProxy
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
      console.log('data', data)
      if (data != null || data != undefined) {
        setUsdPrice(data)
      } else {
        //handle undefined object return
        console.warn('Please handle me, I am undefined')
      }
    })
  }, [option.referenceAsset])

  // @todo Card component seems redundant here. Moving Tabs into TabPanel components seems to achieve
  // the same outcome with a bit of additional styling
  return (
    <>
      <TabContext value={value}>
        <Card
          sx={{
            width: '430px',
            border: '1px solid #383838',
            background: theme.palette.background.default,
            borderRadius: '5px',
            borderBottom: 0,
            p: theme.spacing(2),
            mt: theme.spacing(2),
          }}
        >
          <Tabs value={value} onChange={handleChange}>
            <Tab
              value="buyorder"
              label="Buy"
              sx={{ color: '#929292', fontSize: '12px' }}
            />
            <Tab
              value="sellorder"
              label="Sell"
              sx={{ color: '#929292', fontSize: '12px' }}
            />
          </Tabs>
        </Card>
        <TabPanel value="buyorder">
          <BuyOrder
            option={option}
            handleDisplayOrder={getExistingOrders}
            tokenAddress={props.tokenAddress}
            exchangeProxy={props.exchangeProxy}
            chainId={props.chainId}
            usdPrice={usdPrice}
            provider={props.provider}
            approve={approve}
          />
        </TabPanel>
        <TabPanel value="sellorder">
          <SellOrder
            option={option}
            handleDisplayOrder={getExistingOrders}
            tokenAddress={props.tokenAddress}
            exchangeProxy={props.exchangeProxy}
            chainId={props.chainId}
            usdPrice={usdPrice}
            provider={props.provider}
            approve={approve}
          />
        </TabPanel>
      </TabContext>
    </>
  )
}
