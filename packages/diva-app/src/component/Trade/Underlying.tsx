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
import { formatUnits, parseEther } from 'ethers/lib/utils'
import { LoadingBox } from '../LoadingBox'
import Stats from './Stats'
import { getUnderlyingPrice } from '../../lib/getUnderlyingPrice'

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
                <Stats
                  pool={pool}
                  data={data}
                  chainId={chainId}
                  OptionParams={OptionParams}
                />
              </Paper>
            </Stack>
          </RightDiv>
        </Stack>
      )}
    </Container>
  )
}
