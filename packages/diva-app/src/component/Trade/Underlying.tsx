import React, { useEffect } from 'react'
import styled from 'styled-components'
import {
  Box,
  Container,
  Typography,
  Divider,
  Paper,
  Stack,
  useTheme,
} from '@mui/material'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import CreateOrder from './CreateOrder'
import { useParams } from 'react-router'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import TradeChart from '../Graphs/TradeChart'
import OptionDetails from './OptionDetails'
import OptionHeader from './OptionHeader'
import { config } from '../../constants'
import OrdersPanel from './OrdersPanel'
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
} from '../../Redux/appSlice'
import { formatEther } from 'ethers/lib/utils'
import { LoadingBox } from '../LoadingBox'
import { Liquidity } from '../Liquidity/Liquidity'

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

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

enum TabPath {
  trade,
  liquidity,
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `vertical-tab-${index}`,
    'aria-controls': `vertical-tabpanel-${index}`,
  }
}

export default function Underlying() {
  const [value, setValue] = React.useState(0)
  const theme = useTheme()
  useEffect(() => {
    setValue(+TabPath[window.location.pathname.substring(1)] || 0)
  }, [])

  const params: { poolId: string; tokenType: string } = useParams()
  const isLong = params.tokenType === 'long'
  const maxPayout = useAppSelector((state) =>
    selectMaxPayout(state, params.poolId, isLong)
  )
  const maxYield = useAppSelector((state) =>
    selectMaxYield(state, params.poolId, isLong)
  )
  const breakEven = useAppSelector((state) =>
    selectBreakEven(state, params.poolId, isLong)
  )
  const isBuy = useAppSelector((state) => selectIsBuy(state))
  const breakEvenOptionPrice = 0
  const chainId = useAppSelector(selectChainId)
  const chainContractAddress =
    contractAddress.getContractAddressesForChainOrThrow(chainId)
  const exchangeProxy = chainContractAddress.exchangeProxy

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

  const intrinsicValue = useAppSelector((state) =>
    selectIntrinsicValue(state, params.poolId)
  )
  const intValDisplay =
    intrinsicValue != 'n/a' && intrinsicValue != null
      ? isLong
        ? formatEther(intrinsicValue?.payoffPerLongToken)
        : formatEther(intrinsicValue?.payoffPerShortToken)
      : 'n/a'

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
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    window.history.pushState(
      {},
      '',
      `/${params.poolId}/${isLong ? 'long' : 'short'}/` + TabPath[newValue]
    )
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
        <Tab label="Trade" {...a11yProps(0)} />
        <Tab label="Liquidity" {...a11yProps(1)} />
      </Tabs>
      <TabPanel value={value} index={0}>
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
      </TabPanel>
      <TabPanel value={value} index={1}>
        <Liquidity pool={pool} />
      </TabPanel>
      {/*  {value ? (
        <Liquidity pool={pool} />
      ) : (
        
      )} */}
    </Container>
  )
}
