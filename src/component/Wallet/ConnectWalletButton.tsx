import { useWeb3React } from '@web3-react/core'
import { injected } from './connectors'
import Button from '@mui/material/Button'
import React, { useEffect, useState } from 'react'
import { ethers } from 'ethers'

export function ConnectWalletButton() {
  const { active, account, activate, deactivate } = useWeb3React()
  const [walletName, setWalletName] = useState('')
  const provider = new ethers.providers.Web3Provider(window.ethereum)

  useEffect(() => {
    if (account) {
      provider.lookupAddress(account).then((res) => {
        if (res === null) {
          setWalletName(truncate(account))
        } else {
          setWalletName(res)
        }
      })
    }
  }, [account])
  async function connect() {
    try {
      await activate(injected)
    } catch (ex) {
      console.error(ex)
    }
  }
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
