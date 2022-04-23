import { LoadingButton } from '@mui/lab'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { selectUserAddress } from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { getShortenedAddress } from '../../Util/getShortenedAddress'

export function ConnectWalletButton() {
  const context = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)

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
        ? userAddress != null
          ? getShortenedAddress(userAddress)
          : ''
        : 'Connect Wallet'}
    </LoadingButton>
  )
}
