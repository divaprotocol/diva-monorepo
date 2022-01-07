import { useWeb3React } from '@web3-react/core'
import { ethers } from 'ethers'
import { useFormik } from 'formik'
import { useCallback } from 'react'
import { useQuery } from 'react-query'
import { useDiva } from '../../hooks/useDiva'
import { Tokens } from '../../lib/types'
import { chainIdtoName } from '../../Util/chainIdToName'
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
  /**
   * collateralBalance is only defined here to satisfy
   * a type constraint in formik :/
   */
  collateralBalance: 2,
  collateralBalanceShort: 1,
  collateralBalanceLong: 1,
  shortTokenSupply: 100,
  longTokenSupply: 100,
  dataFeedProvider: '',
}

type Errors = {
  referenceAsset?: string
  expiryDate?: string
  floor?: string
  cap?: string
  inflection?: string
  collateralTokenSymbol?: string
  collateralWalletBalance?: string
  collateralBalance?: string
  collateralBalanceShort?: string
  collateralBalanceLong?: string
  shortTokenSupply?: string
  longTokenSupply?: string
  dataFeedProvider?: string
}

export const useCreatePoolFormik = () => {
  const { chainId } = useWeb3React()
  const contract = useDiva()

  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId).toLowerCase()
  )

  const tokensQuery = useQuery<Tokens>('tokens', () =>
    fetch('/ropstenTokens.json').then((res) => res.json())
  )

  const _formik = useFormik({
    initialValues,
    onSubmit: (values, formik) => {
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
        collateralTokenSymbol,
        dataFeedProvider,
      } = values
      const collateralTokenAssets = tokensQuery.data || {}
      const collateralToken =
        collateralTokenAssets[collateralTokenSymbol as string]

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
          })
          .then((val) => {
            console.info('created continent pool', val)
            formik.resetForm()
            formik.setStatus('successfully created')
          })
      }
    },
    validate: async (values) => {
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

      // validate other vars
      // floor can't be higher than inflection
      if (values.floor > values.inflection) {
        errors.floor = 'Must be lower than inflection'
        errors.inflection = 'Must be higher than floor'
      }

      if (values.floor > values.cap) {
        errors.cap = 'Must be higher than floor'
        errors.floor = 'Must be lower than cap'
      }

      if (values.inflection > values.cap) {
        errors.inflection = 'Must be lower than cap'
        errors.cap = 'Must be higher than inflection'
      }

      // validate data feed provider
      if (values.step > 1 && values.dataFeedProvider) {
        try {
          await provider.getSigner(values.dataFeedProvider)
        } catch (err) {
          errors.dataFeedProvider = 'Invalid address'
        }
      }

      // short token balance
      if (values.shortTokenSupply <= 0) {
        errors.shortTokenSupply = 'Must be higher than 0'
      }

      if (/[0-9]+\./.test(values.shortTokenSupply.toString())) {
        console.log({
          v: values.shortTokenSupply.toString().replace(/[0-9]+\./, ''),
        })
        errors.shortTokenSupply = 'Number cannot have decimal places'
      }

      if (values.longTokenSupply <= 0) {
        errors.longTokenSupply = 'Must be higher than 0 0'
      }

      if (/[0-9]+\./.test(values.longTokenSupply.toString())) {
        errors.longTokenSupply = 'Number cannot have decimal places'
      }

      return errors
    },
  })

  return _formik
}
