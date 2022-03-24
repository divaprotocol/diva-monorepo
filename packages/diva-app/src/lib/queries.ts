import gql from 'graphql-tag'
import { BigNumber } from 'ethers'

export type FeeRecipientCollateralToken = {
  id: string
  feeRecipient: FeeRecipient
  collateralToken: WhitelistCollateralToken
  amount: string
}

export type FeeRecipient = {
  id: string
  collateralTokens: FeeRecipientCollateralToken[]
}

export type CollateralTokenEntity = {
  id: string
  name: string
  decimals: number
  symbol: string
  feeRecipients: FeeRecipientCollateralToken[]
}

type PositionToken = {
  id: string
  name: string
  symbol: string
  decimals: number
  pool: Pool
  owner: string
}

export type Pool = {
  cap: string
  capacity: string
  challenges: Challenge[]
  collateralBalance: string
  collateralBalanceLongInitial: string
  collateralBalanceShortInitial: string
  collateralToken: CollateralTokenEntity
  dataProvider: string
  expiryTime: string
  finalReferenceValue: string
  floor: string
  id: string
  inflection: string
  longToken: PositionToken
  shortToken: PositionToken
  redemptionAmountLongToken: string
  redemptionAmountShortToken: string
  redemptionFee: string
  referenceAsset: string
  settlementFee: string
  statusFinalReferenceValue: string
  statusTimestamp: string

  supplyInitial: string
  supplyLong: string
  supplyShort: string

  createdBy: string
  createdAt: string
}

export const queryPools = gql`
  {
    pools {
      id
      referenceAsset
      floor
      inflection
      cap
      supplyInitial
      supplyShort
      supplyLong
      expiryTime
      collateralToken {
        id
        name
        decimals
        symbol
      }
      collateralBalanceShortInitial
      collateralBalanceLongInitial
      collateralBalance
      shortToken {
        id
        name
        symbol
        decimals
        owner
      }
      longToken {
        id
        name
        symbol
        decimals
        owner
      }
      finalReferenceValue
      statusFinalReferenceValue
      redemptionAmountLongToken
      redemptionAmountShortToken
      statusTimestamp
      dataProvider
      redemptionFee
      settlementFee
      createdBy
      createdAt
      capacity
      expiryTime
      challenges {
        challengedBy
        proposedFinalReferenceValue
      }
    }
  }
`

export const queryPool = (poolId: number) => gql`
  {
    pool(id: ${poolId}) {
      id
      referenceAsset
      floor
      inflection
      cap
      supplyInitial
      supplyShort
      supplyLong
      expiryTime
      collateralToken {
        id
        name
        decimals
        symbol
      }
      collateralBalanceShortInitial
      collateralBalanceLongInitial
      collateralBalance
      shortToken {
        id
        name
        symbol
        decimals
        owner
      }
      longToken {
        id
        name
        symbol
        decimals
        owner
      }
      finalReferenceValue
      statusFinalReferenceValue
      redemptionAmountLongToken
      redemptionAmountShortToken
      statusTimestamp
      dataProvider
      redemptionFee
      settlementFee
      createdBy
      createdAt
      capacity
      expiryTime
      challenges {
        challengedBy
        proposedFinalReferenceValue
      }
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

export type WhitelistCollateralToken = {
  id: string
  name: string
  symbol: string
  decimals: number
}

export type WhitelistQueryResponse = {
  dataProviders: DataProvider[]
  dataFeeds: DataFeed[]
  collateralTokens: WhitelistCollateralToken[]
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
export const queryChallenge = (poolId: number) => gql`
  {
    challenges(where: { pool: "${poolId}" }) {
      proposedFinalReferenceValue
    }
  }
`
export type Challenges = {
  challenges: Challenge[]
}

export type Challenge = {
  proposedFinalReferenceValue: BigNumber
}