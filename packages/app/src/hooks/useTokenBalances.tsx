import { BigNumber, ethers } from 'ethers'
import ERC20 from '../abi/ERC20.json'
import { useQuery } from 'react-query'
import { useWallet } from '@web3-ui/hooks'

type Response = {
  [token: string]: BigNumber
}

export function useTokenBalances(tokenAddresses: string[]) {
  const {
    connection: { userAddress },
    provider,
  } = useWallet()

  const balances = useQuery<Response>(
    `balance-${userAddress}`,
    async () => {
      const response: Response = {}
      if (provider != null) {
        await Promise.all(
          tokenAddresses.map(async (tokenAddress) => {
            const contract = new ethers.Contract(tokenAddress, ERC20, provider)
            try {
              const res: BigNumber = await contract.balanceOf(userAddress)
              response[tokenAddress] = res
            } catch (error) {
              console.error(error)
            }
          })
        )
      }
      return response
    },
    { cacheTime: 5 }
  )

  return balances.data
}
