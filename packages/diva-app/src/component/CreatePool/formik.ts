/* eslint-disable prettier/prettier */
/* eslint-disable react-hooks/rules-of-hooks */
import { useFormik } from 'formik'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { useDiva } from '../../hooks/useDiva'
import { WhitelistCollateralToken } from '../../lib/queries'
import { ethers } from 'ethers'
import { useAppSelector } from '../../Redux/hooks'
import { selectChainId, selectUserAddress } from '../../Redux/appSlice'
import { config } from '../../constants'
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
  collateralBalance: number
  capacity: string
  dataProvider: string
  payoutProfile: string
  offerExpiry?: string
  offerDirection?: string
  minTakerContribution?: string
  takerAddress?: string
  makerAddress?: string
  longRecipient?: string
  shortRecipient?: string
  jsonToExport?: any
  signature?: string
  yourShare?: number
  takerShare?: number
  poolId?: string
  offerHash?: string
  permissionedERC721Token: string
}

export const initialValues: Values = {
  step: 1,
  referenceAsset: 'BTC/USD', // TODO: hard-coded for testnet; will break the app if reference asset is not whitelisted on the connected chain. Update towards mainnet launch
  expiryTime: defaultDate,
  floor: 100,
  cap: 300,
  inflection: 200,
  gradient: 0.5,
  collateralToken: {
    id: '0xFA158C9B780A4213f3201Ae74Cca013712c8538d', // Ropsten: '0x134e62bd2ee247d4186a1fdbaa9e076cb26c1355',
    name: 'DIVA USD',
    decimals: 18,
    symbol: 'dUSD',
  }, // TODO: hard-coded for testnet; will break the app cross chain. Update towards mainnet launch
  collateralWalletBalance: '0',
  collateralBalance: 10,
  capacity: 'Unlimited',
  dataProvider: '',
  payoutProfile: 'Binary',
  offerDirection: 'Long',
  offerExpiry: Math.floor(24 * 60 * 60 + Date.now() / 1000).toString(),
  minTakerContribution: '0',
  takerAddress: ethers.constants.AddressZero,
  makerAddress: '',
  longRecipient: '',
  shortRecipient: '',
  jsonToExport: '{}',
  signature: '',
  yourShare: 1,
  takerShare: 9,
  poolId: '',
  offerHash: '',
  permissionedERC721Token: ethers.constants.AddressZero,
}

type Errors = {
  [P in keyof typeof initialValues]?: string
}
export const useCreatePoolFormik = () => {
  const { provider, isConnected } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector(selectChainId)
  initialValues.longRecipient = userAddress
  initialValues.shortRecipient = userAddress
  initialValues.collateralToken = config[chainId].collateralTokens?.[0]


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
          referenceAsset,
          expiryTime,
          floor,
          inflection,
          cap,
          gradient,
          collateralBalance, // TODO rename to collateralAmount
          collateralToken,
          dataProvider,
          longRecipient,
          shortRecipient,
          permissionedERC721Token,
        } = values

        if (collateralToken != null && dataProvider != null) {
          contract
            ?.createContingentPool({
              referenceAsset,
              expiryTime: expiryTime.getTime(),
              floor,
              inflection,
              cap,
              gradient,
              collateralBalance,
              collateralToken,
              dataProvider,
              capacity: 0,
              longRecipient,
              shortRecipient,
              permissionedERC721Token,
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

      const threshold = 300000

      const collateralBalance = values.collateralBalance
      const walletBalance = parseFloat(values.collateralWalletBalance)
      if (values.referenceAsset == null) {
        errors.referenceAsset = 'You must choose a reference asset'
      }
      // if (values.referenceAsset == '') {
      //   errors.referenceAsset = 'You must choose a reference asset'
      // }
      if (values.collateralToken == null) {
        errors.collateralToken = 'You must choose a collateral asset'
      }
      if (values.collateralBalance == 0 || isNaN(values.collateralBalance)) {
        errors.collateralBalance = 'Collateral cannot be empty'
      }
      if (parseFloat(values.minTakerContribution) > values.takerShare) {
        errors.minTakerContribution =
          'Minimum taker contribution must be less than or equal to taker share'
      }
      if (Number(values.minTakerContribution) < 0) {
        errors.minTakerContribution =
          'Minimum taker contribution must be greater than 0'
      }

      if (!isConnected) {
        errors.collateralWalletBalance =
          'Your wallet must be connected before you can proceed'
      } else if (walletBalance < collateralBalance) {
        errors.collateralWalletBalance =
          'Collateral cannot be higher than your balance'
      } else if (values.collateralBalance == 0) {
        errors.collateralBalance = 'Collateral cannot be 0'
      }
      if (values.takerShare <= 0 || isNaN(values.takerShare)) {
        errors.takerShare = 'Taker share cannot be zero, negative or missing'
      }
      if (values.expiryTime == null || isNaN(values.expiryTime.getTime())) {
        errors.expiryTime = 'You must set an expiry time'
      }
      if (
        values.expiryTime != null &&
        values.expiryTime.getTime() - Date.now() < threshold
      ) {
        errors.expiryTime = `Expiry time cannot be earlier than ${threshold / 1000 / 60
          } minutes from now`
      }
      if (values.takerAddress == null) {
        errors.takerAddress = 'Taker address must not be empty'
      }

      if (
        values.takerAddress.length !== ethers.constants.AddressZero.length &&
        values.takerAddress !== 'Everyone'
      ) {
        errors.takerAddress = 'Taker address must be valid'
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
        values.collateralBalance > parseFloat(values.capacity)
      ) {
        errors.capacity = `Capacity must be larger than ${values.collateralBalance}. For unlimited capacity, set to 0`
      }

      // validate data provider
      if (values.step > 1 && values.dataProvider !== null && provider != null) {
        if (
          values.dataProvider == null ||
          values.dataProvider.trim().length === 0
        ) {
          errors.dataProvider = 'You must define a data provider'
        } else {
          try {
            await provider.getSigner(values.dataProvider)
          } catch (err) {
            errors.dataProvider =
              'You must specify a valid address as the data provider'
          }
        }
      }

      return errors
    },
  })

  return _formik
}
