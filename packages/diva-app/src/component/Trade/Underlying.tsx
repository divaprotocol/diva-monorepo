import React, { useEffect } from 'react'
import styled from 'styled-components'
import {
  Container,
  Typography,
  Divider,
  Paper,
  Stack,
  useTheme,
} from '@mui/material'
import TabContext from '@mui/lab/TabContext'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import Tab from '@mui/material/Tab'
import CreateOrder from './CreateOrder'
import { useParams } from 'react-router'
import { useHistory } from 'react-router-dom'
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

enum TabPath {
  trade = 'trade',
  liquidity = 'liquidity',
}

export default function Underlying() {
  const history = useHistory()
  const params: { poolId: string; tokenType: string } = useParams()
  const isLong = params.tokenType === 'long'

  const CurrentTab =
    history.location.pathname ===
    `/${params.poolId}/${isLong ? 'long' : 'short'}/liquidity`
      ? 'liquidity'
      : 'trade'

  const [value, setValue] = React.useState(CurrentTab)
  const theme = useTheme()

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
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    history.push(
      `/${params.poolId}/${isLong ? 'long' : 'short'}/` + TabPath[newValue]
    )
    setValue(newValue)
  }

  return (
    <Container sx={{ paddingTop: '1em', paddingBottom: '3em' }}>
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
                  <Typography
                    sx={{ ml: theme.spacing(3), mt: theme.spacing(1) }}
                  >
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
                  <Typography
                    sx={{ ml: theme.spacing(3), mt: theme.spacing(1) }}
                  >
                    Break-even
                  </Typography>
                  <Typography
                    sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}
                  >
                    {breakEven}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography
                    sx={{ ml: theme.spacing(3), mt: theme.spacing(1) }}
                  >
                    Intrinsic value per token
                  </Typography>
                  <Typography
                    sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}
                  >
                    {intValDisplay}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography
                    sx={{ ml: theme.spacing(3), mt: theme.spacing(1) }}
                  >
                    Max payout per token
                  </Typography>
                  <Typography
                    sx={{ mr: theme.spacing(3), mt: theme.spacing(1) }}
                  >
                    {maxPayout}
                  </Typography>
                </Stack>
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
