import styled from 'styled-components'
import {
  Box,
  Card,
  Container,
  Divider,
  Paper,
  Stack,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material'
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
import { BigNumber } from 'ethers'
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
import { AddLiquidity } from '../Liquidity/AddLiquidity'
import { RemoveLiquidity } from '../Liquidity/RemoveLiquidity'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import { ReactComponent as LongPool } from '../../Images/long-trade-page-icon.svg'
import { ReactComponent as ShortPool } from '../../Images/short-trade-page-icon.svg'

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
    history.location.pathname === `/${params.poolId}/add`
      ? 'add'
      : history.location.pathname === `/${params.poolId}/remove`
      ? 'remove'
      : history.location.pathname === `/${params.poolId}/short`
      ? 'short'
      : 'long'
  const [value, setValue] = useState(currentTab)
  const breakEven = useAppSelector((state) => state.stats.breakEven)
  const chainId = useAppSelector(selectChainId)
  const { provider } = useConnectionContext()
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
  }, [value, chainId, dispatch, params.poolId])

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
  const tokenAddress = value === 'long' ? pool.longToken.id : pool.shortToken.id

  const handleChange = (event: any, newValue: string) => {
    history.push(`/${params.poolId}/${newValue}`)
    setValue(newValue)
  }
  return (
    <TabContext value={value}>
      <Box
        sx={{
          /* maxWidth: '70%',*/ paddingTop: '1em',
          ml: '10px',
        }}
      >
        <OptionHeader
          ReferenceAsset={pool.referenceAsset}
          TokenAddress={tokenAddress}
          isLong={isLong}
          poolId={pool.id}
          tokenDecimals={pool.collateralToken.decimals}
        />
        <OptionDetails pool={pool} isLong={isLong} />
      </Box>
      <Stack direction="row" mt="40px" ml="28px">
        <Box mr="20px">
          <Divider
            orientation="horizontal"
            textAlign="left"
            color="#929292"
            sx={{
              '&::before, &::after': {
                borderColor: '#929292',
              },
            }}
          >
            Trade
          </Divider>
          <TabList
            onChange={handleChange}
            variant="standard"
            sx={{
              mt: '-10px',
              height: '48px',
              alignItems: 'center',
              borderRight: 1,
              borderColor: '#929292',
            }}
          >
            <Tab
              value="long"
              icon={<LongPool />}
              iconPosition="start"
              label="Long"
              sx={{ color: '#929292' }}
            />
            <Tab
              value="short"
              icon={<ShortPool />}
              iconPosition="start"
              label="Short"
              sx={{ color: '#929292' }}
            />
          </TabList>
        </Box>
        <Box>
          <Divider
            orientation="horizontal"
            textAlign="left"
            color="#929292"
            sx={{
              '&::before, &::after': {
                borderColor: '#929292',
              },
            }}
          >
            Liquidity
          </Divider>

          <TabList
            onChange={handleChange}
            variant="standard"
            sx={{
              mt: '-10px',
              height: '48px',
              alignItems: 'center',
              borderRight: 1,
              borderColor: '#929292',
              color: '#929292',
            }}
          >
            <Tab
              value="add"
              icon={<AddOutlinedIcon />}
              iconPosition="start"
              label="Add"
              sx={{ color: '#929292' }}
            />
            <Tab
              value="remove"
              icon={<RemoveOutlinedIcon />}
              iconPosition="start"
              label="Remove"
              sx={{ color: '#929292' }}
            />
          </TabList>
        </Box>
      </Stack>
      <Divider orientation="horizontal" />
      <TabPanel value="long" sx={{ paddingBottom: '3em' }}>
        <Stack direction="row" spacing={2}>
          <LeftDiv>
            <Stack spacing={2}>
              <TradeChart
                data={data}
                refAsset={pool.referenceAsset}
                currentPrice={currentPrice}
                payOut={pool.collateralToken.symbol}
                w={650}
                h={336}
                isLong={OptionParams.IsLong}
                breakEven={breakEven}
                floor={OptionParams.Floor}
                cap={OptionParams.Cap}
                mouseHover={true}
                showBreakEven={true}
              />
              <LeftCompFlexContainer>
                <OrdersPanel
                  option={pool}
                  tokenAddress={tokenAddress}
                  exchangeProxy={exchangeProxy}
                />
              </LeftCompFlexContainer>
            </Stack>
          </LeftDiv>
          <RightDiv>
            <Stack spacing={2}>
              <CreateOrder
                option={pool}
                tokenAddress={tokenAddress}
                exchangeProxy={exchangeProxy}
                chainId={chainId}
                provider={provider}
              />
            </Stack>
          </RightDiv>
        </Stack>
      </TabPanel>
      <TabPanel value="short" sx={{ paddingBottom: '3em' }}>
        <Stack direction="row" spacing={2}>
          <LeftDiv>
            <Stack spacing={2}>
              <TradeChart
                data={data}
                refAsset={pool.referenceAsset}
                currentPrice={currentPrice}
                payOut={pool.collateralToken.symbol}
                w={650}
                h={336}
                isLong={OptionParams.IsLong}
                breakEven={breakEven}
                floor={OptionParams.Floor}
                cap={OptionParams.Cap}
                mouseHover={true}
                showBreakEven={true}
              />
              <LeftCompFlexContainer>
                <OrdersPanel
                  option={pool}
                  tokenAddress={tokenAddress}
                  exchangeProxy={exchangeProxy}
                />
              </LeftCompFlexContainer>
            </Stack>
          </LeftDiv>
          <RightDiv>
            <Stack spacing={2}>
              <CreateOrder
                option={pool}
                tokenAddress={tokenAddress}
                exchangeProxy={exchangeProxy}
                chainId={chainId}
                provider={provider}
              />
            </Stack>
          </RightDiv>
        </Stack>
      </TabPanel>
      <TabPanel value="add">
        <Stack
          direction="row"
          spacing={8}
          alignItems="center"
          my={theme.spacing(6)}
        >
          <AddLiquidity pool={pool!} />
          <Stack
            direction="column"
            spacing={4}
            maxWidth={theme.spacing(65)}
            /* sx={{ background: '#556565' }} */
          >
            <Box sx={{ ml: theme.spacing(6) }}>
              <Typography variant="h3"> Pool Status</Typography>
            </Box>
            <Box>
              {currentTab == 'add' && pool && (
                <Container sx={{ mb: theme.spacing(4) }}>
                  {pool &&
                  formatUnits(pool.capacity, pool.collateralToken.decimals) !== // TODO: drop this first == 0.0 part when migrating to new contracts
                    '0.0' &&
                  pool.capacity.toString() !==
                    '115792089237316195423570985008687907853269984665640564039457584007913129639935' ? (
                    <Container>
                      <Stack direction="row" justifyContent="space-around">
                        <Typography>Pool Capacity</Typography>
                        <Typography>
                          {pool &&
                            (formatUnits(
                              pool.capacity,
                              pool.collateralToken.decimals
                            ) === '0.0'
                              ? 'Unlimited'
                              : parseFloat(
                                  formatUnits(
                                    pool.capacity,
                                    pool.collateralToken.decimals
                                  )
                                ).toFixed(2))}{' '}
                          {pool.collateralToken.symbol}{' '}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography>Currently Utilized</Typography>
                        <Typography>
                          {pool &&
                            parseFloat(
                              formatUnits(
                                BigNumber.from(pool.collateralBalance),
                                pool.collateralToken.decimals
                              )
                            ).toFixed(2)}{' '}
                          {pool.collateralToken.symbol!}{' '}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography>Currently Utilized in %</Typography>
                        <Typography>
                          {pool &&
                            (
                              (100 *
                                parseFloat(
                                  formatUnits(
                                    BigNumber.from(pool.collateralBalance),
                                    pool.collateralToken.decimals
                                  )
                                )) /
                              parseFloat(
                                formatUnits(
                                  BigNumber.from(pool.capacity),
                                  pool.collateralToken.decimals
                                )
                              )
                            ).toFixed(2)}
                          {'%'}
                        </Typography>
                      </Stack>
                    </Container>
                  ) : (
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      ml={theme.spacing(3)}
                      /* sx={{ background: '#000000' }} */
                    >
                      <Stack direction="column" justifyContent="space-between">
                        <Typography variant="h4" color="gray">
                          Pool ID
                        </Typography>
                        <Typography variant="h2">{pool.id}</Typography>
                      </Stack>
                      <Stack direction="column" justifyContent="space-between">
                        <Typography variant="h4" color="gray">
                          Pool Capacity
                        </Typography>
                        <Typography variant="h2">Unlimited</Typography>
                      </Stack>
                      <Stack direction="column" justifyContent="space-between">
                        <Typography variant="h4" color="gray">
                          Current Pool Size
                        </Typography>
                        <Typography variant="h2">
                          {pool &&
                            parseFloat(
                              formatUnits(
                                BigNumber.from(pool.collateralBalance),
                                pool.collateralToken.decimals
                              )
                            ).toFixed(4)}{' '}
                          {pool.collateralToken.symbol!}{' '}
                        </Typography>
                      </Stack>
                    </Stack>
                  )}
                </Container>
              )}
            </Box>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="flex-start"
              sx={{
                mb: theme.spacing(4),
              }}
            >
              <Card
                sx={{
                  width: '420px',
                  border: '1px solid #383838',
                  borderRadius: '6px',
                  mt: theme.spacing(2),
                  ml: theme.spacing(6),
                  p: theme.spacing(3),
                }}
              >
                <Stack direction="column" spacing={4}>
                  <Stack direction="row" spacing={2}>
                    <LightbulbIcon
                      style={{
                        height: theme.spacing(3),
                        width: theme.spacing(3),
                        color: '#595959',
                      }}
                    />
                    <Typography variant="h3" color="gray">
                      By adding liquidity you receive long and short position
                      tokens in return which represent a claim against the
                      collateral you deposited
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <LongPool
                      style={{
                        height: theme.spacing(3),
                        width: theme.spacing(3),
                      }}
                    />
                    <Typography variant="h3" color="gray">
                      Bullish? Keep the long tokens and sell the short tokens
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <ShortPool
                      style={{
                        height: theme.spacing(3),
                        width: theme.spacing(3),
                      }}
                    />
                    <Typography variant="h3" color="gray">
                      Bearish? Keep the short tokens and sell the long tokens
                    </Typography>
                  </Stack>
                </Stack>
              </Card>
            </Box>
          </Stack>
        </Stack>
      </TabPanel>
      <TabPanel value="remove">
        <RemoveLiquidity pool={pool!} />
      </TabPanel>
    </TabContext>
  )
}
