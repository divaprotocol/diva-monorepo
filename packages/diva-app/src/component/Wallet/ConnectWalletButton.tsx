import Button from '@mui/material/Button'
import { useConnectionContext } from '../../hooks/useConnectionContext'

export function ConnectWalletButton() {
  const context = useConnectionContext()
  console.log({ context })
  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      type="submit"
      value="Submit"
      sx={{ marginLeft: '10px' }}
      onClick={() =>
        context?.isConnected ? context.disconnect() : context.connect()
      }
    >
      {context?.isConnected ? 'Disconnect' : 'Connect Wallet'}
    </Button>
  )
}
