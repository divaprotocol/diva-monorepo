import { Box, Button, Link, Typography, useTheme } from '@mui/material'
import { useStyles } from '../Trade/Orders/UiStyles'
import React from 'react'
import { useConnectionContext } from '../../hooks/useConnectionContext'

export const WrongChain = (props: any) => {
  const style = useStyles()
  const theme = useTheme()
  const { sendTransaction } = useConnectionContext()

  const handleOpen = async (chainId: string) => {
    await sendTransaction({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainId }],
    })
  }
  return (
    <Box sx={style}>
      <Typography
        sx={{
          mt: theme.spacing(4),
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        Unsupported network, please switch to{' '}
        <Button onClick={() => handleOpen('0x89')}>Polygon</Button> or{' '}
        <Button onClick={() => handleOpen('0x13881')}>Mumbai</Button> network.
      </Typography>
    </Box>
  )
}
