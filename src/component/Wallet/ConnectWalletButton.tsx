import { useWeb3React } from '@web3-react/core'
import { injected } from './connectors'
import Button from '@mui/material/Button'
import React from 'react'

export default function ConnectWallet() {
  const { active, account, activate, deactivate } = useWeb3React()

  async function connect() {
    try {
      await activate(injected)
    } catch (ex) {
      console.log(ex)
    }
  }

  async function disconnect() {
    try {
      deactivate()
    } catch (ex) {
      console.log(ex)
    }
  }

  return (
    <Button
      variant="contained"
      color="primary"
      size="large"
      type="submit"
      value="Submit"
      onClick={!active ? () => connect() : () => disconnect()}
    >
      {!active ? 'Connect Wallet' : account}
    </Button>
    // <div className="flex flex-col items-center justify-center">
    //   <button
    //     onClick={connect}
    //     className="py-2 mt-20 mb-4 text-lg font-bold text-white rounded-lg w-56 bg-blue-600 hover:bg-blue-800"
    //   >
    //     Connect to MetaMask
    //   </button>
    //   {active ? (
    //     <span>
    //       Connected with <b>{account}</b>
    //     </span>
    //   ) : (
    //     <span>Not connected</span>
    //   )}
    //   <button
    //     onClick={disconnect}
    //     className="py-2 mt-20 mb-4 text-lg font-bold text-white rounded-lg w-56 bg-blue-600 hover:bg-blue-800"
    //   >
    //     Disconnect
    //   </button>
    // </div>
  )
}
