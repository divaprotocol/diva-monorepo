import { BaseProvider, ExternalProvider } from '@ethersproject/providers'
import { createContext, useCallback, useEffect, useState } from 'react'
import { BigNumber, providers } from 'ethers'
import useLocalStorage from 'use-local-storage'
import detectEthereumProvider from '@metamask/detect-provider'
import { useDispatch } from 'react-redux'
import { setChainId, setUserAddress } from '../Redux/appSlice'
import WalletConnect from '@walletconnect/client'
import QRCodeModal from '@walletconnect/qrcode-modal'
import EthereumProvider from '@walletconnect/ethereum-provider'
import WalletConnectProvider from '@walletconnect/web3-provider'

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
  connect?: (walletName: string) => unknown
  disconnect?: () => unknown
  connector?: WalletConnect | undefined
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

// Create a connector for WalletConnect
const connector = new WalletConnect({
  bridge: 'https://bridge.walletconnect.org', // Required
  qrcodeModal: QRCodeModal,
})

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

  const connect = useCallback(async (walletName) => {
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
      // Check if connection is already established
      if (!connector.connected) {
        // create new session
        await connector.createSession()
      } else {
        // set existing session
        setState((_state) => ({
          ..._state,
          address: connector.accounts[0],
          chainId: BigNumber.from(connector.chainId).toNumber(),
          isConnected: connector.connected,
        }))
        setConnectionState({ connected: 'walletconnect' })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const disconnect = useCallback(() => {
    setState((_state) => ({
      ..._state,
      address: undefined,
      isConnected: false,
      chainId: 5,
    }))
    setConnectionState({})

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
    // Subscribe to connection events for WalletConnect
    if (connected === 'walletconnect') {
      connector.on('connect', (error, payload) => {
        if (error) {
          throw error
        }

        // Get provided accounts and chainId
        const { accounts, chainId } = payload.params[0]

        setState((_state) => ({
          ..._state,
          address: accounts[0],
          chainId: BigNumber.from(chainId).toNumber(),
          isConnected: connector.connected,
        }))
        setConnectionState({ connected: 'walletconnect' })
      })

      connector.on('session_update', (error, payload) => {
        if (error) {
          throw error
        }
        // Get updated accounts and chainId
        const { accounts, chainId } = payload.params[0]

        setState((_state) => ({
          ..._state,
          address: accounts[0],
          chainId: BigNumber.from(chainId).toNumber(),
          isConnected: connector.connected,
        }))
      })

      connector.on('disconnect', (error) => {
        if (error) {
          throw error
        }

        setState((_state) => ({
          ..._state,
          address: undefined,
          isConnected: false,
          chainId: 5,
        }))
        setConnectionState({})
      })

      connect('walletconnect')
    }
  }, [connect, connected, setConnectionState])

  // active the walletconnect provider and set the provider in the state
  useEffect(() => {
    if (connected === 'walletconnect') {
      const activateProvider = async () => {
        const provider = new WalletConnectProvider({
          infuraId: '1e5c07a07eb244a6be23cfa590d59ef5', // Required
        })
        await provider.enable()

        setState((_state) => ({
          ..._state,
          provider: new providers.Web3Provider(provider),
        }))
      }

      activateProvider()
        .then(() => {
          console.log('activated')
        })
        .catch((e) => {
          console.warn('Error in initializing the wallets connect provider', e)
        })
    }
  }, [connected])

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
        return connector.sendCustomRequest({ method, params })
      }
      if (connected === 'metamask') {
        return ethereum.request({ method, params })
      }
      return null
    },
    [connected]
  )

  const value = {
    connector,
    connect,
    disconnect,
    sendTransaction,
    ...state,
  }

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  )
}
