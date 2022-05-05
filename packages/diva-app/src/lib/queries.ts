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
  intrinsicValue?: string
  supplyInitial: string
  supplyLong: string
  supplyShort: string

  createdBy: string
  createdAt: string
}

export const queryPools = (id: string) => gql`
  {
    pools( where: { id_gt: "${id}" } ) {
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

export const queryMarkets = (id: string) => gql`
  {
    pools( where: { statusFinalReferenceValue_not:"Confirmed" id_gt: "${id}" } ) {
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

export const queryDatafeed = (address: string, id: string) => gql`
  {
    pools(where: { dataProvider: "${address}" id_gt: "${id}" } ) {
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

export const queryMyFeeClaims = (address: string) => gql`
  {
    feeRecipients(where: { id: "${address}" }) {
      id
      collateralTokens {
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

type Signature = {
  signatureType: number
  r: string
  s: string
  v: number
}

export type Order = {
  id: string
  pool: string
  feeRecipient: string
  takerTokenFeeAmount: string
  makerToken: string
  takerToken: string
  makerAmount: string
  takerAmount: string
  maker: string
  taker: string
  sender: string
  expiry: string
  salt: string
  chainId: number
  verifyingContract: string
  signature: Signature
}

/**
 * Orderbook
 */
export const queryOrdersByMakerToken = (props: {
  makerToken: string
  nextToken?: string
}) => gql`
  {
    orders (makerToken: "${props.makerToken}" ${
  props.nextToken != null ? ', nextToken: ' + props.nextToken : ''
}) {
      items {
        id
        pool
        feeRecipient
        takerTokenFeeAmount
        makerToken
        takerToken
        makerAmount
        takerAmount
        maker
        taker
        sender
        expiry
        salt
        chainId
        verifyingContract
        signature {
          signatureType
          r
          s
          v
        }
      }
    }
  }
`

export const queryOrdersByTokens = (props: {
  makerToken: string
  takerToken: string
  nextToken?: string
}) => gql`
  query QueryOrders{
    ordersByTokens (makerToken: "${props.makerToken}",
    takerToken: "${props.takerToken}"
    ${props.nextToken != null ? ', nextToken: ' + props.nextToken : ''}) {
      items {
        id
        pool
        feeRecipient
        takerTokenFeeAmount
        makerToken
        takerToken
        makerAmount
        takerAmount
        maker
        taker
        sender
        expiry
        salt
        chainId
        verifyingContract
        signature {
          signatureType
          r
          s
          v
        }
      }
    }
  }
`

export const createOrderMutation = (order: Omit<Order, 'id'>) => gql`
  mutation CreateOrder {
    createOrder(
      chainId: ${order.chainId},
      expiry: "${order.expiry}",
      feeRecipient: "${order.feeRecipient}",
      maker: "${order.maker}",
      makerAmount: "${order.makerAmount}",
      makerToken: "${order.makerToken}",
      pool: "${order.pool}",
      salt: "${order.salt}",
      sender: "${order.sender}",
      signature: {
        r: "${order.signature.r}",
        s: "${order.signature.s}",
        v: "${order.signature.v}",
        signatureType: "${order.signature.signatureType}",
      },
      taker: "${order.taker}",
      takerAmount: "${order.takerAmount}",
      takerToken: "${order.takerToken}",
      takerTokenFeeAmount: "${order.takerTokenFeeAmount}",
      verifyingContract: "${order.verifyingContract}"
    ) {
      id
    }
  }
`
