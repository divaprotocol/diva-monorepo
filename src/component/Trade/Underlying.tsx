import styled from 'styled-components'
import OptionOrders from './OptionOrders'
import OrderBook from './OrderBook'
import CreateOrder from './CreateOrder'
import { Container, Paper, Stack } from '@mui/material'
import { useParams } from 'react-router'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import TradeChart from '../Graphs/TradeChart'
import OptionDetails from './OptionDetails'
import OptionHeader from './OptionHeader'
import { useQuery } from 'react-query'
import { queryPool, Pool } from '../../lib/queries'
import request from 'graphql-request'
import { theGraphUrl } from '../../constants'

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
  const params: { poolId: string; tokenType: string } = useParams()
  const breakEvenOptionPrice = 0

  const query = useQuery<{ pool: Pool }>('pool', () =>
    request(theGraphUrl, queryPool(parseInt(params.poolId)))
  )

  const pool = query.data?.pool

  if (pool == null) {
    return <div>Loading</div>
  }

  const isLong = params.tokenType === 'long'

  const OptionParams = {
    CollateralBalanceLong: 100,
    CollateralBalanceShort: 100,
    Floor: parseInt(pool.floor) / 1e18,
    Inflection: parseInt(pool.inflection) / 1e18,
    Cap: parseInt(pool.cap) / 1e18,
    TokenSupply: 200,
    IsLong: isLong,
  }

  const data = generatePayoffChartData(OptionParams)
  const tokenAddress = isLong ? pool.longToken : pool.shortToken

  return (
    <Container sx={{ paddingTop: '4em' }}>
      <Stack direction="row" spacing={2}>
        <Stack spacing={2}>
          <Paper>
            <OptionHeader
              ReferenceAsset={pool.referenceAsset}
              TokenAddress={tokenAddress}
              isLong={isLong}
              poolId={pool.id}
              tokenDecimals={pool.collateralDecimals}
            />
            <OptionDetails pool={pool} isLong={isLong} />
          </Paper>
          <Paper>
            <LeftCompFlexContainer>
              <LeftCompLeftDiv>
                <OrderBook option={pool} tokenAddress={tokenAddress} />
              </LeftCompLeftDiv>
              <LeftCompRightDiv>
                <OptionOrders option={pool} tokenAddress={tokenAddress} />
              </LeftCompRightDiv>
            </LeftCompFlexContainer>
          </Paper>
        </Stack>

        <Stack spacing={2}>
          <Paper>
            <CreateOrder option={pool} tokenAddress={tokenAddress} />
          </Paper>
          <Paper>
            <TradeChart
              data={data}
              w={380}
              h={200}
              refAsset={pool.referenceAsset}
              payOut={pool.collateralSymbol}
              isLong={OptionParams.IsLong}
              breakEven={breakEvenOptionPrice}
            />
          </Paper>
        </Stack>
      </Stack>
    </Container>
  )
}
