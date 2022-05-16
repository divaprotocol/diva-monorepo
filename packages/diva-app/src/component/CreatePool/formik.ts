/* eslint-disable react-hooks/rules-of-hooks */
import { useFormik } from 'formik'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { useDiva } from '../../hooks/useDiva'
import { WhitelistCollateralToken } from '../../lib/queries'

const defaultDate = new Date()
defaultDate.setHours(defaultDate.getHours() + 25)
export type Values = {
  step: number
  referenceAsset: string
  expiryTime: Date
  floor: number
  cap: number
  inflection: number
  gradient: number
  collateralToken?: WhitelistCollateralToken
  collateralWalletBalance: string
  collateralBalance: string
  collateralBalanceShort: number
  collateralBalanceLong: number
  tokenSupply: number
  capacity: string
  dataProvider: string
}

export const initialValues: Values = {
  step: 1,
  referenceAsset: '',
  expiryTime: defaultDate,
  floor: 100,
  cap: 300,
  inflection: 200,
  gradient: 0.5,
  collateralToken: undefined,
  collateralWalletBalance: '0',
  collateralBalance: '10',
  collateralBalanceShort: 1,
  collateralBalanceLong: 1,
  tokenSupply: 2,
  capacity: '0',
  dataProvider: '',
}

type Errors = {
  [P in keyof typeof initialValues]?: string
}
export const useCreatePoolFormik = () => {
  const { provider, isConnected } = useConnectionContext()
  const contract = useDiva()
  const _formik = useFormik({
    initialValues,
    onSubmit: async (values, formik) => {
      if (values.step === 1) {
        formik.setFieldValue('step', 2, false)
      } else if (values.step === 2) {
        formik.setFieldValue('step', 3, false)
      } else if (values.step === 3) {
        formik.setStatus('Creating Pool')
        const {
          inflection,
          cap,
          floor,
          collateralBalanceLong,
          collateralBalanceShort,
          expiryTime,
          tokenSupply,
          referenceAsset,
          collateralToken,
          dataProvider,
        } = values

        if (collateralToken != null && dataProvider != null) {
          contract
            ?.createContingentPool({
              inflection,
              cap,
              floor,
              collateralBalanceShort,
              collateralBalanceLong,
              expiryTime: expiryTime.getTime(),
              supplyPositionToken: tokenSupply,
              referenceAsset,
              collateralToken,
              dataProvider,
              capacity: 0,
            })
            .then(() => {
              formik.setStatus('successfully created')
              setTimeout(() => {
                formik.resetForm()
              }, 5000)
            })
            .catch((error) => {
              console.error(error)
              formik.setStatus(`Error: ${error.message}`)
              setTimeout(() => {
                formik.setStatus(null)
              }, 5000)
            })
        }
      }
    },
    validate: async (values) => {
      const errors: Errors = {}

      const threshold = 30000

      const collateralBalance =
        values.collateralBalanceLong + values.collateralBalanceShort
      const walletBalance = parseFloat(values.collateralWalletBalance)
      if (values.collateralToken == null) {
        errors.collateralToken = 'You must choose a collateral asset'
      }

      if (!isConnected) {
        errors.collateralWalletBalance =
          'Your wallet must be connected before you can proceed'
      } else if (walletBalance < collateralBalance) {
        errors.collateralWalletBalance =
          'Collateral cannot be higher than your balance'
      } else if (collateralBalance <= 0) {
        errors.collateralBalance = 'Collateral can not be 0'
      }

      if (values.expiryTime.getTime() - Date.now() < threshold) {
        errors.expiryTime = `Expiry Date cannot be later earlier than ${
          threshold / 1000
        } seconds from now`
      }

      // floor can't be higher or equal to inflection
      if (values.floor > values.inflection) {
        errors.floor = 'Must be lower than inflection'
        errors.inflection = 'Must be higher than floor'
      }

      // floor can't be higher or equal to cap
      if (values.floor > values.cap) {
        errors.cap = 'Must be higher than floor'
        errors.floor = 'Must be lower than cap'
      }

      // inflection can't be higher or equal to cap
      if (values.inflection > values.cap) {
        errors.inflection = 'Must be lower than cap'
        errors.cap = 'Must be higher than inflection'
      }
      if (values.gradient < 0 || values.gradient > 1) {
        errors.gradient = 'Gradient value must be between 0 and 1'
      }
      if (parseFloat(values.capacity) < 0) {
        errors.capacity = 'Capacity cannot be negative'
      } else if (
        parseFloat(values.capacity) !== 0 &&
        collateralBalance > parseFloat(values.capacity)
      ) {
        errors.capacity = `Capacity must be larger than ${collateralBalance}. For unlimited capacity, set to 0`
      }

      // validate data feed provider
      if (values.step > 1 && values.dataProvider !== null && provider != null) {
        if (
          values.dataProvider == null ||
          values.dataProvider.trim().length === 0
        ) {
          errors.dataProvider = 'Must define dataProvider'
        } else {
          try {
            await provider.getSigner(values.dataProvider)
          } catch (err) {
            errors.dataProvider =
              'You must specify a valid address as the data feed provider'
          }
        }
      }

      // short token balance
      if (values.tokenSupply <= 0) {
        errors.tokenSupply = 'Must be higher than 0'
      }

      return errors
    },
  })

  return _formik
}
