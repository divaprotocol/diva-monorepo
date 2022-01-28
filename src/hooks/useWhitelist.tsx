import request from 'graphql-request'
import { useQuery } from 'react-query'
import { WhitelistQueryResponse, queryWhitelist } from '../lib/queries'

export function useWhitelist() {
  const { provider } = useWallet()

  const whitelistQuery = useQuery<WhitelistQueryResponse>('whitelist', () =>
    request(whiteListEndpoint, queryWhitelist)
  )

  const dataFeeds = whitelistQuery.data?.dataFeeds
  const dataProviders = whitelistQuery.data?.dataProviders
  const referenceAssets = (dataFeeds || [])
    .map((v) => v.referenceAssetUnified)
    .filter((value, index, self) => self.indexOf(value) === index)

  const getProvidersByAsset = (referenceAssetUnified: string) =>
    dataProviders?.filter((p) =>
      p.dataFeeds.some((f) => f.referenceAssetUnified === referenceAssetUnified)
    )

  const isWhitelistedDataFeed = () => {

  }

  const isWhitelistedDataProvider = () => {

  }

  return {
    dataFeeds,
    dataProviders,
    referenceAssets,
    getProvidersByAsset,
  }
}
