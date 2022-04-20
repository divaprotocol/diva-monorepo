import { BaseProvider, ExternalProvider } from '@ethersproject/providers'
import { createContext, useCallback, useEffect, useState } from 'react'
import { BigNumber, utils, providers } from 'ethers'
import useLocalStorage from 'use-local-storage'
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
  provider?: providers.Web3Provider
}

type ConnectionContextType = {
  connect?: () => any
  disconnect?: () => any
} & ConnectionContextState

export const ConnectionContext = createContext<ConnectionContextType>({})

const ethereum = window.ethereum

export const ConnectionProvider = ({ children }) => {
  const [{ connected }, setConnectionState] = useLocalStorage<{
    connected?: string
  }>('diva-dapp-connection', {})
  const [state, setState] = useState<ConnectionContextState>({ chainId: 3 })

  const connect = useCallback(async () => {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    setState((_state) => ({
      ..._state,
      address: accounts[0],
      chainId: BigNumber.from(ethereum.chainId).toNumber(),
      isConnected: ethereum.isConnected(),
    }))
    setConnectionState({ connected: 'metamask' })
  }, [])

  const disconnect = useCallback(() => {
    setState((_state) => ({
      ..._state,
      address: undefined,
      isConnected: false,
    }))
    setConnectionState({})
  }, [])

  useEffect(() => {
    if (!ethereum?.isMetaMask) {
      setState((_state) => ({
        ..._state,
        error: 'Please install metamask',
      }))
      return
    }

    ethereum.on('accountsChanged', (accounts) => {
      setState((_state) => ({
        ..._state,
        address: accounts?.[0],
        chainId: BigNumber.from(ethereum.chainId).toNumber(),
        isConnected: ethereum.isConnected(),
      }))
    })

    ethereum.on('chainChanged', (chainId) => {
      setState((_state) => ({
        ..._state,
        isConnected: ethereum.isConnected(),
        chainId: BigNumber.from(ethereum.chainId).toNumber(),
      }))
    })

    ethereum.on('connect', (connectInfo) => {
      setState((_state) => ({
        ..._state,
        isConnected: ethereum.isConnected(),
        chainId: BigNumber.from(connectInfo.chainId).toNumber(),
      }))
    })

    ethereum.on('disconnect', (connectInfo) => {
      setState((_state) => ({ ..._state, isConnected: ethereum.isConnected() }))
    })

    detectEthereumProvider().then((provider: MetamaskProvider) =>
      setState((_state) => ({
        ..._state,
        provider: new providers.Web3Provider(provider),
      }))
    )

    if (connected) connect()
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
