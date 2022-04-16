import { useContext } from 'react'
import { ConnectionContext } from '../component/ConnectionProvider'

export const useConnectionContext = () => useContext(ConnectionContext)

export const useWallet = () => ({} as any)
