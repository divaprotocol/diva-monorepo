import { useWeb3React } from '@web3-react/core'
import { ethers, Contract, BigNumber } from 'ethers'
import { addresses } from '../config'
import { chainIdtoName } from '../Util/chainIdToName'
import DIVA_ABI from '../contracts/abis/DIVA.json'
import ERC20 from '../contracts/abis/ERC20.json'
import { Pool } from '../lib/queries'
import { parseEther } from 'ethers/lib/utils'

/**
 * Note: The order of parameters matter in this case,
 * please do not change them
 */
type DivaContract = Contract & {
  createContingentPool: (
    params: [
      inflection: BigNumber,
      cap: BigNumber,
      floor: BigNumber,
      collateralBalanceShort: BigNumber,
      collateralBalanceLong: BigNumber,
      expiryDate: string,
      supplyShort: BigNumber,
      supplyLong: BigNumber,
      referenceAsset: string,
      collateralToken: string,
      dataFeedProvider: string
    ]
  ) => Promise<any>
  getPoolParametersById: (id: string) => Promise<Pool>
  setFinalReferenceValueById: (
    poolId: string,
    finalReferenceValue: string,
    allowChallenge: boolean
  ) => Promise<void>
}

type DivaApi = {
  createContingentPool: (props: {
    inflection: number
    cap: number
    floor: number
    collateralBalanceShort: number
    collateralBalanceLong: number
    expiryDate: number
    supplyShort: number
    supplyLong: number
    referenceAsset: string
    collateralToken: string
    dataFeedProvider: string
  }) => Promise<void>
  getPoolParametersById: (id: string) => Promise<Pool>
  setFinalReferenceValueById: (props: {
    poolId: string
    finalReferenceValue: string
    allowChallenge: boolean
  }) => Promise<void>
}

export function useDiva(): DivaApi | null {
  const { chainId } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )
  if (chainId == null) return null

  const divaAddress = addresses[chainId].divaAddress

  const signer = provider.getSigner()

  const contract = new ethers.Contract(
    divaAddress,
    DIVA_ABI,
    signer
  ) as DivaContract

  return {
    createContingentPool: async (props) => {
      console.log(props)
      const {
        cap,
        collateralBalanceLong: _collateralBalanceLong,
        collateralBalanceShort: _collateralBalanceShort,
        collateralToken,
        dataFeedProvider,
        expiryDate,
        floor,
        inflection,
        referenceAsset,
        supplyLong,
        supplyShort,
      } = props
      const erc20 = new ethers.Contract(collateralToken, ERC20, signer)
      const collateralBalanceShort = parseEther(
        _collateralBalanceShort.toString()
      )
      const collateralBalanceLong = parseEther(
        _collateralBalanceLong.toString()
      )

      const creatorAddress = await signer.getAddress()
      console.info('approve', {
        collateralToken,
        amount: collateralBalanceLong.add(collateralBalanceShort).toString(),
      })
      await erc20.approve(
        collateralToken,
        collateralBalanceLong.add(collateralBalanceShort)
      )

      console.log('allowance', { creatorAddress, divaAddress })
      await erc20.allowance(creatorAddress, divaAddress)

      console.log('createContingentPool', [
        parseEther(inflection.toString()).toString(),
        parseEther(cap.toString()).toString(),
        parseEther(floor.toString()).toString(),
        collateralBalanceShort.toString(),
        collateralBalanceLong.toString(),
        Math.round(expiryDate / 1000).toString(),
        parseEther(supplyShort.toString()).toString(),
        parseEther(supplyLong.toString()).toString(),
        referenceAsset,
        collateralToken,
        dataFeedProvider,
      ])

      const tx = await contract.createContingentPool([
        parseEther(inflection.toString()),
        parseEther(cap.toString()),
        parseEther(floor.toString()),
        collateralBalanceShort,
        collateralBalanceLong,
        Math.round(expiryDate / 1000).toString(),
        parseEther(supplyShort.toString()),
        parseEther(supplyLong.toString()),
        referenceAsset,
        collateralToken,
        dataFeedProvider,
      ])
      const pool = await tx
      console.log(pool)
    },
    getPoolParametersById: (id: string) => {
      return contract.getPoolParametersById(id).then((val) => {
        return val
      })
    },
    setFinalReferenceValueById: () => {
      return Promise.resolve()
    },
  }
}
