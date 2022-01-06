import { FormikConfig, useFormik } from 'formik'
import referenceAssets from './referenceAssets.json'

export const initialValues = {
  referenceAsset: referenceAssets[0],
  expiryDate: new Date(),
  amount: 1,
  floor: 1,
  cap: 3,
  inflection: 2,
  collateralToken: undefined as string | undefined,
  collateralBalanceShort: 100,
  collateralBalanceLong: 100,
  shortTokenSupply: 100,
  longTokenSupply: 100,
  dataFeedProvider: null,
}

export const useCreatePoolFormik = () => {
  return useFormik({
    initialValues,
    onSubmit: () => {
      console.log('on submit')
    },
    validate: (values) => {
      // validate expiry date, - today in 2 hrs? 12 hrs, 48 hrs?
      // validate other vars
      // floor can't be higher than inflection
      // inflection can't be lower than floor or higher than cap
      // cap can't be lower than inflection
      // validate oracle
      // validate step

      return {}
    },
  })
}

// export type CreatePoolFormik = ReturnType<typeof useFormik>
