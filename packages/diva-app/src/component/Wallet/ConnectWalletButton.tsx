import Button from '@mui/material/Button'
import { useCallback, useEffect, useState } from 'react'
import { useWallet } from '@web3-ui/hooks'
import { getShortenedAddress } from '../../Util/getShortenedAddress'

export function ConnectWalletButton() {
  const { connected, connectWallet, connection, provider, disconnectWallet } =
    useWallet()
  const [walletName, setWalletName] = useState('')

  useEffect(() => {
    const run = async () => {
      if (
        connection &&
        provider != null &&
        connection.userAddress != null &&
        connected
      ) {
        try {
          const res = await provider.lookupAddress(connection.userAddress)
          if (res === null) {
            setWalletName(getShortenedAddress(connection.userAddress))
          } else {
            setWalletName(res)
          }
        } catch (err) {
          console.warn(err)
        }
      }
    }

    run()
  }, [connection, provider, connected])
  const toggleConnect = useCallback(() => {
    if (connected) {
      disconnectWallet?.()
    } else {
      const _connectWallet = connectWallet as any
      _connectWallet?.()?.catch((err) => {
        console.warn(err)
      })
    }
  }, [connected, connectWallet, disconnectWallet])

  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      type="submit"
      value="Submit"
      sx={{ marginLeft: '10px' }}
      onClick={toggleConnect}
    >
      {!connected ? 'Connect Wallet' : walletName}
    </Button>
  )
}
