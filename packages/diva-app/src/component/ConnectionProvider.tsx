import { BaseProvider, ExternalProvider } from '@ethersproject/providers'
import { createContext, useCallback, useEffect, useState } from 'react'
import { BigNumber, providers } from 'ethers'
import useLocalStorage from 'use-local-storage'
import detectEthereumProvider from '@metamask/detect-provider'
import { useDispatch } from 'react-redux'
import { setChainId, setUserAddress } from '../Redux/appSlice'

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
  connect?: () => unknown
  disconnect?: () => unknown
} & ConnectionContextState

export const ConnectionContext = createContext<ConnectionContextType>({})

const ethereum = window.ethereum

export const ConnectionProvider = ({ children }) => {
  const [{ connected }, setConnectionState] = useLocalStorage<{
    connected?: string
  }>('diva-dapp-connection', {})
  const [state, setState] = useState<ConnectionContextState>({})
  const dispatch = useDispatch()

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (state.chainId != null) {
        dispatch(setChainId(state.chainId))
      }
    }, 200)
    return () => clearTimeout(timeout)
  }, [dispatch, state.chainId])

  useEffect(() => {
    dispatch(setUserAddress(state.address))
  }, [dispatch, state.address])

  const connect = useCallback(async () => {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    setState((_state) => ({
      ..._state,
      address: accounts[0],
      chainId: BigNumber.from(ethereum.chainId).toNumber(),
      isConnected: ethereum.isConnected() && accounts.length > 0,
    }))
    setConnectionState({ connected: 'metamask' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const disconnect = useCallback(() => {
    setState((_state) => ({
      ..._state,
      address: undefined,
      isConnected: false,
      chainId: 420,
    }))
    setConnectionState({})

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      ethereum.request({ method: 'eth_accounts' }).then((res) => {
        if (res.length > 0) {
          connect()
        } else {
          disconnect()
        }
      })
    })

    ethereum.on('chainChanged', (chainInfo) => {
      setState((_state) => ({
        ..._state,
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

    ethereum.on('disconnect', () => {
      setState((_state) => ({ ..._state, isConnected: ethereum.isConnected() }))
    })

    detectEthereumProvider().then((provider: MetamaskProvider) =>
      setState((_state) => ({
        ..._state,
        provider: new providers.Web3Provider(provider),
      }))
    )

    if (connected) connect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * set default chain if it doesn't load automatically
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (state.chainId == null) {
        setState((_state) => ({ ..._state, chainId: 420 }))
      }
    }, 3000)
    return () => clearTimeout(timeout)
  }, [dispatch, state.chainId])

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
