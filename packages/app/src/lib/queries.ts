import gql from 'graphql-tag'
import { BigNumber } from 'ethers'

export type Pool = {
  cap: string
  capacity: BigNumber
  collateralBalanceLong: string
  collateralBalanceLongInitial: string
  collateralBalanceShort: string
  collateralBalanceShortInitial: string
  collateralToken: string
  collateralSymbol: string
  collateralTokenName: string
  collateralDecimals: number
  dataFeedProvider: string
  expiryDate: string
  finalReferenceValue: string
  floor: string
  id: string
  inflection: string
  longToken: string
  redemptionAmountLongToken: string
  redemptionAmountShortToken: string
  redemptionFee: string
  referenceAsset: string
  settlementFee: string
  shortToken: string
  statusFinalReferenceValue: string
  statusTimestamp: string
  supplyLong: string
  supplyLongInitial: string
  supplyShort: string
  supplyShortInitial: string
  createdBy: string
}

export const queryPools = gql`
  {
    pools {
      id
      referenceAsset
      inflection
      cap
      floor
      supplyShortInitial
      supplyLongInitial
      supplyShort
      supplyLong
      expiryDate
      collateralToken
      collateralSymbol
      collateralTokenName
      collateralDecimals
      collateralBalanceShortInitial
      collateralBalanceLongInitial
      collateralBalanceShort
      collateralBalanceLong
      shortToken
      longToken
      finalReferenceValue
      statusFinalReferenceValue
      redemptionAmountLongToken
      redemptionAmountShortToken
      statusTimestamp
      dataFeedProvider
      redemptionFee
      settlementFee
      createdBy
    }
  }
`

export const queryPool = (poolId: number) => gql`
  {
    pool(id: ${poolId}) {
      id
      referenceAsset
      inflection
      cap
      floor
      supplyShortInitial
      supplyLongInitial
      supplyShort
      supplyLong
      expiryDate
      collateralToken
      collateralSymbol
      collateralBalanceShortInitial
      collateralBalanceLongInitial
      collateralBalanceShort
      collateralDecimals
      collateralBalanceLong
      collateralDecimals
      shortToken
      longToken
      finalReferenceValue
      statusFinalReferenceValue
      redemptionAmountLongToken
      redemptionAmountShortToken
      statusTimestamp
      dataFeedProvider
      redemptionFee
      settlementFee
    }
  }
`

export type DataFeed = {
  dataProvider: {
    id: string
  }
  id: string
  referenceAsset: string
  referenceAssetUnified: string
}

export type DataProvider = {
  dataFeeds: { id: string; referenceAssetUnified: string }[]
  id: string
  name: string
}

export type CollateralToken = {
  id: string
  name: string
  symbol: string
  decimals: number
}

export type WhitelistQueryResponse = {
  dataProviders: DataProvider[]
  dataFeeds: DataFeed[]
  collateralTokens: CollateralToken[]
}

export const queryWhitelist = gql`
  {
    dataProviders {
      id
      name
      dataFeeds {
        id
        referenceAssetUnified
      }
    }
    dataFeeds {
      id
      referenceAsset
      referenceAssetUnified
      active
      dataProvider {
        id
      }
    }
    collateralTokens {
      id
      name
      decimals
      symbol
    }
  }
`
