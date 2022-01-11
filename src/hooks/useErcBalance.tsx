import { useWeb3React } from '@web3-react/core'
import { ethers, Contract, BigNumber } from 'ethers'
import { chainIdtoName } from '../Util/chainIdToName'
import ERC20 from '../abi/ERC20.json'

import { useEffect, useState } from 'react'
import { formatEther } from 'ethers/lib/utils'

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
  const { chainId } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )
  const [balance, setBalance] = useState<string>()

  useEffect(() => {
    const run = async () => {
      const signer = provider.getSigner()
      if (chainId != null && address != null) {
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
  }, [address, chainId])

  return balance
}
