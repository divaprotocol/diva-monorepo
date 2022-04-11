import { ethers, Contract, BigNumber } from 'ethers'
import { config } from '../constants'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import ERC20 from '@diva/contracts/abis/erc20.json'
import { WhitelistCollateralToken, Pool } from '../lib/queries'
import { parseEther, parseUnits } from 'ethers/lib/utils'
import { useNetwork, useProvider, useSigner } from 'wagmi'

/**
 * Note: The order of parameters matter in this case,
 * please do not change them
 */
type DivaContract = Contract & {
  createContingentPool: (
    params: [
      referenceAsset: string,
      expiryTime: string,
      floor: BigNumber,
      inflection: BigNumber,
      cap: BigNumber,
      collateralBalanceShort: BigNumber,
      collateralBalanceLong: BigNumber,
      supplyPositionToken: BigNumber,
      collateralToken: string,
      dataProvider: string,
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
    expiryTime: number
    supplyPositionToken: number
    referenceAsset: string
    collateralToken: WhitelistCollateralToken
    dataProvider: string
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
  const provider = useProvider()
  const [{ data: signerData }] = useSigner()
  const [{ data: networkData }] = useNetwork()
  const chainId = networkData.chain?.id

  if (chainId == null || provider == null) return null

  const divaAddress = config[chainId].divaAddress

  const signer = signerData

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
        dataProvider,
        expiryTime,
        floor,
        inflection,
        referenceAsset,
        supplyPositionToken,
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

      const tx2 = await contract.createContingentPool([
        referenceAsset,
        Math.round(expiryTime / 1000).toString(),
        parseEther(floor.toString()),
        parseEther(inflection.toString()),
        parseEther(cap.toString()),
        collateralBalanceShort,
        collateralBalanceLong,
        parseEther(supplyPositionToken.toString()),
        collateralToken.id,
        dataProvider,
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
