import styled from 'styled-components'
import { Container, Divider, Paper, Stack, useTheme } from '@mui/material'
import CreateOrder from './CreateOrder'
import { useParams } from 'react-router'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import TradeChart from '../Graphs/TradeChart'
import OptionDetails from './OptionDetails'
import OptionHeader from './OptionHeader'
import { config } from '../../constants'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import React, { useEffect } from 'react'
import { Liquidity } from '../Liquidity/Liquidity'
import OrdersPanel from './OrdersPanel'
import Typography from '@mui/material/Typography'
import { useAppSelector } from '../../Redux/hooks'
import { useDispatch } from 'react-redux'
import {
  breakEvenSelector,
  fetchPool,
  fetchUnderlyingPrice,
  intrinsicSelector,
  isBuySelector,
  maxPayoutSelector,
  maxYieldSelector,
  poolSelector,
} from '../../Redux/poolSlice'
import { formatEther } from 'ethers/lib/utils'
import { useNetwork } from 'wagmi'

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
  const isLong = params.tokenType === 'long'
  const maxPayout = useAppSelector((state) =>
    maxPayoutSelector(state, params.poolId, isLong)
  )
  const maxYield = useAppSelector((state) =>
    maxYieldSelector(state, params.poolId, isLong)
  )
  const breakEven = useAppSelector((state) =>
    breakEvenSelector(state, params.poolId, isLong)
  )
  const isBuy = useAppSelector((state) => isBuySelector(state))
  const breakEvenOptionPrice = 0
  const [{ data: networkData }] = useNetwork()
  const chainId = networkData.chain?.id || 3
  const theme = useTheme()
  const dispatch = useDispatch()
  useEffect(() => {
    dispatch(
      fetchPool({
        graphUrl: config[chainId as number].divaSubgraph,
        poolId: params.poolId,
      })
    )
  }, [chainId, params.poolId, dispatch])

  const pool = useAppSelector((state) => poolSelector(state, params.poolId))

  useEffect(() => {
    if (pool != null) dispatch(fetchUnderlyingPrice(pool))
  }, [pool, dispatch])

  const intrinsicValue = useAppSelector((state) =>
    intrinsicSelector(state, params.poolId)
  )
  const intValDisplay =
    intrinsicValue != 'n/a' && intrinsicValue != null
      ? isLong
        ? formatEther(intrinsicValue?.payoffPerLongToken)
        : formatEther(intrinsicValue?.payoffPerShortToken)
      : 'n/a'
  if (pool == null) {
    return <div>Loading</div>
  }

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
                {isBuy ? (
                  <Typography
                    sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}
                  >
                    {maxYield.buy}
                  </Typography>
                ) : (
                  <Typography
                    sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}
                  >
                    {maxYield.sell}
                  </Typography>
                )}
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
                  {intValDisplay}
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
