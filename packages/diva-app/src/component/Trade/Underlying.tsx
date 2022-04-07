import styled from 'styled-components'
import { Container, Divider, Paper, Stack, useTheme } from '@mui/material'
import CreateOrder from './CreateOrder'
import { useParams } from 'react-router'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import TradeChart from '../Graphs/TradeChart'
import OptionDetails from './OptionDetails'
import OptionHeader from './OptionHeader'
import { useQuery } from 'react-query'
import { Pool, queryPool } from '../../lib/queries'
import request from 'graphql-request'
import { config } from '../../constants'
import { useWallet } from '@web3-ui/hooks'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import React from 'react'
import { Liquidity } from '../Liquidity/Liquidity'
import OrdersPanel from './OrdersPanel'
import Typography from '@mui/material/Typography'
import { useAppSelector } from '../../Redux/hooks'
import { useWhitelist } from '../../hooks/useWhitelist'

const LeftCompFlexContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-basis: 100%;
`
const LeftDiv = styled.div`
  width: 60%;
`
const RightDiv = styled.div`
  width: 40%;
`

export default function Underlying() {
  const params: { poolId: string; tokenType: string } = useParams()
  const [value, setValue] = React.useState(0)
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const intrinsicValue = useAppSelector((state) => state.stats.intrinsicValue)
  const maxYield = useAppSelector((state) => state.stats.maxYield)
  const breakEven = useAppSelector((state) => state.stats.breakEven)
  const breakEvenOptionPrice = 0
  const wallet = useWallet()
  const chainId = wallet?.provider?.network?.chainId || 3
  const theme = useTheme()
  const query = useQuery<{ pool: Pool }>('pool', () =>
    request(
      config[chainId as number].divaSubgraph,
      queryPool(parseInt(params.poolId))
    )
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
  const tokenAddress = isLong ? pool.longToken.id : pool.shortToken.id
  const handleChange = (event: any, newValue: any) => {
    setValue(newValue)
  }

  return (
    <Container sx={{ paddingTop: '1em' }}>
      <Tabs
        value={value}
        onChange={handleChange}
        variant="standard"
        centered
        sx={{ mb: theme.spacing(4) }}
      >
        <Tab label="Trade" />
        <Tab label="Liquidity" />
      </Tabs>
      {value ? (
        <Liquidity pool={pool} />
      ) : (
        <Stack direction="row" spacing={2}>
          <LeftDiv>
            <Stack spacing={2}>
              <Paper>
                <OptionHeader
                  ReferenceAsset={pool.referenceAsset}
                  TokenAddress={tokenAddress}
                  isLong={isLong}
                  poolId={pool.id}
                  tokenDecimals={pool.collateralToken.decimals}
                />
                <OptionDetails pool={pool} isLong={isLong} />
              </Paper>
              <Paper>
                <LeftCompFlexContainer>
                  <OrdersPanel option={pool} tokenAddress={tokenAddress} />
                </LeftCompFlexContainer>
              </Paper>
            </Stack>
          </LeftDiv>
          <RightDiv>
            <Stack spacing={2}>
              <Paper>
                <CreateOrder option={pool} tokenAddress={tokenAddress} />
              </Paper>
              <Paper>
                <TradeChart
                  data={data}
                  refAsset={pool.referenceAsset}
                  payOut={pool.collateralToken.symbol}
                  w={380}
                  h={200}
                  isLong={OptionParams.IsLong}
                  breakEven={breakEvenOptionPrice}
                />
              </Paper>
              <Typography
                sx={{
                  paddingLeft: theme.spacing(3),
                  mt: theme.spacing(1),
                }}
              >
                Buyers statistics:
              </Typography>
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ ml: theme.spacing(3), mt: theme.spacing(1) }}>
                  Max yield
                </Typography>
                <Typography sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}>
                  {maxYield}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ ml: theme.spacing(3), mt: theme.spacing(1) }}>
                  Break-even
                </Typography>
                <Typography sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}>
                  {breakEven}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ ml: theme.spacing(3), mt: theme.spacing(1) }}>
                  Intrinsic value per token
                </Typography>
                <Typography sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}>
                  {intrinsicValue}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ ml: theme.spacing(3), mt: theme.spacing(1) }}>
                  Max payout per token
                </Typography>
                <Typography sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}>
                  {maxPayout}
                </Typography>
              </Stack>
            </Stack>
          </RightDiv>
        </Stack>
      )}
    </Container>
  )
}
