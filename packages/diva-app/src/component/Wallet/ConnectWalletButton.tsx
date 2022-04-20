import { LoadingButton } from '@mui/lab'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { getShortenedAddress } from '../../Util/getShortenedAddress'

export function ConnectWalletButton() {
  const context = useConnectionContext()
  return (
    <LoadingButton
      variant="contained"
      color="primary"
      size="large"
      loading={context.chainId == null}
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
    </LoadingButton>
  )
}
