import { FormikConfig, useFormik } from 'formik'
import referenceAssets from './referenceAssets.json'

const defaultDate = new Date()
defaultDate.setMinutes(defaultDate.getMinutes() + 10)

export const initialValues = {
  step: 1,
  referenceAsset: referenceAssets[0],
  expiryDate: defaultDate,
  floor: 1,
  cap: 3,
  inflection: 2,
  collateralTokenSymbol: undefined as string | undefined,
  collateralWalletBalance: '0',
  collateralBalance: 200,
  collateralBalanceShort: 100,
  collateralBalanceLong: 100,
  shortTokenSupply: 100,
  longTokenSupply: 100,
  dataFeedProvider: null,
}

type Errors = {
  collateralWalletBalance?: string
  collateralBalance?: string
  expiryDate?: string
}

export const useCreatePoolFormik = () => {
  return useFormik({
    initialValues,
    onSubmit: () => {
      console.log('on submit')
    },
    validate: (values) => {
      const errors: Errors = {}

      const threshold = 30000

      const collateralBalance =
        values.collateralBalanceLong + values.collateralBalanceShort
      const walletBalance = parseFloat(values.collateralWalletBalance)

      if (walletBalance < collateralBalance) {
        errors.collateralWalletBalance = 'Balance lower than collateral'
      }

      if (collateralBalance <= 0) {
        errors.collateralBalance = 'Collateral can not be 0'
      }

      if (values.expiryDate.getTime() - Date.now() < threshold) {
        errors.expiryDate = `Expiry Date cannot be later earlier than ${
          threshold / 1000
        } seconds from now`
      }
      // validate expiry date, - today in 2 hrs? 12 hrs, 48 hrs?
      // validate other vars
      // floor can't be higher than inflection
      // inflection can't be lower than floor or higher than cap
      // cap can't be lower than inflection
      // validate oracle
      // validate step

      return errors
    },
  })
}

// export type CreatePoolFormik = ReturnType<typeof useFormik>
