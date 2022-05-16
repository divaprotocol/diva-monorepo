import { Container, Paper, Stack, useTheme } from '@mui/material'
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
import { useAppSelector } from '../../Redux/hooks'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
import { useDispatch } from 'react-redux'
import {
  fetchPool,
  fetchUnderlyingPrice,
  selectPool,
  selectChainId,
} from '../../Redux/appSlice'
import { LoadingBox } from '../LoadingBox'
import { OrderView } from './Orders'

export default function Underlying() {
  const params: { poolId: string; tokenType: string } = useParams()
  const [value, setValue] = React.useState(0)
  const isLong = params.tokenType === 'long'
  const breakEvenOptionPrice = 0
  const chainId = useAppSelector(selectChainId)
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
    if (pool?.referenceAsset != null) {
      dispatch(fetchUnderlyingPrice(pool.referenceAsset))
    }
  }, [pool, dispatch])

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
          <Stack spacing={2} width={'100%'}>
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
            <OrderView />
          </Stack>
          <Stack spacing={2}>
            <CreateOrder />
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
          </Stack>
        </Stack>
      )}
    </Container>
  )
}
