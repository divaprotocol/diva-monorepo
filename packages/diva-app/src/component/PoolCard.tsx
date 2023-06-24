import { useEffect, useState } from 'react'
import {
  Chip,
  Tooltip,
  Typography,
  useTheme,
  Stack,
  Button,
  ButtonProps,
} from '@mui/material'
import { Box } from '@mui/system'
import { GridRowModel } from '@mui/x-data-grid'
import { useHistory } from 'react-router-dom'
import { BigNumber } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import WarningAmberSharpIcon from '@mui/icons-material/WarningAmberSharp'
import CheckCircleSharpIcon from '@mui/icons-material/CheckCircleSharp'

import { useWhitelist } from '../hooks/useWhitelist'
import { selectPool, selectUnderlyingPrice } from '../Redux/appSlice'
import { useAppSelector } from '../Redux/hooks'
import { isExpired } from '../Util/Dates'
import { CoinIconPair } from './CoinIcon'
import TradeChart from './Graphs/TradeChart'
import { calcPayoffPerToken } from '../Util/calcPayoffPerToken'
import { getUnderlyingPrice } from '../lib/getUnderlyingPrice'
import styled from 'styled-components'
import { ExpiresInCell } from './Markets/Markets'
import { useCustomMediaQuery } from '../hooks/useCustomMediaQuery'

interface Props {
  row: GridRowModel
}

interface StyledButtonProps extends ButtonProps {
  backgroundcolor: string
  bordercolor: string
  ismobile: boolean
}

const BuyAndSellButton = styled(Button)<StyledButtonProps>(
  ({ backgroundcolor, bordercolor, ismobile }) => ({
    width: `${ismobile ? '120px' : '160px'}`,
    height: '60px',
    background: backgroundcolor,
    border: `1px solid ${bordercolor}`,
    boxShadow: '0px 3px 1px -2px rgba(0, 0, 0, 0.2)',
    filter:
      'drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.14)) drop-shadow(0px 1px 5px rgba(0, 0, 0, 0.12))',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: '500',
  })
)

