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
import DIVA_ABI from '../../abi/DIVA.json'
import { Pool } from '../../lib/queries'
import { RemoveLiquidity } from './RemoveLiquidity'
import { formatUnits } from 'ethers/lib/utils'
import ERC20 from '../../abi/ERC20.json'
import { config } from '../../constants'
import { useWallet } from '@web3-ui/hooks'

export const Liquidity = () => {
  const [value, setValue] = React.useState(0)
  const [pool, setPool] = React.useState<Pool>()
  const [diva, setDiva] = React.useState<Contract>()
  const [decimal, setDecimal] = React.useState(18)
  const [openAlert, setOpenAlert] = React.useState(false)
  const [symbol, setSymbol] = React.useState('')
  const { provider } = useWallet()
  console.log('liquidity')
  console.log(pool)
  console.log(decimal)
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
            pool!.collateralToken,
            ERC20,
            provider.getSigner()
          )
          token.symbol().then((symbol: string) => {
            setSymbol(symbol)
          })
          token.decimals().then((decimals: number) => {
            setDecimal(decimals)
          })
          setOpenAlert(Date.now() > 1000 * parseInt(pool.expiryDate))
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
          maxWidth: theme.spacing(82),
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
        <Card sx={{ borderRadius: '16px' }}>
          <Tabs value={value} onChange={handleChange} variant="fullWidth">
            <Tab label="Add" />
            <Tab label="Remove" />
          </Tabs>
          <CardContent>
            {value ? (
              <RemoveLiquidity pool={pool!} diva={diva} symbol={symbol} />
            ) : (
              <AddLiquidity pool={pool!} diva={diva} symbol={symbol} />
            )}
          </CardContent>
        </Card>
        {!value && pool && (
          <Container sx={{ mt: theme.spacing(2), mb: theme.spacing(2) }}>
            {pool && formatUnits(pool!.capacity, decimal!) !== '0.0' ? (
              <>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Pool capacity</Typography>
                  <Typography>
                    {pool &&
                      (formatUnits(pool!.capacity, decimal) === '0.0'
                        ? 'Unlimited'
                        : formatUnits(pool!.capacity, decimal))}{' '}
                    {symbol!}{' '}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Currently utilized</Typography>
                  <Typography>
                    {pool &&
                      '1% / ' +
                        parseFloat(
                          formatUnits(pool.collateralBalanceLong, decimal)
                        ) +
                        parseFloat(
                          formatUnits(pool.collateralBalanceShort, decimal)
                        )}{' '}
                    {symbol!}{' '}
                  </Typography>
                </Stack>
              </>
            ) : (
              <>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Pool capacity</Typography>
                  <Typography>Unlimited</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography>Current pool size</Typography>
                  <Typography>
                    {pool &&
                      parseFloat(
                        formatUnits(pool.collateralBalanceLong, decimal)
                      ) +
                        parseFloat(
                          formatUnits(pool.collateralBalanceShort, decimal)
                        )}{' '}
                    {symbol!}{' '}
                  </Typography>
                </Stack>
              </>
            )}
          </Container>
        )}
        <Card sx={{ maxWidth: '600px', borderRadius: '16px' }}>
          <Container sx={{ mt: theme.spacing(2), mb: theme.spacing(2) }}>
            {value ? (
              <Typography>
                By removing liquidity you are giving back long and short
                position tokens proportional to the pool balance and receive
                collateral in return
              </Typography>
            ) : (
              <Stack direction="column">
                <Typography>
                  By adding liquidity you receive long and short position tokens
                  in return which represent a claim against the collateral you
                  deposited
                </Typography>
                <Typography sx={{ mt: theme.spacing(2) }}>
                  Bullish? Keep the long tokens and sell the short tokens
                </Typography>
                <Typography sx={{ mt: theme.spacing(2) }}>
                  Bearish? Keep the short tokens and sell the long tokens
                </Typography>
              </Stack>
            )}
          </Container>
        </Card>
      </Stack>
    </Box>
  )
}
