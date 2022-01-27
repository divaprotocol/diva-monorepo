import { ethers, Contract, BigNumber } from 'ethers'
import { config } from '../constants'
import DIVA_ABI from '../abi/DIVA.json'
import ERC20 from '../abi/ERC20.json'
import { Pool } from '../lib/queries'
import { parseEther } from 'ethers/lib/utils'
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
      const erc20 = new ethers.Contract(collateralToken, ERC20, signer)
      const collateralBalanceShort = parseEther(
        _collateralBalanceShort.toString()
      )
      const collateralBalanceLong = parseEther(
        _collateralBalanceLong.toString()
      )

      const creatorAddress = await signer.getAddress()
      const tx = await erc20.approve(
        divaAddress,
        collateralBalanceLong.add(collateralBalanceShort)
      )
      await tx.wait()

      await erc20.allowance(creatorAddress, divaAddress)

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
        collateralToken,
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
    setFinalReferenceValueById: () => {
      return Promise.resolve()
    },
  }
}
