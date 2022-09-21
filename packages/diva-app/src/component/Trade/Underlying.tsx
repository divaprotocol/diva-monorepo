import styled from 'styled-components'
import { Container, Divider, Paper, Stack, useTheme } from '@mui/material'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import CreateOrder from './CreateOrder'
import { useParams } from 'react-router'
import { useHistory } from 'react-router-dom'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import TradeChart from '../Graphs/TradeChart'
import OptionDetails from './OptionDetails'
import OptionHeader from './OptionHeader'
import { config } from '../../constants'
import Tab from '@mui/material/Tab'
import React, { useState, useEffect } from 'react'
import { Liquidity } from '../Liquidity/Liquidity'
import OrdersPanel from './OrdersPanel'
import { useAppSelector } from '../../Redux/hooks'
import { useConnectionContext } from '../../hooks/useConnectionContext'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
import { useDispatch } from 'react-redux'
import {
  fetchPool,
  fetchUnderlyingPrice,
  selectIsBuy,
  selectPool,
  selectChainId,
  selectUnderlyingPrice,
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
  const history = useHistory()
  const params: { poolId: string; tokenType: string } = useParams()
  const isLong = params.tokenType === 'long'
  const currentTab =
    history.location.pathname ===
    `/${params.poolId}/${isLong ? 'long' : 'short'}/liquidity`
      ? 'liquidity'
      : history.location.pathname ===
        `/${params.poolId}/${isLong ? 'long' : 'short'}/liquidity/add`
      ? 'liquidity'
      : history.location.pathname ===
        `/${params.poolId}/${isLong ? 'long' : 'short'}/liquidity/remove`
      ? 'liquidity'
      : 'trade'
  const [value, setValue] = useState(currentTab)
  const [chartWidth, setChartWidth] = useState(450)
  const breakEven = useAppSelector((state) => state.stats.breakEven)
  const chainId = useAppSelector(selectChainId)
  const { provider } = useConnectionContext()
  const chainContractAddress =
    contractAddress.getContractAddressesForChainOrThrow(chainId)
  const exchangeProxy = chainContractAddress.exchangeProxy
  const theme = useTheme()
  const dispatch = useDispatch()

  useEffect(() => {
    window.addEventListener('resize', () => {
      setChartWidth(window.innerWidth * 0.4231)
    })
  }, [])

  useEffect(() => {
    dispatch(
      fetchPool({
        graphUrl: config[chainId as number].divaSubgraph,
        poolId: params.poolId,
      })
    )
  }, [chainId, dispatch, params.poolId])

  const pool = useAppSelector((state) => selectPool(state, params.poolId))
  const currentPrice = useAppSelector(
    selectUnderlyingPrice(pool?.referenceAsset)
  )
  useEffect(() => {
    if (pool?.referenceAsset != null)
      dispatch(fetchUnderlyingPrice(pool.referenceAsset))
  }, [pool, dispatch])

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
  const data = generatePayoffChartData(OptionParams, currentPrice)
  const tokenAddress = isLong ? pool.longToken.id : pool.shortToken.id
  const handleChange = (event: any, newValue: string) => {
    history.push(`/${params.poolId}/${isLong ? 'long' : 'short'}/` + newValue)
    setValue(newValue)
  }
  return (
    <Container
      sx={{ paddingTop: '1em', paddingBottom: '3em', minHeight: '140%' }}
    >
      <TabContext value={value}>
        <TabList
          onChange={handleChange}
          variant="standard"
          centered
          sx={{ mb: theme.spacing(4) }}
        >
          <Tab value="trade" label="Trade" />
          <Tab value="liquidity" label="Liquidity" />
        </TabList>
        <TabPanel value="trade">
          <Stack
            direction={{ sm: 'column', md: 'column', lg: 'row', xl: 'row' }}
            spacing={2}
          >
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
                <Stack>
                  <Paper>
                    <TradeChart
                      data={data}
                      refAsset={pool.referenceAsset}
                      currentPrice={currentPrice}
                      payOut={pool.collateralToken.symbol}
                      w={chartWidth}
                      h={336}
                      isLong={OptionParams.IsLong}
                      breakEven={breakEven}
                      floor={OptionParams.Floor}
                      cap={OptionParams.Cap}
                      mouseHover={true}
                      showBreakEven={true}
                    />
                  </Paper>
                </Stack>
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
                    provider={provider}
                  />
                </Paper>
              </Stack>
            </RightDiv>
          </Stack>
        </TabPanel>
        <TabPanel value="liquidity">
          <Liquidity pool={pool} />
        </TabPanel>
      </TabContext>
    </Container>
  )
}
