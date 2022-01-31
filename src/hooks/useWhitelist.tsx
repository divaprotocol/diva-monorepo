import { useWallet } from '@web3-ui/hooks'
import request from 'graphql-request'
import { useQuery } from 'react-query'
import { config } from '../constants'
import { WhitelistQueryResponse, queryWhitelist } from '../lib/queries'

export function useWhitelist() {
  const { provider } = useWallet()
  const chainId = provider?.network?.chainId

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

  const isWhitelistedDataFeed = () => true

  const isWhitelistedDataProvider = () => true

  return {
    dataFeeds,
    dataProviders,
    collateralTokens,
    referenceAssets,
    getProvidersByAsset,
    isWhitelistedDataFeed,
    isWhitelistedDataProvider,
  }
}
