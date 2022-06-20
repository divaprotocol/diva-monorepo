import { LoadingButton } from '@mui/lab'
import { useState } from 'react'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { selectChainId, selectUserAddress } from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { getShortenedAddress } from '../../Util/getShortenedAddress'

export function ConnectWalletButton() {
  const { isConnected, disconnect, connect } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector(selectChainId)

  const [connected, setConnected] = useState(isConnected)

  window.ethereum.request({ method: 'eth_accounts' }).then((res) => {
    console.log('res.length', res.length)
    if (res.length == 0) {
      setConnected(false)
    }
  })

  return (
    <LoadingButton
      variant="contained"
      color="primary"
      size="large"
      loading={chainId == null}
      type="submit"
      value="Submit"
      sx={{ marginLeft: '10px' }}
      onClick={() => (connected ? disconnect() : connect())}
    >
      {isConnected && userAddress
        ? getShortenedAddress(userAddress)
        : 'Connect Wallet'}
    </LoadingButton>
  )
}
