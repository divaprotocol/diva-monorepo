import { useWeb3React } from '@web3-react/core'
import { ethers, Contract, BigNumber } from 'ethers'
import { addresses } from '../config'
import { chainIdtoName } from '../Util/chainIdToName'
import ERC20 from '../contracts/abis/ERC20.json'

import { Pool } from '../lib/queries'
import { useEffect } from 'react'

type Erc20Contract = Contract & {
  balanceOf: (address: string) => Promise<any>
}

export function useErc20Balance(address?: string) {
  const { chainId } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )

  useEffect(() => {
    const run = async () => {
      console.log('run', chainId, address)
      if (chainId != null && address != null) {
        console.log('run 2')
        const signer = provider.getSigner()
        const contract = new ethers.Contract(
          address,
          ERC20,
          signer
        ) as Erc20Contract
        const myAddress = await signer.getAddress()
        const balance = await contract.balanceOf(myAddress)
        console.log({ balance })
      }
    }

    run()
  }, [address, chainId])
}
