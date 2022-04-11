import React from 'react'
import Backdrop from '@mui/material/Backdrop'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { useConnect } from 'wagmi'
import { Dialog, Grid, Icon, Stack } from '@mui/material'
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
      <Grid container>
        {data.connectors.map((connector) => (
          <Grid item xs={4}>
            <Button
              disabled={!connector.ready}
              key={connector.id}
              onClick={() => {
                connect(connector)
                handleClose()
              }}
            >
              <Stack minHeight="200px" minWidth="200px">
                {/*<Icon>*/}
                {/*  <img src="/images/walletconnect.svg" />*/}
                {/*</Icon>*/}
                {connector.name}
                {!connector.ready && ' (unsupported)'}
              </Stack>
            </Button>
          </Grid>
        ))}
      </Grid>

      {error && <div>{error?.message ?? 'Failed to connect'}</div>}
    </Dialog>
  )
}

export default WalletDialog
