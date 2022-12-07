import { BaseProvider, ExternalProvider } from '@ethersproject/providers'
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { BigNumber, providers } from 'ethers'
import useLocalStorage from 'use-local-storage'
import detectEthereumProvider from '@metamask/detect-provider'
import { useDispatch } from 'react-redux'
import { setChainId, setUserAddress } from '../Redux/appSlice'
import WalletConnectProvider from '@walletconnect/web3-provider'
import Web3 from 'web3'

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
  getWeb3JsProvider?: () => Promise<Web3>
}

type ConnectionContextType = {
  connect?: (walletName: string) => unknown
  disconnect?: () => unknown
  sendTransaction?: ({
    method,
    params,
  }: {
    method: string
    params: any[]
  }) => Promise<any>
} & ConnectionContextState

export const ConnectionContext = createContext<ConnectionContextType>({})

const ethereum = window.ethereum

export const ConnectionProvider = ({ children }) => {
  const [refreshProvider, setRefreshProvider] = useState(false)

  const provider = useMemo(() => {
    return new WalletConnectProvider({
      infuraId: process.env.REACT_APP_INFURA_KEY, // Required
      clientMeta: {
        description: 'Diva Dapp',
        url: 'https://www.divaprotocol.io/',
        icons: ['https://www.divaprotocol.io/favicon.ico'],
        name: 'Diva Dapp',
      },
    })
  }, [refreshProvider])

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

  const connect = useCallback(
    async (walletName) => {
      if (walletName === 'metamask') {
        const accounts = await ethereum.request({
          method: 'eth_requestAccounts',
        })
        setState((_state) => ({
          ..._state,
          address: accounts[0],
          chainId: BigNumber.from(ethereum.chainId).toNumber(),
          isConnected: ethereum.isConnected() && accounts.length > 0,
        }))
        setConnectionState({ connected: 'metamask' })
      }
      if (walletName === 'walletconnect') {
        try {
          const accounts = await provider.enable()
          setConnectionState({ connected: 'walletconnect' })
          const web3Provider = new providers.Web3Provider(provider)
          setState((_state) => ({
            ..._state,
            address: accounts[0].toLowerCase(),
            chainId: BigNumber.from(provider.chainId).toNumber(),
            isConnected: provider.connected,
            provider: web3Provider,
          }))
        } catch (error) {
          console.log(error)
          provider.disconnect()
          setRefreshProvider((prev) => !prev)
        }
      }
    },
    [provider, setConnectionState]
  )

  useEffect(() => {
    if (connected === 'walletconnect') {
      connect('walletconnect')
    }
  }, [connect, connected])

  const disconnect = useCallback(() => {
    setConnectionState({})
    setState((_state) => ({
      ..._state,
      address: undefined,
      isConnected: false,
      chainId: 5,
      provider: undefined,
    }))
    provider.disconnect()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (connected === 'metamask') {
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
            connect('metamask')
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
        setState((_state) => ({
          ..._state,
          isConnected: ethereum.isConnected(),
        }))
      })

      detectEthereumProvider().then((provider: MetamaskProvider) => {
        setState((_state) => ({
          ..._state,
          provider: new providers.Web3Provider(provider),
        }))
      })

      connect('metamask')
    }
  }, [connect, connected, disconnect])

  useEffect(() => {
    if (connected === 'walletconnect') {
      provider.on('accountsChanged', (accounts: string[]) => {
        setState((_state) => ({
          ..._state,
          address: accounts[0],
        }))
      })

      // Subscribe to chainId change
      provider.on('chainChanged', (chainId: number) => {
        setState((_state) => ({
          ..._state,
          chainId: BigNumber.from(chainId).toNumber(),
        }))
      })
    }
  }, [provider, connected])

  /**
   * set default chain if it doesn't load automatically
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (state.chainId == null) {
        setState((_state) => ({ ..._state, chainId: 5 }))
      }
    }, 3000)
    return () => clearTimeout(timeout)
  }, [dispatch, state.chainId])

  // actions for wallets
  const sendTransaction = useCallback(
    async ({ method, params }: { method: string; params: any[] }) => {
      if (connected === 'walletconnect') {
        return await provider.request({ method, params })
      }
      if (connected === 'metamask') {
        return ethereum.request({ method, params })
      }
      return null
    },
    [connected]
  )

  const getWeb3JsProvider = useCallback(async () => {
    if (connected === 'walletconnect') {
      return new Web3(provider as any)
    }

    return new Web3(Web3.givenProvider)
  }, [connected, provider])

  const value = {
    connect,
    disconnect,
    sendTransaction,
    getWeb3JsProvider,
    ...state,
  }

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  )
}
