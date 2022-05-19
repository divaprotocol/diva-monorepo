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
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
import { useDispatch } from 'react-redux'
import {
  selectBreakEven,
  fetchPool,
  fetchUnderlyingPrice,
  selectIntrinsicValue,
  selectIsBuy,
  selectMaxPayout,
  selectMaxYield,
  selectPool,
  selectChainId,
  selectPrice,
} from '../../Redux/appSlice'
import { formatUnits, parseEther, formatEther } from 'ethers/lib/utils'
import { LoadingBox } from '../LoadingBox'

const LeftCompFlexContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-basis: 100%;
`
const LeftDiv = styled.div`
  width: 60%;
`
const RightDiv = styled.div`
  width: 35%;
`

export default function Underlying() {
  const params: { poolId: string; tokenType: string } = useParams()
  const [value, setValue] = React.useState(0)
  const isLong = params.tokenType === 'long'
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const intrinsicValue = useAppSelector((state) => state.stats.intrinsicValue)
  const maxYield = useAppSelector((state) => state.stats.maxYield)
  const breakEven = useAppSelector((state) => state.stats.breakEven)
  // console.log('maxYield', maxYield)
  const isBuy = useAppSelector((state) => selectIsBuy(state))
  const breakEvenOptionPrice = 0
  const chainId = useAppSelector(selectChainId)
  const chainContractAddress =
    contractAddress.getContractAddressesForChainOrThrow(chainId)
  const exchangeProxy = chainContractAddress.exchangeProxy
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

  const pool = useAppSelector((state) => selectPool(state, params.poolId))

  useEffect(() => {
    if (pool?.referenceAsset != null)
      dispatch(fetchUnderlyingPrice(pool.referenceAsset))
  }, [pool, dispatch])

  // const intrinsicValue = useAppSelector((state) =>
  //   selectIntrinsicValue(state, params.poolId)
  // )
  // const intValDisplay =
  //   intrinsicValue != 'n/a' && intrinsicValue != null
  //     ? isLong
  //       ? formatEther(intrinsicValue?.payoffPerLongToken)
  //       : formatEther(intrinsicValue?.payoffPerShortToken)
  //     : 'n/a'

  // not open final value
  // open if less
  // const confirmed =
  //   pool.statusFinalReferenceValue === 'Open'
  //     ? Date.now() - Number(pool.expiryTime) * 1000 >
  //       6 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000
  //     : false
  // const usdPrice = useAppSelector((state) =>
  //   selectPrice(state, pool?.referenceAsset)
  // )
  // const priceValue = usdPrice == null ? '-' : parseEther(usdPrice).toString()
  // const inflectionValue = confirmed ? pool.inflection : priceValue
  // const finalValue =
  //   pool.statusFinalReferenceValue !== 'Open' && pool != null
  //     ? pool?.finalReferenceValue
  //     : inflectionValue
  // const intrinsicValue = useAppSelector((state) =>
  //   selectIntrinsicValue(state, params?.poolId, finalValue)
  // )
  if (pool == null) {
    return <LoadingBox />
  }

  const OptionParams = {
    CollateralBalanceLong: Number(
      formatUnits(
        pool.collateralBalanceLongInitial,
        pool.collateralToken.decimals
      )
    ),
    CollateralBalanceShort: Number(
      formatUnits(
        pool.collateralBalanceShortInitial,
        pool.collateralToken.decimals
      )
    ),
    Floor: Number(formatEther(pool.floor)),
    Inflection: Number(formatEther(pool.inflection)),
    Cap: Number(formatEther(pool.cap)),
    TokenSupply: Number(formatEther(pool.supplyInitial)),
    IsLong: isLong,
  }
  const data = generatePayoffChartData(OptionParams)
  const tokenAddress = isLong ? pool.longToken.id : pool.shortToken.id
  const handleChange = (event: any, newValue: any) => {
    setValue(newValue)
  }

  return (
    <Container sx={{ paddingTop: '1em', paddingBottom: '3em' }}>
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
                  <OrdersPanel
                    option={pool}
                    tokenAddress={tokenAddress}
                    exchangeProxy={exchangeProxy}
                  />
                </LeftCompFlexContainer>
              </Paper>
            </Stack>
          </LeftDiv>
          <RightDiv>
            <Stack spacing={2}>
              <Paper>
                <CreateOrder
                  option={pool}
                  tokenAddress={tokenAddress}
                  exchangeProxy={exchangeProxy}
                  chainId={chainId}
                />
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
                    {maxYield}
                  </Typography>
                ) : (
                  <Typography
                    sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}
                  >
                    {maxYield}
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
                  {parseFloat(intrinsicValue).toFixed(2)}
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
