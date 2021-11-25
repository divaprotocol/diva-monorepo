import React from 'react'
import { useEffect, useState } from 'react'
import styled from 'styled-components'
import OptionHeader from './OptionHeader'
import OptionDetails from './OptionDetails'
//import OpenOrders from './OptionOrders'
import OpenOrdersNew from './OptionOrdersNew'
//import OrderBook from './OrderBook';
import OrderBook from './OrderBookNew'
import CreateOrder from './CreateOrder'
// import LineSeries from '../Graphs/LineSeries';
import TradeChart from '../Graphs/TradeChart'
//import './Underlying.css';
import { useSelector, useDispatch } from 'react-redux'
import { setTradingOption } from '../../Redux/TradeOption'
import { useHistory } from 'react-router-dom'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { Paper, Stack } from '@mui/material'

const LeftCompFlexContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-basis: 100%;
`
const LeftCompLeftDiv = styled.div`
  width: 40%;
  margin: 0.5%;
  height: 100%;
  align-items: stretch;
`
const LeftCompRightDiv = styled.div`
  width: 60%;
  margin: 0.5%;
  height: 100%;
  align-items: stretch;
`

export default function Underlying() {
  const w = 380
  const h = 200
  const dispatch = useDispatch()
  const selectedOption = useSelector((state) => state.tradeOption.option)
  const [option, setOption] = useState([])

  const OptionParams = {
    CollateralBalanceLong: 100,
    CollateralBalanceShort: 100,
    Strike: selectedOption.Strike,
    Inflection: selectedOption.Inflection,
    Cap: selectedOption.Cap,
    TokenSupply: 200,
    IsLong: selectedOption.IsLong,
  }

  // Temporarily
  const breakEvenOptionPrice = 0
  // Generate the data array
  // const data = generatePayoffChartData(OptionParams)
  const data = generatePayoffChartData(OptionParams)

  // breakEven: Take option payout as reference and not underlying

  const history = useHistory()
  if (Object.keys(selectedOption).length === 0) {
    // refresh logic
    const localOption = JSON.parse(window.localStorage.getItem('option'))
    setOption(localOption)
    dispatch(setTradingOption(localOption))
    history.push(`/trade/${localOption.OptionId}`)
  }

  useEffect(() => {
    //selected option stored in local browser storage to reference on page refresh.
    window.localStorage.setItem('option', JSON.stringify(selectedOption))
  })

  return (
    <Stack direction="row" spacing={2}>
      <Stack spacing={2}>
        <Paper>
          <OptionHeader />
          <OptionDetails optionData={option} />
        </Paper>

        <Paper>
          <LeftCompFlexContainer>
            <LeftCompLeftDiv>
              <OrderBook />
            </LeftCompLeftDiv>
            <LeftCompRightDiv>
              <OpenOrdersNew />
            </LeftCompRightDiv>
          </LeftCompFlexContainer>
        </Paper>
      </Stack>

      <Stack spacing={2}>
        <Paper>
          <CreateOrder />
        </Paper>
        <Paper>
          <TradeChart
            data={data}
            w={w}
            h={h}
            isLong={OptionParams.isLong}
            breakEven={breakEvenOptionPrice}
          />
        </Paper>
      </Stack>
    </Stack>
  )
}
