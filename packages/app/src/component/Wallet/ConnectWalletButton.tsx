import Button from '@mui/material/Button'
import { useCallback, useEffect, useState } from 'react'
import { useInitialConnect } from '../../hooks/useInitialConnect'
import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'
import { injected, walletconnect } from '../../Util/connectors'
export function ConnectWalletButton() {
  useInitialConnect()
  const { active, account, activate, deactivate } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const [walletName, setWalletName] = useState('')
  useEffect(() => {
    const run = async () => {
      if (activate && provider != null && account != null && active) {
        try {
          const res = await provider.lookupAddress(account)
          if (res === null) {
            setWalletName(truncate(account))
          } else {
            setWalletName(res)
          }
        } catch (err) {
          console.warn(err)
        }
      }
    }

    run()
  }, [account])

  function truncate(string = '', start = 6, end = 4) {
    if (start < 1 || end < 1) {
      return string
    }
    if (string.length <= start + end) {
      return string
    }
    return string.slice(0, start) + '...' + string.slice(-end)
  }

  function disconnect() {
    try {
      deactivate()
    } catch (ex) {
      console.error(ex)
    }
  }
  async function connect() {
    try {
      await activate(injected)
    } catch (ex) {
      console.error(ex)
    }
  }
  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      type="submit"
      value="Submit"
      sx={{ marginLeft: '10px' }}
      onClick={!active ? () => connect() : () => disconnect()}
    >
      {!active ? 'Connect Wallet' : walletName}
    </Button>
  )
}
