import { Box, Button, Link, Typography, useTheme } from '@mui/material'
import { useStyles } from '../Trade/Orders/UiStyles'
import React from 'react'

export const WrongChain = (props: any) => {
  const style = useStyles()
  const theme = useTheme()
  const handleOpen = async () => {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x5' }],
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
        Unsupported network, please <Button onClick={handleOpen}>Switch</Button>{' '}
        to Goerli network in your Metamask wallet.
      </Typography>
    </Box>
  )
}
