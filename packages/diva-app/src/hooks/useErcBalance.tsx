import { ethers, Contract, BigNumber } from 'ethers'
import ERC20 from '../abi/ERC20ABI.json'

import { useEffect, useState } from 'react'
import { formatUnits } from 'ethers/lib/utils'
import { useConnectionContext } from './useConnectionContext'
import { selectUserAddress, selectChainId } from '../Redux/appSlice'
import { useAppSelector } from '../Redux/hooks'

type Erc20Contract = Contract & {
  balanceOf: (address: string) => Promise<BigNumber>
}

/**
 * useBalance
 ****
 * returns the balance of a token. If no token address is provided,
 * no balance is returned
 */
export function useErcBalance(address?: string, updated = true) {
  const { provider } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector(selectChainId)

  const [balance, setBalance] = useState<string>()

  useEffect(() => {
    const run = async () => {
      if (provider != null && chainId != null && address != null) {
        const signer = provider.getSigner()
        try {
          const contract = new ethers.Contract(
            address,
            ERC20,
            signer
          ) as Erc20Contract
          /* const myAddress = await signer.getAddress() */
          const _balance = await contract.balanceOf(userAddress)
          setBalance(formatUnits(_balance, await contract.decimals()))
        } catch (err) {
          console.warn(err)
        }
      }
    }

    run()
  }, [address, chainId, userAddress, updated])

  return balance
}
