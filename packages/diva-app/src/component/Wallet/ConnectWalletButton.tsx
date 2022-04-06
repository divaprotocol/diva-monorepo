import Button from '@mui/material/Button'
/* import Modal from '@mui/material/Modal' */
import Dialog from '@mui/material/Dialog'
import { useState } from 'react'
/* import { useWallet } from '@web3-ui/hooks' */
import { useAccount, useConnect } from 'wagmi'
/*  */

export function ConnectWalletButton() {
  /* 
  const { connected, connectWallet, connection, provider, disconnectWallet } =
    useWallet() */
  const [{ data, error }, connect] = useConnect()
  const [{ data: accountData }] = useAccount({
    fetchEns: true,
  })
  /*   import { getShortenedAddress } from '../../Util/getShortenedAddress' */
  /* const [walletName, setWalletName] = useState('') */
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
        {!accountData ? 'Connect Wallet' : accountData.connector.name}
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        {data.connectors.map((connector) => (
          <Button
            disabled={!connector.ready}
            key={connector.id}
            onClick={() => connect(connector)}
          >
            {connector.name}
            {!connector.ready && ' (unsupported)'}
          </Button>
        ))}

        {error && <div>{error?.message ?? 'Failed to connect'}</div>}
      </Dialog>
    </div>
  )
}
