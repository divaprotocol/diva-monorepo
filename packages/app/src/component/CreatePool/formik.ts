import { useFormik } from 'formik'
import { useDiva } from '../../hooks/useDiva'
import { CollateralToken } from '../../lib/queries'
import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'
import { chainIdtoName } from '../../Util/chainIdtoName'

const defaultDate = new Date()
defaultDate.setHours(defaultDate.getHours() + 25)

type Values = {
  step: number
  referenceAsset: string
  expiryDate: Date
  floor: number
  cap: number
  inflection: number
  collateralToken?: CollateralToken
  collateralWalletBalance: string
  collateralBalance: string
  collateralBalanceShort: number
  collateralBalanceLong: number
  shortTokenSupply: number
  longTokenSupply: number
  capacity: number
  dataFeedProvider: string
}

export const initialValues: Values = {
  step: 1,
  referenceAsset: '',
  expiryDate: defaultDate,
  floor: 1,
  cap: 3,
  inflection: 2,
  collateralToken: undefined,
  collateralWalletBalance: '0',
  collateralBalance: '2',
  collateralBalanceShort: 1,
  collateralBalanceLong: 1,
  shortTokenSupply: 2,
  longTokenSupply: 2,
  capacity: 0,
  dataFeedProvider: '',
}

type Errors = {
  [P in keyof typeof initialValues]?: string
}

export const useCreatePoolFormik = () => {
  const { chainId = 3, account } = useWeb3React()
  const contract = useDiva()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )
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
          expiryDate,
          shortTokenSupply,
          longTokenSupply,
          referenceAsset,
          collateralToken,
          dataFeedProvider,
        } = values

        if (collateralToken != null && dataFeedProvider != null) {
          contract
            ?.createContingentPool({
              inflection,
              cap,
              floor,
              collateralBalanceShort,
              collateralBalanceLong,
              expiryDate: expiryDate.getTime(),
              supplyShort: shortTokenSupply,
              supplyLong: longTokenSupply,
              referenceAsset,
              collateralToken,
              dataFeedProvider,
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

      if (account == null) {
        errors.collateralWalletBalance =
          'Your wallet must be connected before you can proceed'
      } else if (walletBalance < collateralBalance) {
        errors.collateralWalletBalance =
          'Collateral cannot be higher than your balance'
      } else if (collateralBalance <= 0) {
        errors.collateralBalance = 'Collateral can not be 0'
      }

      if (values.expiryDate.getTime() - Date.now() < threshold) {
        errors.expiryDate = `Expiry Date cannot be later earlier than ${
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

      if (values.capacity < 0) {
        errors.capacity = 'Capacity cannot be negative'
      } else if (values.capacity !== 0 && collateralBalance > values.capacity) {
        errors.capacity = `Capacity must be larger than ${collateralBalance}. For unlimited capacity, set to 0`
      }

      // validate data feed provider
      if (
        values.step > 1 &&
        values.dataFeedProvider !== null &&
        provider != null
      ) {
        if (
          values.dataFeedProvider == null ||
          values.dataFeedProvider.trim().length === 0
        ) {
          errors.dataFeedProvider = 'Must define dataFeedProvider'
        } else {
          try {
            await provider.getSigner(values.dataFeedProvider)
          } catch (err) {
            errors.dataFeedProvider =
              'You must specify a valid address as the data feed provider'
          }
        }
      }

      // short token balance
      if (values.shortTokenSupply <= 0) {
        errors.shortTokenSupply = 'Must be higher than 0'
      }

      if (values.longTokenSupply <= 0) {
        errors.longTokenSupply = 'Must be higher than 0 0'
      }

      return errors
    },
  })

  return _formik
}
