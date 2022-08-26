import { LoadingButton } from '@mui/lab'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { useCustomMediaQuery } from '../../hooks/useCustomMediaQuery'
import { selectChainId, selectUserAddress } from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { getShortenedAddress } from '../../Util/getShortenedAddress'

export function ConnectWalletButton() {
  const { isConnected, disconnect, connect } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector(selectChainId)
  const { isMobile } = useCustomMediaQuery()

  return (
    <LoadingButton
      variant="contained"
      color="primary"
      size={isMobile ? 'small' : 'large'}
      loading={chainId == null}
      type="submit"
      value="Submit"
      sx={{ marginLeft: '10px' }}
      onClick={() => (isConnected && userAddress ? disconnect() : connect())}
    >
      {isConnected && userAddress
        ? getShortenedAddress(userAddress)
        : 'Connect Wallet'}
    </LoadingButton>
  )
}
