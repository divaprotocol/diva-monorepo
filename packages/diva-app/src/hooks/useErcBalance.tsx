import { ethers, Contract, BigNumber } from 'ethers'
import ERC20 from '@diva/contracts/abis/erc20.json'

import { useEffect, useState } from 'react'
import { formatUnits } from 'ethers/lib/utils'
import { useConnectionContext } from './useConnectionContext'

type Erc20Contract = Contract & {
  balanceOf: (address: string) => Promise<BigNumber>
}

/**
 * useBalance
 ****
 * returns the balance of a token. If no token address is provided,
 * no balance is returned
 */
export function useErcBalance(address?: string) {
  const { chainId, provider, address: account } = useConnectionContext()

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
          const myAddress = await signer.getAddress()
          const _balance = await contract.balanceOf(myAddress)
          setBalance(formatUnits(_balance, await contract.decimals()))
        } catch (err) {
          console.warn(err)
        }
      }
    }

    run()
  }, [address, chainId, account != null])

  return balance
}
