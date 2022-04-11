import Button from '@mui/material/Button'
import { useState } from 'react'
import { useAccount } from 'wagmi'
import WalletDialog from './WalletDialog'
import { getShortenedAddress } from '../../Util/getShortenedAddress'

export function ConnectWalletButton() {
  const [{ data: accountData }, disconnect] = useAccount({
    fetchEns: true,
  })
  const [open, setOpen] = useState(false)
  const handleOpen = () => {
    if (accountData) {
      disconnect()
    } else {
      setOpen(true)
    }
  }
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
