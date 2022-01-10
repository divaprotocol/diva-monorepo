import { useWeb3React } from '@web3-react/core'
import { BigNumber, ethers } from 'ethers'
import ERC20 from '../contracts/abis/ERC20.json'
import { chainIdtoName } from '../Util/chainIdToName'
import { useQuery } from 'react-query'

export function useCheckTokenBalance(tokenAddress: string) {
  const { account, chainId } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )
  const contract = new ethers.Contract(tokenAddress, ERC20, provider)
  return useQuery<BigNumber>('balance', () =>
    contract.balanceOf(account).then((balance: BigNumber) => balance)
  )
}
