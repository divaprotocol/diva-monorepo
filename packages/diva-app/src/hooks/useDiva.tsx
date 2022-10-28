import { ethers, Contract, BigNumber } from 'ethers'
import { config } from '../constants'
import DIVA_ABI from '../abi/DIVAABI.json'
import ERC20 from '../abi/ERC20ABI.json'
import { WhitelistCollateralToken, Pool } from '../lib/queries'
import { parseUnits } from 'ethers/lib/utils'
import { useConnectionContext } from './useConnectionContext'
import { useAppSelector } from '../Redux/hooks'
import { selectChainId } from '../Redux/appSlice'

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
      gradient: BigNumber,
      collateralBalance: BigNumber,
      collateralToken: string,
      dataProvider: string,
      capacity: BigNumber,
      longRecipient: string,
      shortRecipient: string,
      permissionedERC721Token: string
    ]
  ) => Promise<any>
  getPoolParameters: (id: string) => Promise<Pool>
  setFinalReferenceValue: (
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
    referenceAsset: string
    expiryTime: number
    floor: number
    inflection: number
    cap: number
    gradient: number
    collateralBalance: number
    collateralToken: WhitelistCollateralToken
    dataProvider: string
    capacity: number
    longRecipient: string
    shortRecipient: string
    permissionedERC721Token: string
  }) => Promise<void>
  getPoolParameters: (id: string) => Promise<Pool>
  setFinalReferenceValue: (props: {
    poolId: string
    finalReferenceValue: string
    allowChallenge: boolean
  }) => Promise<void>
}

export function useDiva(): DivaApi | null {
  const { provider } = useConnectionContext()
  const chainId = useAppSelector(selectChainId)

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
        referenceAsset,
        expiryTime,
        floor,
        inflection,
        cap,
        gradient,
        collateralBalance: _collateralBalance,
        collateralToken,
        dataProvider,
        capacity,
        longRecipient,
        shortRecipient,
        permissionedERC721Token,
      } = props
      const erc20 = new ethers.Contract(collateralToken.id, ERC20, signer)
      const collateralBalance = parseUnits(
        _collateralBalance.toString(),
        collateralToken.decimals
      )

      const creatorAddress = await signer.getAddress()
      const allowance = await erc20.allowance(creatorAddress, divaAddress)

      /*** in order to avoid redundant approvals we only need to approve if collateral is
       greater than already approved balance
       */
      if (allowance.lt(collateralBalance)) {
        try {
          const tx = await erc20.approve(divaAddress, collateralBalance)
          await tx.wait()
        } catch (e) {
          console.error(e)
        }
      } // QUESTION Is this function still relevant? Approve and create are now two separate processes

      const tx2 = await contract.createContingentPool([
        referenceAsset,
        Math.round(expiryTime / 1000).toString(),
        parseUnits(floor.toString()),
        parseUnits(inflection.toString()),
        parseUnits(cap.toString()),
        parseUnits(gradient.toString(), collateralToken.decimals),
        collateralBalance,
        collateralToken.id,
        dataProvider,
        parseUnits(capacity.toString(), collateralToken.decimals),
        longRecipient,
        shortRecipient,
        permissionedERC721Token,
      ])

      const val = await tx2.wait()

      return val
    },
    getPoolParameters: (id: string) => {
      return contract.getPoolParameters(id).then((val) => {
        return val
      })
    },
    challengeFinalReferenceValue: () => {
      return Promise.resolve()
    },
    setFinalReferenceValue: () => {
      return Promise.resolve()
    },
  }
}
