import { BaseProvider, ExternalProvider } from '@ethersproject/providers'
import { createContext, useCallback, useEffect, useState } from 'react'
import { BigNumber, utils } from 'ethers'
import detectEthereumProvider from '@metamask/detect-provider'

type MetamaskProvider = ExternalProvider &
  BaseProvider & {
    isConnected: () => boolean
    chainId: string
  }

type ConnectionContextState = {
  chainId?: number
  error?: string
  address?: string
  isConnected?: boolean
  provider?: MetamaskProvider
}

type ConnectionContextType = {
  connect?: () => any
  disconnect?: () => any
} & ConnectionContextState

export const ConnectionContext = createContext<ConnectionContextType>({})

const ethereum = window.ethereum as MetamaskProvider

export const ConnectionProvider = ({ children }) => {
  const [state, setState] = useState<ConnectionContextState>({ chainId: 3 })
  const connect = useCallback(async () => {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    setState((_state) => ({
      ..._state,
      address: accounts[0],
      chainId: BigNumber.from(ethereum.chainId).toNumber(),
      isConnected: ethereum.isConnected(),
    }))
  }, [])

  const disconnect = useCallback(() => {
    console.log('disconnecting')
    setState((_state) => ({
      ..._state,
      address: undefined,
      isConnected: false,
    }))
  }, [])

  useEffect(() => {
    /** TODO: Automatically try to connect */

    if (!ethereum?.isMetaMask) {
      setState({
        ...state,
        error: 'Please install metamask',
      })
      console.log('not metamask')
      return
    }

    ethereum.on('accountsChanged', (accounts) => {
      console.log('accounts changed')
      setState((_state) => ({ ...state, address: accounts?.[0] }))
    })

    ethereum.on('chainChanged', (chainId) => {
      console.log('chain changed')
      setState((_state) => ({ ...state, chainId }))
    })

    ethereum.on('connect', (connectInfo) => {
      console.log('connect yo', { connectInfo })
    })

    ethereum.on('disconnect', (connectInfo) => {
      setState((_state) => ({ ..._state, isConnected: ethereum.isConnected() }))
      console.log('disconnect', { connectInfo })
    })

    detectEthereumProvider().then((provider: MetamaskProvider) =>
      setState((_state) => ({ ..._state, provider }))
    )

    ethereum.on('message', (msg) => console.log('message', { msg }))

    connect()
  }, [])

  const value = {
    connect,
    disconnect,
    ...state,
  }

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  )
}
