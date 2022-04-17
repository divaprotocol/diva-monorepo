import { AppBar, Toolbar } from '@mui/material'
import { ConnectWalletButton } from '../Wallet/ConnectWalletButton'
import { NetworkTag } from './NetworkTag'

export default function Header() {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <NetworkTag />
          <ConnectWalletButton />
        </Toolbar>
      </AppBar>
    </>
  )
}
