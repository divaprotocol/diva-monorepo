import { Card, CardContent, Container, Stack } from '@mui/material'
import Typography from '@mui/material/Typography'
import React, { useEffect, useMemo } from 'react'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { AddLiquidity } from './AddLiquidity'
import { useWeb3React } from '@web3-react/core'
import { Contract, ethers } from 'ethers'
import { chainIdtoName } from '../../Util/chainIdToName'
import { addresses } from '../../constants'
import DIVA_ABI from '../../abi/DIVA.json'
import { Pool } from '../../lib/queries'
import { RemoveLiquidity } from './RemoveLiquidity'

export const Liquidity = () => {
  const [value, setValue] = React.useState(0)
  const [pool, setPool] = React.useState<Pool>()
  const [diva, setDiva] = React.useState<Contract>()
  const { chainId } = useWeb3React()

  useEffect(() => {
    if (chainId) {
      const provider = new ethers.providers.Web3Provider(
        window.ethereum,
        chainIdtoName(chainId).toLowerCase()
      )
      const diva = new ethers.Contract(
        addresses[chainId!].divaAddress,
        DIVA_ABI,
        provider.getSigner()
      )
      setDiva(diva!)
      diva
        .getPoolParameters(window.location.pathname.split('/')[1])
        .then((pool: Pool) => {
          setPool(pool)
        })
    }
  }, [chainId])

  const handleChange = (event: any, newValue: any) => {
    setValue(newValue)
  }
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '80vh',
      }}
    >
      <Stack direction={'column'}>
        <Card sx={{ maxWidth: '600px', borderRadius: '16px' }}>
          <Tabs value={value} onChange={handleChange} variant="fullWidth">
            <Tab label="Add" />
            <Tab label="Remove" />
          </Tabs>
          <CardContent>
            {value ? (
              <RemoveLiquidity pool={pool!} diva={diva} />
            ) : (
              <AddLiquidity pool={pool!} diva={diva} />
            )}
          </CardContent>
        </Card>
        <Container>
          <Stack direction="row" justifyContent="space-between">
            <Typography>Pool capacity</Typography>
            <Typography>NaN</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography>Currently utilized</Typography>
            <Typography>NaN</Typography>
          </Stack>
        </Container>
        <Card sx={{ maxWidth: '600px', borderRadius: '16px' }}>
          <Container sx={{ mt: '1em', mb: '1em' }}>
            {value ? (
              <Typography>
                By removing liquidity you are giving back long and short
                position tokens proportional to the pool balance and recieve
                collateral in return
              </Typography>
            ) : (
              <Stack direction="column">
                <Typography>
                  By adding liquidity you receive long and short position tokens
                  in return which represent a claim against the collateral you
                  deposited
                </Typography>
                <Typography sx={{ mt: '1em' }}>
                  Bullish? Keep the long tokens and sell the short tokens
                </Typography>
                <Typography sx={{ mt: '1em' }}>
                  Bearish? Keep the short tokens and sell the long tokens
                </Typography>
              </Stack>
            )}
          </Container>
        </Card>
      </Stack>
    </div>
  )
}
