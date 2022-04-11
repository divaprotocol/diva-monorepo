import request from 'graphql-request'
import { useQuery } from 'react-query'
import { config } from '../constants'
import { WhitelistQueryResponse, queryWhitelist } from '../lib/queries'
import { useNetwork } from 'wagmi'

export function useWhitelist() {
  const [{ data: networkData }] = useNetwork()
  const chainId = networkData.chain?.id

  const whitelistQuery = useQuery<WhitelistQueryResponse>(
    `whitelist-${chainId}`,
    () => request(config[chainId].whitelistSubgraph, queryWhitelist)
  )

  const dataFeeds = whitelistQuery.data?.dataFeeds
  const dataProviders = whitelistQuery.data?.dataProviders
  const collateralTokens = whitelistQuery.data?.collateralTokens

  const referenceAssets = (dataFeeds || [])
    .map((v) => v.referenceAssetUnified)
    .filter((value, index, self) => self.indexOf(value) === index)

  const getProvidersByAsset = (referenceAssetUnified: string) =>
    dataProviders?.filter((p) =>
      p.dataFeeds.some((f) => f.referenceAssetUnified === referenceAssetUnified)
    )

  return {
    dataFeeds,
    dataProviders,
    collateralTokens,
    referenceAssets,
    getProvidersByAsset,
  }
}
