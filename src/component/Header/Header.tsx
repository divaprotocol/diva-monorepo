import { AppBar, Box, Toolbar } from '@mui/material'
import { Logo } from '../Logo'
import MenuItems from './MenuItems'
import ConnectWallet from '../Wallet/ConnectWalletButton'
import Typography from '@mui/material/Typography'

export default function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Box sx={{ paddingRight: 10, width: 30 }}>
          <Logo />
        </Box>
        <MenuItems />
        <Typography
          variant="h5"
          noWrap
          component="div"
          sx={{ flexGrow: 1, alignSelf: 'flex-end' }}
        />
        <ConnectWallet />
      </Toolbar>
    </AppBar>
  )
}
