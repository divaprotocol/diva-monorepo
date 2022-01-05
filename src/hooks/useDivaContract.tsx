import { useWeb3React } from '@web3-react/core'
import { ethers, Contract, BigNumber } from 'ethers'
import { addresses } from '../config'
import { chainIdtoName } from '../Util/chainIdToName'
import DIVA_ABI from '../contracts/abis/DIVA.json'
import { Pool } from '../lib/queries'

type DivaContract = Contract & {
  createContingentPool: (
    params: [
      inflection: BigNumber,
      cap: BigNumber,
      floor: BigNumber,
      collateralBalanceShort: BigNumber,
      collateralBalanceLong: BigNumber,
      expiryDate: BigNumber,
      supplyShort: BigNumber,
      supplyLong: BigNumber,
      referenceAsset: string,
      collateralToken: string,
      dataFeedProvider: string
    ]
  ) => Promise<void>
  getPoolParametersById: (id: string) => Promise<Pool>
  setFinalReferenceValueById: (
    poolId: string,
    finalReferenceValue: string,
    allowChallenge: boolean
  ) => Promise<void>
}

export function useDivaContract() {
  const { chainId } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )

  if (chainId == null) return null

  return new ethers.Contract(
    addresses[chainId].divaAddress,
    DIVA_ABI,
    provider.getSigner()
  ) as DivaContract
}
