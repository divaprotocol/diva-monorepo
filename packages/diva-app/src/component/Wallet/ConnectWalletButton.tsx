import { LoadingButton } from '@mui/lab'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import {
  selectChainId,
  selectUserAddress,
  selectIsConnected,
} from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { getShortenedAddress } from '../../Util/getShortenedAddress'

export function ConnectWalletButton() {
  const { isConnected, disconnect, connect } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector(selectChainId)
  const connected = useAppSelector(selectIsConnected)
  console.log('wallet connect button component: isConnected: ', isConnected)
  console.log('wallet connect button component: connected: ', connected)

  return (
    <LoadingButton
      variant="contained"
      color="primary"
      size="large"
      loading={chainId == null}
      type="submit"
      value="Submit"
      sx={{ marginLeft: '10px' }}
      onClick={() =>
        isConnected && connected === true ? disconnect() : connect()
      }
    >
      {isConnected && userAddress
        ? getShortenedAddress(userAddress)
        : 'Connect Wallet'}
    </LoadingButton>
  )
}
