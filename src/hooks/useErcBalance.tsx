import { ethers, Contract, BigNumber } from 'ethers'
import ERC20 from '../abi/ERC20.json'

import { useEffect, useState } from 'react'
import { formatEther } from 'ethers/lib/utils'
import { useWallet } from '@web3-ui/hooks'

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
  const { connection, provider } = useWallet()
  const chainId = provider?.network?.chainId
  const account = connection.userAddress

  const [balance, setBalance] = useState<string>()

  useEffect(() => {
    const run = async () => {
      if (provider != null && chainId != null && address != null) {
        const signer = provider.getSigner()
        console.log({ address, signer })
        try {
          const contract = new ethers.Contract(
            address,
            ERC20,
            signer
          ) as Erc20Contract
          const myAddress = await signer.getAddress()
          const _balance = await contract.balanceOf(myAddress)
          setBalance(formatEther(_balance))
        } catch (err) {
          console.error(err)
        }
      }
    }

    run()
  }, [address, chainId, account != null])

  return balance
}
