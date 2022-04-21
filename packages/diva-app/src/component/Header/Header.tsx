import { AppBar, Box, Toolbar } from '@mui/material'
import { ConnectWalletButton } from '../Wallet/ConnectWalletButton'
import { NetworkTag } from './NetworkTag'

export default function Header() {
  return (
    <Box>
      <AppBar position="static" sx={{ background: 'none', boxShadow: 'none' }}>
        <Toolbar>
          <NetworkTag />
          <ConnectWalletButton />
        </Toolbar>
      </AppBar>
    </Box>
  )
}
