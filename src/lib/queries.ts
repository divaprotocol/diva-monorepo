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
  statusTimeStamp: string
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
      statusTimeStamp
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
      statusTimeStamp
      dataFeedProvider
      redemptionFee
      settlementFee
    }
  }
`
