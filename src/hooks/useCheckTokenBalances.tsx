import { useWeb3React } from '@web3-react/core'
import { BigNumber, ethers } from 'ethers'
import ERC20 from '../contracts/abis/ERC20.json'
import { chainIdtoName } from '../Util/chainIdToName'
import { useQuery } from 'react-query'

export function useCheckTokenBalances(tokenAddresses: string[]) {
  const { account, chainId } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )

  const query = useQuery<BigNumber[]>('balance', async () => {
    const balances = await Promise.all(
      tokenAddresses.map(async (tokenAddress) => {
        const contract = new ethers.Contract(tokenAddress, ERC20, provider)

        try {
          const res = await contract.balanceOf(account)
          return res
        } catch (error) {
          console.error(error)
        }
      })
    )
    return balances
  })
  return query
}
