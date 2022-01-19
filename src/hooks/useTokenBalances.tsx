import { useWeb3React } from '@web3-react/core'
import { BigNumber, ethers } from 'ethers'
import ERC20 from '../abi/ERC20.json'
import { chainIdtoName } from '../Util/chainIdToName'
import { useQuery } from 'react-query'

type Response = {
  [token: string]: BigNumber
}

export function useTokenBalances(tokenAddresses: string[]) {
  const { account, chainId } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )

  const balances = useQuery<Response>(
    'balance',
    async () => {
      const response: Response = {}
      await Promise.all(
        tokenAddresses.map(async (tokenAddress) => {
          const contract = new ethers.Contract(tokenAddress, ERC20, provider)
          try {
            const res: BigNumber = await contract.balanceOf(account)
            response[tokenAddress] = res
          } catch (error) {
            console.error(error)
          }
        })
      )

      return response
    },
    { cacheTime: 5 }
  )

  return balances.data
}
