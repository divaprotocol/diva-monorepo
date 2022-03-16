import { ethers, Contract, BigNumber } from 'ethers'
import { config } from '../constants'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import ERC20 from '@diva/contracts/abis/erc20.json'
import { CollateralToken, Pool } from '../lib/queries'
import { parseEther, parseUnits } from 'ethers/lib/utils'
import { useWallet } from '@web3-ui/hooks'

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
      dataFeedProvider: string,
      capacity: BigNumber
    ]
  ) => Promise<any>
  getPoolParametersById: (id: string) => Promise<Pool>
  setFinalReferenceValueById: (
    poolId: string,
    finalReferenceValue: string,
    allowChallenge: boolean
  ) => Promise<void>
  challengeFinalReferenceValue: (
    poolId: string,
    referenceValue: number
  ) => Promise<void>
}

type DivaApi = {
  challengeFinalReferenceValue: (props: {
    poolId: string
    referenceValue: number
  }) => Promise<void>
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
    collateralToken: CollateralToken
    dataFeedProvider: string
    capacity: number
  }) => Promise<void>
  getPoolParametersById: (id: string) => Promise<Pool>
  setFinalReferenceValueById: (props: {
    poolId: string
    finalReferenceValue: string
    allowChallenge: boolean
  }) => Promise<void>
}

export function useDiva(): DivaApi | null {
  const { provider } = useWallet()
  const chainId = provider?.network?.chainId

  if (chainId == null || provider == null) return null

  const divaAddress = config[chainId].divaAddress

  const signer = provider.getSigner()

  const contract = new ethers.Contract(
    divaAddress,
    DIVA_ABI,
    signer
  ) as DivaContract

  return {
    /***
     * Proxy method for contract method of same name
     */
    createContingentPool: async (props) => {
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
        capacity,
      } = props
      const erc20 = new ethers.Contract(collateralToken.id, ERC20, signer)
      const collateralBalanceShort = parseUnits(
        _collateralBalanceShort.toString(),
        collateralToken.decimals
      )
      const collateralBalanceLong = parseUnits(
        _collateralBalanceLong.toString(),
        collateralToken.decimals
      )

      const creatorAddress = await signer.getAddress()
      const tx = await erc20.approve(
        divaAddress,
        collateralBalanceLong.add(collateralBalanceShort)
      )
      await tx.wait()

      await erc20.allowance(creatorAddress, divaAddress)

      console.log([
        parseEther(inflection.toString()).toString(),
        parseEther(cap.toString()).toString(),
        parseEther(floor.toString()).toString(),
        collateralBalanceShort,
        collateralBalanceLong,
        Math.round(expiryDate / 1000),
        parseEther(supplyShort.toString()).toString(),
        parseEther(supplyLong.toString()).toString(),
        referenceAsset,
        collateralToken,
        dataFeedProvider,
        parseEther(capacity.toString()).toString(),
      ])
      const tx2 = await contract.createContingentPool([
        parseEther(inflection.toString()),
        parseEther(cap.toString()),
        parseEther(floor.toString()),
        collateralBalanceShort,
        collateralBalanceLong,
        Math.round(expiryDate / 1000).toString(),
        parseEther(supplyShort.toString()),
        parseEther(supplyLong.toString()),
        referenceAsset,
        collateralToken.id,
        dataFeedProvider,
        parseEther(capacity.toString()),
      ])

      const val = await tx2.wait()

      return val
    },
    getPoolParametersById: (id: string) => {
      return contract.getPoolParametersById(id).then((val) => {
        return val
      })
    },
    challengeFinalReferenceValue: () => {
      return Promise.resolve()
    },
    setFinalReferenceValueById: () => {
      return Promise.resolve()
    },
  }
}
