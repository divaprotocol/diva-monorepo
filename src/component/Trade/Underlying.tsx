import { useEffect, useState } from 'react'
import styled from 'styled-components'
// import OptionHeader from './OptionHeader'
// import OptionDetails from './OptionDetails'
//import OpenOrders from './OptionOrders'
import OpenOrdersNew from './OptionOrdersNew'
//import OrderBook from './OrderBook';
import OrderBook from './OrderBookNew'
import CreateOrder from './CreateOrder'
// import LineSeries from '../Graphs/LineSeries';
//import './Underlying.css';
import { Paper, Stack } from '@mui/material'
import { DbOption, getOption } from '../../DataService/FireStoreDB'
import { useParams } from 'react-router'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import TradeChart from '../Graphs/TradeChart'
import OptionDetails from './OptionDetails'
import OptionHeader from './OptionHeader'

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
  const params: { id: string } = useParams()
  const [option, setOption] = useState<DbOption>()

  // Temporarily
  const breakEvenOptionPrice = 0

  // breakEven: Take option payout as reference and not underlying

  useEffect(() => {
    getOption(params.id).then((val) => {
      console.log(val)
      if (val != null) {
        setOption(val)
      } else {
        throw new Error(`option does not exist: ${params.id}`)
      }
    })
  }, [])

  if (option == null) {
    return <div>Loading</div>
  }

  const OptionParams = {
    CollateralBalanceLong: 100,
    CollateralBalanceShort: 100,
    Strike: option.Strike,
    Inflection: option.Inflection,
    Cap: option.Cap,
    TokenSupply: 200,
    IsLong: option.IsLong,
  }

  const data = generatePayoffChartData(OptionParams)

  return (
    <Stack direction="row" spacing={2}>
      <Stack spacing={2}>
        <Paper>
          <OptionHeader optionData={option} />
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
            w={380}
            h={200}
            isLong={OptionParams.IsLong}
            breakEven={breakEvenOptionPrice}
          />
        </Paper>
      </Stack>
    </Stack>
  )
}
