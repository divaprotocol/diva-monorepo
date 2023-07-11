import { ethers } from 'ethers'
import ERC20Abi from '../abi/ERC20ABI.json'

import { useEffect, useState } from 'react'
import { formatUnits } from 'ethers/lib/utils'
import { useConnectionContext } from './useConnectionContext'
import { selectChainId, selectUserAddress } from '../Redux/appSlice'
import { useAppSelector } from '../Redux/hooks'

/**
 * useBalance
 ****
 * returns the balance of a token. If no token address is provided,
 * no balance is returned
 */
export function useErcBalance(address?: string, updated = true) {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState(null)
  const [balance, setBalance] = useState<string | null>(null)

  const { provider } = useConnectionContext()
  const chainId = useAppSelector(selectChainId)
  const userAddress = useAppSelector(selectUserAddress)

  useEffect(() => {
    let isCancelled = false

    const fetchBalance = async () => {
      if (!provider || !chainId || !address) return

      const signer = await provider.getSigner()
      const contract = new ethers.Contract(address, ERC20Abi, signer)

      setIsLoading(true)
      try {
        const _balance = await contract.balanceOf(userAddress)
        setBalance(formatUnits(_balance.toString(), await contract.decimals()))
        setError(null)
      } catch (err) {
        if (!isCancelled) {
          setError(err)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchBalance()

    return () => {
      isCancelled = true
    }
  }, [chainId, address, userAddress, updated, provider])

  return { balance, isLoading, error }
}
