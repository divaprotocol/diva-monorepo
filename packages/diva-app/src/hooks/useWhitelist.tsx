import request from 'graphql-request'
import { useQuery } from 'react-query'
import { config } from '../constants'
import { WhitelistQueryResponse, queryWhitelist } from '../lib/queries'
import { selectChainId } from '../Redux/appSlice'
import { useAppSelector } from '../Redux/hooks'

export function useWhitelist() {
  const chainId = useAppSelector(selectChainId)

  const whitelistQuery = useQuery<WhitelistQueryResponse>(
    `whitelist-${chainId}`,
    () => request(config[chainId].whitelistSubgraph, queryWhitelist)
  )

  let dataProviders
  let collateralTokens
  let referenceAssets

  const dataFeeds = whitelistQuery.data?.dataFeeds

  if (chainId === 137 || chainId === 80001) {
    dataProviders = config[chainId].dataProviders
    collateralTokens = config[chainId].collateralTokens
    referenceAssets = config[chainId].referenceAssets

    const getProvidersByAsset = (referenceAssetUnified: string) =>
      dataProviders?.filter((p) =>
        p.dataFeeds.some(
          (f) => f.referenceAssetUnified === referenceAssetUnified
        )
      )

    return {
      dataFeeds,
      dataProviders,
      collateralTokens,
      referenceAssets,
      getProvidersByAsset,
    }
  } else {
    dataProviders = whitelistQuery.data?.dataProviders
    collateralTokens = whitelistQuery.data?.collateralTokens

    referenceAssets = (dataFeeds || [])
      .filter((v) => v.active)
      .map((v) => {
        return v.referenceAssetUnified
      })
      .filter((value, index, self) => self.indexOf(value) === index)

    const getProvidersByAsset = (referenceAssetUnified: string) =>
      dataProviders?.filter((p) =>
        p.dataFeeds.some(
          (f) => f.referenceAssetUnified === referenceAssetUnified
        )
      )

    return {
      dataFeeds,
      dataProviders,
      collateralTokens,
      referenceAssets,
      getProvidersByAsset,
    }
  }
}
