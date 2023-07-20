import { Box, Divider, Stack, useTheme } from '@mui/material'
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
import { useState, useEffect } from 'react'
import OrdersPanel from './OrdersPanel'
import { useAppSelector } from '../../Redux/hooks'
import { useConnectionContext } from '../../hooks/useConnectionContext'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
import { useDispatch } from 'react-redux'
import {
  fetchPool,
  fetchUnderlyingPrice,
  selectPool,
  selectChainId,
  selectUnderlyingPrice,
} from '../../Redux/appSlice'
import { formatUnits, formatEther } from 'ethers/lib/utils'
import { LoadingBox } from '../LoadingBox'
import { AddLiquidity } from '../Liquidity/AddLiquidity'
import { RemoveLiquidity } from '../Liquidity/RemoveLiquidity'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined'
import { ReactComponent as LongPool } from '../../Images/long-trade-page-icon.svg'
import { ReactComponent as ShortPool } from '../../Images/short-trade-page-icon.svg'

export const fetchIpfs = async (asset, callback) => {
  try {
    const response = await fetch(asset)
    if (!response.ok) throw new Error(response.statusText)
    const json = await response.json()
    if (json.title !== undefined) {
      callback(json.title)
    }
  } catch (error) {
    console.error(`Failed to fetch asset: ${error.message}`)
  }
}

const StyledTabList = ({ onChange, tabs }) => (
  <TabList
    onChange={onChange}
    variant="standard"
    sx={{
      mt: '-10px',
      height: '48px',
      alignItems: 'center',
      borderRight: 1,
      borderColor: '#929292',
    }}
  >
    {tabs.map((tab) => (
      <Tab
        value={tab.value}
        icon={tab.icon}
        iconPosition="start"
        label={tab.label}
        sx={{ color: '#929292' }}
        key={tab.value}
      />
    ))}
  </TabList>
)

const StyledDivider = ({ label }) => (
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
    {label}
  </Divider>
)

export default function Underlying() {
  const history = useHistory()
  const params: { poolId: string; tokenType: string } = useParams()
  const isLong = params.tokenType === 'long'

  const pathsToTab = {
    [`/${params.poolId}/add`]: 'add',
    [`/${params.poolId}/remove`]: 'remove',
    [`/${params.poolId}/short`]: 'short',
  }
  const currentTab = pathsToTab[history.location.pathname] || 'long'

  const [value, setValue] = useState(currentTab)
  const breakEven = useAppSelector((state) => state.stats.breakEven)
  const chainId = useAppSelector(selectChainId)
  const { provider } = useConnectionContext()
  const chainContractAddress =
    contractAddress.getContractAddressesForChainOrThrow(chainId)
  const exchangeProxy = chainContractAddress.exchangeProxy
  const theme = useTheme()
  const dispatch = useDispatch()
  const [headerTitle, setHeaderTitle] = useState<string>('')

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
    if (pool?.referenceAsset !== null) {
      dispatch(fetchUnderlyingPrice(pool.referenceAsset))
      if (pool.referenceAsset.endsWith('.json')) {
        fetchIpfs(pool.referenceAsset, setHeaderTitle)
      }
    }
  }, [pool.referenceAsset, dispatch])

  if (pool === null) {
    return <LoadingBox />
  }

  const OptionParams = {
    Gradient: Number(formatUnits(pool.gradient, pool.collateralToken.decimals)),
    Floor: Number(formatEther(pool.floor)),
    Inflection: Number(formatEther(pool.inflection)),
    Cap: Number(formatEther(pool.cap)),
    IsLong: isLong,
  }
  const data = generatePayoffChartData(OptionParams, currentPrice)
  const tokenAddress = value === 'long' ? pool.longToken.id : pool.shortToken.id
  const tokenSymbol =
    value === 'long' ? pool.longToken.symbol : pool.shortToken.symbol

  const handleChange = (event: any, newValue: string) => {
    setValue(newValue)
    history.push(`/${params.poolId}/${newValue}`)
  }

  return (
    <TabContext value={value}>
      <Box
        sx={{
          paddingTop: '1em',
          ml: '10px',
        }}
      >
        <OptionHeader
          ReferenceAsset={pool.referenceAsset}
          TokenAddress={tokenAddress}
          tokenSymbol={tokenSymbol}
          poolId={pool.id}
          tokenDecimals={pool.collateralToken.decimals}
          JsonHeaderTitle={headerTitle}
        />
        <OptionDetails pool={pool} isLong={isLong} />
      </Box>
      <Stack direction="row" mt="40px" ml="28px">
        <Box mr="20px">
          <StyledDivider label="Trade" />
          <StyledTabList
            onChange={handleChange}
            tabs={[
              { value: 'long', icon: <LongPool />, label: 'Long' },
              { value: 'short', icon: <ShortPool />, label: 'Short' },
            ]}
          />
        </Box>
        <Box>
          <StyledDivider label="Liquidity" />
          <StyledTabList
            onChange={handleChange}
            tabs={[
              { value: 'add', icon: <AddOutlinedIcon />, label: 'Add' },
              {
                value: 'remove',
                icon: <RemoveOutlinedIcon />,
                label: 'Remove',
              },
            ]}
          />
        </Box>
      </Stack>
      <Divider orientation="horizontal" sx={{ alignItems: { xl: 'center' } }} />
      <TabPanel value="long" sx={{ paddingBottom: '3em' }}>
        <Stack direction="row" spacing={theme.spacing(15)}>
          <Stack
            direction="column"
            width="50%"
            /* {{ lg: '50%', xl: '30%' }} */
            spacing={2}
          >
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
            <OrdersPanel
              option={pool}
              tokenAddress={tokenAddress}
              exchangeProxy={exchangeProxy}
            />
          </Stack>
          <Box>
            <CreateOrder
              option={pool}
              tokenAddress={tokenAddress}
              exchangeProxy={exchangeProxy}
              chainId={chainId}
              provider={provider}
            />
          </Box>
        </Stack>
      </TabPanel>
      <TabPanel value="short" sx={{ paddingBottom: '3em' }}>
        <Stack direction="row" spacing={theme.spacing(15)}>
          <Stack
            direction="column"
            width="50%" /* {{ lg: '50%', xl: '30%' }} */
            spacing={2}
          >
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
            <OrdersPanel
              option={pool}
              tokenAddress={tokenAddress}
              exchangeProxy={exchangeProxy}
            />
          </Stack>
          <Box>
            <CreateOrder
              option={pool}
              tokenAddress={tokenAddress}
              exchangeProxy={exchangeProxy}
              chainId={chainId}
              provider={provider}
            />
          </Box>
        </Stack>
      </TabPanel>
      <TabPanel value="add">
        <AddLiquidity pool={pool!} />
      </TabPanel>
      <TabPanel value="remove">
        <RemoveLiquidity pool={pool!} />
      </TabPanel>
      {/* </Box> */}
    </TabContext>
  )
}
