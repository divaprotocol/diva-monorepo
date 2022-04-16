import { ethers, Contract, BigNumber } from 'ethers'
import ERC20 from '@diva/contracts/abis/erc20.json'

import { useEffect, useState } from 'react'
import { formatUnits } from 'ethers/lib/utils'
import {
  useAccount,
  useContract,
  useNetwork,
  useProvider,
  useSigner,
} from 'wagmi'

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
  const [{ data: accountData }] = useAccount({
    fetchEns: true,
  })
  const account = accountData?.address
  const provider = useProvider()
  const [{ data: signerData }] = useSigner()
  const [{ data: networkData }] = useNetwork()
  const chainId = networkData?.chain?.id
  const [balance, setBalance] = useState<string>()
  useEffect(() => {
    const run = async () => {
      if (provider != null && chainId != null && address != null) {
        const contract = new ethers.Contract(address, ERC20, signerData)
        try {
          const myAddress = accountData?.address
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
