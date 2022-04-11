import React from 'react'
import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useConnect } from 'wagmi'
import { Dialog } from '@mui/material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'

export interface SimpleDialogProps {
  open: boolean
  onClose: () => void
}

const WalletDialog = (props: SimpleDialogProps) => {
  const [{ data, error }, connect] = useConnect()
  const { onClose, open } = props
  const handleClose = () => {
    onClose()
  }
  return (
    <Dialog
      sx={{ width: '100%' }}
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <List>
        {data.connectors.map((connector) => (
          <ListItem>
            <Button
              disabled={!connector.ready}
              key={connector.id}
              onClick={() => {
                connect(connector)
                handleClose()
              }}
            >
              {connector.name}
              {!connector.ready && ' (unsupported)'}
            </Button>
          </ListItem>
        ))}
      </List>

      {error && <div>{error?.message ?? 'Failed to connect'}</div>}
    </Dialog>
  )
}

export default WalletDialog
