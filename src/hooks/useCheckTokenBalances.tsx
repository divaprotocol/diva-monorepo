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

  const balances = useQuery<string[]>(
    'balance',
    async () => {
      const balances: any[] = await Promise.all(
        tokenAddresses.map(async (tokenAddress) => {
          const contract = new ethers.Contract(tokenAddress, ERC20, provider)
          try {
            const res = await contract.balanceOf(account)
            if (res.gt(BigNumber.from(0))) {
              return tokenAddress
            }
          } catch (error) {
            console.error(error)
          }
        })
      )
      return balances
    },
    { cacheTime: 5 }
  )
  if (balances.isSuccess) {
    return balances.data.filter((bal) => bal !== undefined)
  }
}
