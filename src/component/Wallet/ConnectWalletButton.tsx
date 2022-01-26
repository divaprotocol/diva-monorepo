import Button from '@mui/material/Button'
import { useCallback, useEffect, useState } from 'react'
import { useWallet } from '@web3-ui/core'

export function ConnectWalletButton() {
  const { connected, connectWallet, connection, provider, disconnectWallet } =
    useWallet()
  // const { active, account, activate, deactivate } = useWeb3React()
  const [walletName, setWalletName] = useState('')

  const connect = useCallback(async () => {
    try {
      connectWallet?.()
      // await activate(injected)
    } catch (ex) {
      console.error(ex)
    }
  }, [connectWallet])

  useEffect(() => {
    const run = async () => {
      if (connection && provider != null) {
        const res = await provider.lookupAddress(connection.userAddress || '')
        if (res === null) {
          setWalletName(truncate(connection.userAddress || ''))
        } else {
          setWalletName(res)
        }
      }
      await connect()
    }

    run()
  }, [connect, connection, provider])

  function truncate(string = '', start = 6, end = 4) {
    if (start < 1 || end < 1) {
      return string
    }
    if (string.length <= start + end) {
      return string
    }
    return string.slice(0, start) + '...' + string.slice(-end)
  }

  const toggleConnect = useCallback(() => {
    if (connected) {
      disconnectWallet?.()
    } else {
      connectWallet?.()
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
