import { Box } from '@mui/material'
import Stack from '@mui/material/Stack'
import { Logo } from '../Logo'
import MenuItems from './MenuItems'
import { ConnectWalletButton } from '../Wallet/ConnectWalletButton'
import { NetworkTag } from './NetworkTag'

export default function Header() {
  return (
    <Stack direction="column" spacing={4} width="80px" paddingTop="30px">
      <Box sx={{ padding: '10px', width: 30 }}>
        <Logo />
      </Box>
      <Box>
        <MenuItems />
      </Box>
    </Stack>
  )
}
