import gql from 'graphql-tag'

export type Pool = {
  cap: string
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