const PoolCard = ({ row }: Props) => {
  const [dataSourceName, setDataSourceName] = useState('')
  const [checkIcon, setCheckIcon] = useState(true)
  const [usdPrice, setUsdPrice] = useState('') // TODO rename as the underlying doesn't need to be an asset priced in USD
  const pool = useAppSelector((state) => selectPool(state, row.Id))
  const theme = useTheme()
  const history = useHistory()
  const dataSource = useWhitelist()
  const { isMobile } = useCustomMediaQuery()

  const IsLong = row.id.split('/')[1] === 'long'
  const decimals = pool.collateralToken.decimals

  useEffect(() => {
    const dataName = dataSource?.dataProviders?.find(
      (dataName: { id: string }) => dataName?.id == pool?.dataProvider
    )
    if (dataName?.name != null) {
      setDataSourceName(dataName?.name)
      setCheckIcon(true)
    } else {
      setDataSourceName('Unknown')
      setCheckIcon(false)
    }
  }, [dataSource.dataProviders, pool.dataProvider])

  useEffect(() => {
    getUnderlyingPrice(pool.referenceAsset).then((data) => {
      if (data != null || data != undefined) {
        setUsdPrice(data)
      } else {
        setUsdPrice('')
      }
    })
  }, [pool.referenceAsset])

  const { payoffPerLongToken, payoffPerShortToken } = calcPayoffPerToken(
    BigNumber.from(pool.floor),
    BigNumber.from(pool.inflection),
    BigNumber.from(pool.cap),
    BigNumber.from(pool.gradient),
    pool.statusFinalReferenceValue === 'Open' && usdPrice != ''
      ? parseUnits(usdPrice)
      : BigNumber.from(pool.finalReferenceValue),
    decimals
  )

  const intrinsicValue = formatUnits(
    IsLong ? payoffPerLongToken : payoffPerShortToken,
    decimals
  ).slice(0, 4)

  const handleBuyAndSellClick = () => {
    history.push(`../../${row.id}`)
  }

  const currentPrice = useAppSelector(
    selectUnderlyingPrice(pool?.referenceAsset)
  )

  return (
    <Box
      sx={{
        width: `${isMobile ? theme.spacing(43.75) : theme.spacing(50)}`,
        height: theme.spacing(82.5),
        border: '1px solid #383838',
        background: theme.palette.background.default,
        borderRadius: theme.spacing(1),
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px',
          backgroundColor: '#1C1C1C',
          height: '51px',
          gridGap: '10px',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            maxWidth: '50%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              marginRight: '13px',
            }}
          >
            <CoinIconPair assetName={row.Icon} />
          </Box>
          <Tooltip title={row.Icon}>
            <Typography
              variant={isMobile ? 'h3' : 'h2'}
              color={'#fff'}
              sx={{
                maxWidth: '200px',
              }}
              noWrap
            >
              {row.Icon}
            </Typography>
          </Tooltip>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gridGap: '11px',
          }}
        >
          {isExpired(row.Expiry) ? (
            <Chip
              label="Expired"
              color="warning"
              sx={{
                opacity: 0.5,
              }}
            />
          ) : (
            <>
              <Typography variant="h6" color={'#A4A4A4'}>
                Expires in
              </Typography>
              <Typography
                variant="h4"
                color={'#FFFFFF'}
                align="right"
                sx={{
                  maxWidth: '107px',
                }}
                noWrap
              >
                <ExpiresInCell row={row} />
              </Typography>
            </>
          )}
        </Box>
      </Box>
      <TradeChart
        data={row.PayoffProfile}
        refAsset={pool.referenceAsset}
        payOut={pool.collateralToken.symbol}
        w={isMobile ? 330 : 380}
        h={220}
        isLong={IsLong}
        currentPrice={currentPrice}
        floor={row.Floor}
        cap={row.Cap}
        showBreakEven={false}
      />
      <Stack
        sx={{
          padding: '0 20px',
          marginTop: '36px',
        }}
        spacing={'16px'}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
          }}
        >
          <Typography color={'#A4A4A4'}>Data Provider</Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
            }}
          >
            <Tooltip title={pool.dataProvider} arrow>
              <Typography color={'#FFFFFF'}>{dataSourceName}</Typography>
            </Tooltip>
            {checkIcon ? (
              <Tooltip
                title="Trusted data provider from the DIVA whitelist."
                arrow
              >
                <CheckCircleSharpIcon
                  sx={{
                    mt: 0.3,
                    paddingLeft: 1,
                  }}
                  color="success"
                  fontSize="inherit"
                />
              </Tooltip>
            ) : (
              <Tooltip
                title="Data provider is NOT part of DIVA's whitelist."
                arrow
              >
                <WarningAmberSharpIcon
                  sx={{
                    mt: 0.3,
                    paddingLeft: 1,
                  }}
                  color="warning"
                  fontSize="inherit"
                />
              </Tooltip>
            )}
          </Box>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
          }}
        >
          <Typography color={'#A4A4A4'}>TVL</Typography>
          <Typography color={'#FFFFFF'}>{row.TVL}</Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
          }}
        >
          <Typography color={'#A4A4A4'}>Intrinsic Value</Typography>
          <Typography color={'#FFFFFF'}>
            {Number(intrinsicValue).toFixed(2)}
          </Typography>
        </Box>
      </Stack>
      <Stack
        direction="row"
        sx={{
          justifyContent: 'space-between',
          marginTop: '16px',
          alignItems: 'space-between',
          padding: '0 20px',
        }}
      >
        <BuyAndSellButton
          backgroundcolor="linear-gradient(180deg, rgba(18, 18, 18, 0) -60%, rgba(51, 147, 224, 0.3) 100%)"
          bordercolor="#3393E0"
          onClick={handleBuyAndSellClick}
          ismobile={isMobile}
        >
          <Stack>
            <div>BUY</div>
            <div>{row.Buy}</div>
          </Stack>
        </BuyAndSellButton>
        <BuyAndSellButton
          backgroundcolor="linear-gradient(180deg, rgba(18, 18, 18, 0) -33.33%, rgba(211, 47, 47, 0.6) 100%)"
          bordercolor="#D32F2F"
          onClick={handleBuyAndSellClick}
          ismobile={isMobile}
        >
          <Stack>
            <div>SELL</div>
            <div>{row.Sell}</div>
          </Stack>
        </BuyAndSellButton>
      </Stack>
      <Stack
        direction="row"
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: '34px',
        }}
        spacing={'40px'}
      >
        <Box>
          <Typography
            sx={{
              fontSize: '20px',
              color: '#3393E0',
            }}
          >
            {row.MaxYield.buy}
          </Typography>
        </Box>
        <Box>
          <Typography>Max Yield</Typography>
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: '20px',
              color: '#3393E0',
            }}
          >
            {row.MaxYield.sell}
          </Typography>
        </Box>
      </Stack>
      <Box>
        <Typography
          sx={{
            marginTop: '24px',
            padding: '0 20px',
            opacity: 0.5,
          }}
          align="right"
        >
          #{row.Id}
        </Typography>
      </Box>
    </Box>
  )
}

export default PoolCard
