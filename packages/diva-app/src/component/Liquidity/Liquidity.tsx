import {
  Alert,
  Box,
  Card,
  CardContent,
  Collapse,
  Container,
  IconButton,
  Stack,
  useTheme,
} from '@mui/material'
import Typography from '@mui/material/Typography'
import React, { useEffect } from 'react'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { AddLiquidity } from './AddLiquidity'
import { Contract, ethers } from 'ethers'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { Pool } from '../../lib/queries'
import { RemoveLiquidity } from './RemoveLiquidity'
import { formatUnits } from 'ethers/lib/utils'
import ERC20 from '@diva/contracts/abis/erc20.json'
import { config } from '../../constants'
import { useWallet } from '@web3-ui/hooks'
import { ReactComponent as Bullish } from '../../Images/bullish-svgrepo-com.svg'
import { ReactComponent as Bearish } from '../../Images/bearish-svgrepo-com.svg'
import { ReactComponent as Star } from '../../Images/star-svgrepo-com.svg'
export const Liquidity = () => {
  const [value, setValue] = React.useState(0)
  const [pool, setPool] = React.useState<Pool>()
  const [diva, setDiva] = React.useState<Contract>()
  const [decimal, setDecimal] = React.useState(18)
  const [openAlert, setOpenAlert] = React.useState(false)
  const [symbol, setSymbol] = React.useState('')
  const { provider } = useWallet()
  const chainId = provider?.network?.chainId

  const theme = useTheme()

  useEffect(() => {
    if (chainId) {
      const diva = new ethers.Contract(
        config[chainId!].divaAddress,
        DIVA_ABI,
        provider.getSigner()
      )
      setDiva(diva!)
      diva
        .getPoolParameters(window.location.pathname.split('/')[1])
        .then((pool: Pool) => {
          setPool(pool)
          const token = new ethers.Contract(
            pool!.collateralToken.id,
            ERC20,
            provider.getSigner()
          )
          token.symbol().then((symbol: string) => {
            setSymbol(symbol)
          })
          token.decimals().then((decimals: number) => {
            setDecimal(decimals)
          })
          setOpenAlert(Date.now() > 1000 * parseInt(pool.expiryTime))
        })
    }
  }, [chainId])

  const handleChange = (event: any, newValue: any) => {
    setValue(newValue)
  }
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <Stack
        direction={'column'}
        sx={{
          paddingTop: theme.spacing(3),
          minWidth: theme.spacing(82),
        }}
      >
        <Collapse in={openAlert}>
          <Alert
            severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setOpenAlert(false)
                }}
              >
                {'X'}
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            Pool expired. Addition/removal of liquidity is no longer possible
          </Alert>
        </Collapse>
        <Container sx={{ borderRadius: '16px' }}>
          <Tabs value={value} onChange={handleChange} variant="fullWidth">
            <Tab label="Add" />
            <Tab label="Remove" />
          </Tabs>
          {value ? (
            <RemoveLiquidity pool={pool!} diva={diva} symbol={symbol} />
          ) : (
            <AddLiquidity pool={pool!} diva={diva} symbol={symbol} />
          )}
        </Container>
        {!value && pool && (
          <Container sx={{ mt: theme.spacing(4), mb: theme.spacing(4) }}>
            {pool && formatUnits(pool!.capacity, decimal!) !== '0.0' ? (
              <Container sx={{ mt: theme.spacing(2), mb: theme.spacing(4) }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Pool Capacity</Typography>
                  <Typography>
                    {pool &&
                      (formatUnits(pool!.capacity, decimal) === '0.0'
                        ? 'Unlimited'
                        : formatUnits(pool!.capacity, decimal))}{' '}
                    {symbol!}{' '}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Currently Utilized</Typography>
                  <Typography>
                    {pool &&
                      (100 *
                        parseFloat(
                          formatUnits(pool.collateralBalance, decimal)
                        )) /
                        parseFloat(formatUnits(pool.capacity)) +
                        '% / ' +
                        parseFloat(
                          formatUnits(pool.collateralBalance, decimal)
                        )}{' '}
                    {symbol!}{' '}
                  </Typography>
                </Stack>
              </Container>
            ) : (
              <Container>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Pool Capacity</Typography>
                  <Typography>Unlimited</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Current Pool Size</Typography>
                  <Typography>
                    {pool &&
                      parseFloat(
                        formatUnits(pool.collateralBalance, decimal)
                      ).toFixed(4)}{' '}
                    {symbol!}{' '}
                  </Typography>
                </Stack>
              </Container>
            )}
          </Container>
        )}
        {value ? (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              minWidth: theme.spacing(82),
            }}
          >
            <Card
              sx={{
                mt: theme.spacing(2),
                borderRadius: '16px',
                width: '450px',
              }}
            >
              <Container
                sx={{
                  mt: theme.spacing(2),
                  mb: theme.spacing(2),
                }}
              >
                <Stack direction="row">
                  <Star
                    style={{
                      marginTop: theme.spacing(-1),
                      paddingRight: theme.spacing(1),
                      height: theme.spacing(4),
                      width: theme.spacing(4),
                    }}
                  />
                  <Typography fontSize={'0.85rem'} style={{ color: 'gray' }}>
                    {' '}
                    By removing liquidity you are giving back long and short
                    position tokens proportional to the pool balance and receive
                    collateral in return
                  </Typography>
                </Stack>
              </Container>
            </Card>
          </Box>
        ) : (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{
              minWidth: theme.spacing(82),
              mb: theme.spacing(4),
            }}
          >
            <Card
              sx={{
                width: '450px',
                borderRadius: '16px',
              }}
            >
              <Container sx={{ mt: theme.spacing(2), mb: theme.spacing(2) }}>
                <Stack direction="column">
                  <Stack direction="row">
                    <Star
                      style={{
                        marginTop: theme.spacing(-1),
                        paddingRight: theme.spacing(1.8),
                        height: theme.spacing(4),
                        width: theme.spacing(4),
                      }}
                    />
                    <Typography fontSize={'0.85rem'} style={{ color: 'gray' }}>
                      {'    '}
                      By adding liquidity you receive long and short position
                      tokens in return which represent a claim against the
                      collateral you deposited
                    </Typography>
                  </Stack>
                  <Stack direction="row">
                    <Bullish
                      style={{
                        paddingTop: theme.spacing(2),
                        paddingRight: theme.spacing(1),
                        height: theme.spacing(2.5),
                        width: theme.spacing(2.5),
                      }}
                    />
                    <Typography
                      fontSize={'0.85rem'}
                      sx={{ mt: theme.spacing(2) }}
                      style={{ color: 'gray' }}
                    >
                      {' '}
                      Bullish? Keep the long tokens and sell the short tokens
                    </Typography>
                  </Stack>
                  <Stack direction="row">
                    <Bearish
                      style={{
                        paddingTop: theme.spacing(2),
                        paddingRight: theme.spacing(1),
                        height: theme.spacing(2.5),
                        width: theme.spacing(2.5),
                      }}
                    />
                    <Typography
                      fontSize={'0.85rem'}
                      sx={{ mt: theme.spacing(2) }}
                      style={{ color: 'gray' }}
                    >
                      {' '}
                      Bearish? Keep the short tokens and sell the long tokens
                    </Typography>
                  </Stack>
                </Stack>
              </Container>
            </Card>
          </Box>
        )}
      </Stack>
    </Box>
  )
}
