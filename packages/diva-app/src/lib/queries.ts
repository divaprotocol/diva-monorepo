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

export type PositionToken = {
  id: string
  name: string
  symbol: string
  decimals: number
  pool?: Pool
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
  intrinsicValue?: string
  supplyInitial: string
  supplyLong: string
  supplyShort: string

  createdBy: string
  createdAt: string
}

export type User = {
  id: string
  positionTokens: { positionToken: PositionToken }[]
}

export const queryUser = (id: string, pageSize: number, skip: number) => gql`
{
  user(id: "${id}" ){
    id
    positionTokens(first: ${pageSize}, skip: ${skip},
      orderDirection: desc,
      orderBy: receivedAt,) {
        receivedAt,
        positionToken {
        id
        name
        symbol
        decimals
        owner
        pool {
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
    }
  }
}
`

export const queryPools = (
  skip: number,
  pageSize: number,
  createdBy = '',
  dataProvider = ''
) => gql`
  {
    pools(first: ${pageSize}, skip: ${skip},
      orderDirection: desc,
      orderBy: createdAt,
      where: { 
        createdBy_contains: "${createdBy}"
        statusFinalReferenceValue_not: "Confirmed"
        dataProvider_contains: "${dataProvider}"
      }) {
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

export const queryFeeRecipients = (address: string) => gql`
  {
    feeRecipients(where: { id: "${address}" }) {
      id
      collateralTokens(where: {amount_gt: 0}) {
        amount
        collateralToken {
          id
          name
          symbol
        }
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
  active: boolean
}

export type DataProvider = {
  dataFeeds: { id: string; referenceAssetUnified: string; active: boolean }[]
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
export type TestUser = {
  id: BigNumber
  binaryPoolCreated: boolean
  linearPoolCreated: boolean
  convexPoolCreated: boolean
  concavePoolCreated: boolean
  liquidityAdded: boolean
  liquidityRemoved: boolean
  buyLimitOrderCreatedAndFilled: boolean
  sellLimitOrderCreatedAndFilled: boolean
  buyLimitOrderFilled: boolean
  sellLimitOrderFilled: boolean
  finalValueReported: boolean
  reportedValueChallenged: boolean
  positionTokenRedeemed: boolean
  feesClaimed: boolean
  feeClaimsTransferred: boolean
}

export type OrderFill = {
  id: string
  orderHash: string
  maker: string
  taker: string
  makerToken: string
  takerToken: string
  makerTokenFilledAmount: string
  takerTokenFilledAmount: string
  timestamp: number
}

export const queryOrderFillsMaker = (address: string) => gql`
  {
    nativeOrderFills(
      where: { maker: "${address}" }
    ) {
      id
      orderHash
      maker
      taker
      makerToken
      takerToken
      makerTokenFilledAmount
      takerTokenFilledAmount
      timestamp
    }
  }
`

export const queryOrderFillsTaker = (address: string) => gql`
  {
    nativeOrderFills(
      where: { taker: "${address}" }
    ) {
      id
      orderHash
      maker
      taker
      makerToken
      takerToken
      makerTokenFilledAmount
      takerTokenFilledAmount
      timestamp
    }
  }
`
export const queryTestUser = (address: string) => gql`
  {
  testnetUser(id: "${address}") {
    id
    binaryPoolCreated
    linearPoolCreated
    convexPoolCreated
    concavePoolCreated
    liquidityAdded
    liquidityRemoved
    buyLimitOrderCreatedAndFilled
    sellLimitOrderCreatedAndFilled
    buyLimitOrderFilled
    sellLimitOrderFilled
    finalValueReported
    reportedValueChallenged
    positionTokenRedeemed
    feesClaimed
    feeClaimsTransferred
  }
}
`
export const queryWhitelist = gql`
  {
    dataProviders {
      id
      name
      dataFeeds {
        id
        referenceAssetUnified
        active
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
