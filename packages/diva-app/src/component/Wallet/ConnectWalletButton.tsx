import Button from '@mui/material/Button'

/* import Dialog from '@mui/material/Dialog' */
import { useState } from 'react'
/* import { useWallet } from '@web3-ui/hooks' */
import { useAccount, useConnect } from 'wagmi'
import WalletDialog from './WalletDialog'

import { getShortenedAddress } from '../../Util/getShortenedAddress'
/*  */

export function ConnectWalletButton() {
  /* 
  const { connected, connectWallet, connection, provider, disconnectWallet } = useWallet() */
  /* const [walletName, setWalletName] = useState('') */
  const [{ data: accountData }] = useAccount({
    fetchEns: true,
  })
  const [open, setOpen] = useState(false)
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  return (
    <div>
      <Button
        variant="contained"
        color="primary"
        size="large"
        type="submit"
        value="Submit"
        sx={{ marginLeft: '10px' }}
        onClick={handleOpen}
      >
        {!accountData
          ? 'Connect Wallet'
          : getShortenedAddress(accountData.address)}
      </Button>
      <WalletDialog open={open} onClose={handleClose} />
    </div>
  )
}
