import { useWallet } from '@web3-ui/hooks'
import request from 'graphql-request'
import { useQuery } from 'react-query'
import { config } from '../constants'
import { WhitelistQueryResponse, queryWhitelist } from '../lib/queries'

export function useWhitelist() {
  const { provider } = useWallet()
  const chainId = provider?.network?.chainId

  const whitelistQuery = useQuery<WhitelistQueryResponse>('whitelist', () =>
    request(config[chainId].whitelistSubgraph, queryWhitelist)
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

  const isWhitelistedDataFeed = () => {}

  const isWhitelistedDataProvider = () => {}
  console.log('use whitelist ')

  return {
    dataFeeds,
    dataProviders,
    referenceAssets,
    getProvidersByAsset,
  }
}
