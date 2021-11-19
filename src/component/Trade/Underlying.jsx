import styled from 'styled-components'
//import OpenOrders from './OptionOrders'
import OpenOrdersNew from './OptionOrdersNew'
//import OrderBook from './OrderBook';
import OrderBook from './OrderBookNew'
import CreateOrder from './CreateOrder'
// import LineSeries from '../Graphs/LineSeries';
import TradeChart from '../Graphs/TradeChart'
//import './Underlying.css';
import { useSelector } from 'react-redux'
import { useParams } from 'react-router'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { useEffect } from 'react'
import { getOption } from '../../DataService/FireStoreDB'

const PageDiv = styled.div`
  display: flex;
  justify-content: space-around;
  flex-basis: 80%;
  margin-left: 10%;
  margin-right: 10%;
  padding: 10px;
  margin-top: 2%;
  border-radius: 1%;
`

const PageLeftDiv = styled.div`
  flex: 90%;
`

const PageRightDiv = styled.div`
  flex: 30%;
  padding-left: 30px;
`

const LeftCompDiv = styled.div`
  border: 1px solid rgba(224, 224, 224, 1);
  margin: 25px;
  padding: 1%;
  border-radius: 15px;
  background: white;
`

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

const RightCompDiv = styled.div`
  border: 1px solid rgba(224, 224, 224, 1);
  margin: 25px;
  padding: 1%;
  border-radius: 15px;
`
export default function Underlying() {
  const w = 380
  const h = 200
  const selectedOption = useSelector((state) => state.tradeOption.option)
  const params = useParams()

  console.log(params)
  useEffect(() => {
    const run = async () => {
      getOption(params.id).then((val) => {
        console.log(val)
      })
    }

    run()
  }, [])

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

  return (
    <PageDiv>
      <PageLeftDiv>
        <LeftCompDiv>
          {/* <OptionHeader /> */}
          {/*<OptionDetails optionData={option} />*/}
        </LeftCompDiv>
        <LeftCompDiv>
          <LeftCompFlexContainer>
            <LeftCompLeftDiv>
              <OrderBook />
            </LeftCompLeftDiv>
            <LeftCompRightDiv>
              <OpenOrdersNew />
            </LeftCompRightDiv>
          </LeftCompFlexContainer>
        </LeftCompDiv>
      </PageLeftDiv>
      <PageRightDiv>
        <RightCompDiv>
          <CreateOrder />
        </RightCompDiv>
        <RightCompDiv>
          <TradeChart
            data={data}
            w={w}
            h={h}
            isLong={OptionParams.isLong}
            breakEven={breakEvenOptionPrice}
          />
        </RightCompDiv>
      </PageRightDiv>
    </PageDiv>
  )
}
