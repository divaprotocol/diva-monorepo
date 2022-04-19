import Button from '@mui/material/Button'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { getShortenedAddress } from '../../Util/getShortenedAddress'

export function ConnectWalletButton() {
  const context = useConnectionContext()
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
      {context?.isConnected
        ? context.address != null
          ? getShortenedAddress(context.address)
          : ''
        : 'Connect Wallet'}
    </Button>
  )
}
