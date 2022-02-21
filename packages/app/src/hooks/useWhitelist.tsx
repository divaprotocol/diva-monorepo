import request from 'graphql-request'
import { useQuery } from 'react-query'
import { config } from '../constants'
import { WhitelistQueryResponse, queryWhitelist } from '../lib/queries'
import { useWeb3React } from '@web3-react/core'

export function useWhitelist() {
  const { chainId = 3 } = useWeb3React()

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
