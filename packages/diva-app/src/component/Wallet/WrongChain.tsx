import { Box, Typography, useTheme } from '@mui/material'
import { useStyles } from '../Trade/Orders/UiStyles'

export const WrongChain = (props: any) => {
  const style = useStyles()
  const theme = useTheme()
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
        Unsupported network, please switch to Ropsten network in your Metamask
        wallet.
      </Typography>
    </Box>
  )
}
