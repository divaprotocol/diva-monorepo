import firebase from 'firebase/app'
import 'firebase/database'
import 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDdYKD_rbV2ssyZOlXYc6by6-AxgWQfpz4',
  authDomain: 'divaprotocol-7afc0.firebaseapp.com',
  databaseURL: 'https://divaprotocol-7afc0-default-rtdb.firebaseio.com/',
  projectId: 'divaprotocol-7afc0',
  storageBucket: 'divaprotocol-7afc0.appspot.com',
  messagingSenderId: '753300443145',
  appId: '1:753300443145:web:b5df12e21e8db85b6068d8',
  measurementId: 'G-DNP0BT03CD',
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig)
} else {
  firebase.app() // if already initialized, use that one
}

const database = firebase.firestore()
export const optionsCount = database.collection('T_Options_New')
export const optionLiquidity = database.collection('T_Events_Liquidity_New')

export type DbOption = {
  TokenAddress: string
  Strike: number
  BlockNumber: number
  DecimalsCollateralToken: number
  CollateralTokenName: string
  DataFeedProviderIsWhitelisted: boolean
  ExpiryDate: number
  DataFeedProvider: string
  SettlementFee: number
  CollateralToken: string
  OptionSetId: number
  ReferenceAsset: string
  RedemptionFee: number
  IsLong: boolean
  Cap: number
  Inflection: number
  DataFeedProviderName: string
  OptionId: string
  CollateralBalance: number
}

export const getOption = async (key: string): Promise<DbOption | void> => {
  const optionsCount = database.collection('T_Options_New')
  const option = await optionsCount.where('OptionId', '==', key).get()
  if (!option.empty) {
    return option.docs[0].data() as DbOption
  }
}

export const getAllOptions = async (): Promise<DbOption[]> => {
  const liquidityResponse = await optionLiquidity.get()
  const oLiquidityData: any[] = liquidityResponse.docs.map((v) => v.data())
  const optionsResponse = await optionsCount.get()

  return optionsResponse.docs.map((doc) => {
    const data: any = doc.data()
    const optionId = data.OptionSetId

    const optionLiquidity = oLiquidityData.find(
      (res) => res.OptionSetId === optionId
    )

    return {
      ...data,
      CollateralBalance:
        optionLiquidity != null
          ? optionLiquidity.CollateralBalanceLong +
            optionLiquidity.CollateralBalanceShort
          : 0,
    }
  })
}
