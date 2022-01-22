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

export const Liquidity = () => {
  const [value, setValue] = React.useState(0)
  const [pool, setPool] = React.useState<Pool>()
  const [diva, setDiva] = React.useState<Contract>()
  const { chainId, account } = useWeb3React()

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
          console.log(pool)
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
        height: '60vh',
      }}
    >
      <Stack direction={'column'}>
        <Card sx={{ minWidth: '600px', borderRadius: '16px' }}>
          <Tabs value={value} onChange={handleChange} variant="fullWidth">
            <Tab label="Add" />
            <Tab label="Remove" />
          </Tabs>
          <CardContent>
            {value ? (
              <div>{'asd'}</div>
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
      </Stack>
    </div>
  )
}
