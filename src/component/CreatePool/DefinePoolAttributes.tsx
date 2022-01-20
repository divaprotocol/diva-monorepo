import { DateTimePicker } from '@mui/lab'
import {
  Box,
  FormControl,
  FormHelperText,
  TextField,
  Autocomplete,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'

import { PayoffProfile } from './PayoffProfile'
// import referenceAssets from './referenceAssets.json'
import { Tokens } from '../../lib/types'
import { useCreatePoolFormik } from './formik'
import { useErcBalance } from '../../hooks/useErcBalance'
import styled from '@emotion/styled'
import { DefineAdvanced } from './DefineAdvancedAttributes'
import request from 'graphql-request'
import { whiteListEndpoint } from '../../constants'
import { queryWhitelist, WhitelistQueryResponse } from '../../lib/queries'
import { CheckCircle, Report } from '@mui/icons-material'

const MaxCollateral = styled.u`
  cursor: pointer;
  &:hover {
    color: ${(props) => (props.theme as any).palette.primary.main};
  }
`

export function DefinePoolAttributes({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const today = new Date()
  const [referenceAssetSearch, setReferenceAssetSearch] = useState('')

  const whitelistQuery = useQuery<WhitelistQueryResponse>('whitelist', () =>
    request(whiteListEndpoint, queryWhitelist)
  )

  const referenceAssets = (whitelistQuery?.data?.dataFeeds || []).map(
    (v) => v.referenceAsset
  )

  const tokensQuery = useQuery<Tokens>('tokens', () =>
    fetch('/ropstenTokens.json').then((res) => res.json())
  )

  const collateralTokenAssets = tokensQuery.data || {}
  const collateralTokenAddress =
    collateralTokenAssets[
      (formik.values.collateralTokenSymbol as string)?.toLowerCase()
    ]
  const collateralWalletBalance = useErcBalance(collateralTokenAddress)

  const {
    referenceAsset,
    expiryDate,
    collateralTokenSymbol,
    collateralBalanceShort,
    collateralBalanceLong,
    shortTokenSupply,
    inflection,
    cap,
    floor,
    longTokenSupply,
  } = formik.values

  useEffect(() => {
    if (collateralWalletBalance != null) {
      formik.setFieldValue('collateralWalletBalance', collateralWalletBalance)
    }
  }, [collateralWalletBalance])

  useEffect(() => {
    if (referenceAssets.length > 0) {
      formik.setFieldValue('referenceAsset', referenceAssets[0], false)
    }
  }, [referenceAssets.length])

  useEffect(() => {
    if (formik.touched.collateralBalance) {
      const half = formik.values.collateralBalance / 2
      formik.setValues((values) => ({
        ...values,
        collateralBalanceShort: half,
        collateralBalanceLong: half,
        longTokenSupply: formik.values.collateralBalance,
        shortTokenSupply: formik.values.collateralBalance,
      }))
    }
  }, [formik.values.collateralBalance, formik.touched])

  useEffect(() => {
    const totalBalance =
      formik.values.collateralBalanceLong + formik.values.collateralBalanceShort
    if (
      (formik.touched.collateralBalanceLong ||
        formik.touched.collateralBalanceShort) &&
      totalBalance !== formik.values.collateralBalance
    ) {
      formik.setValues((values) => ({
        ...values,
        collateralBalance: totalBalance,
        longTokenSupply: totalBalance,
        shortTokenSupply: totalBalance,
      }))
    }
  }, [
    formik.touched,
    formik.values.collateralBalanceLong,
    formik.values.collateralBalanceShort,
  ])

  const theme = useTheme()

  const possibleOptions = Object.keys(collateralTokenAssets)
    .filter((v) =>
      referenceAssetSearch.trim().length > 0
        ? v.startsWith(referenceAssetSearch.trim())
        : true
    )
    .map((v) => v.toUpperCase())

  const setCollateralBalance = (num: number) => {
    let long = 0
    let short = 0

    if (num > 0) {
      const half = num / 2
      long = short = half
    }
    formik.setValues(
      {
        ...formik.values,
        collateralBalanceLong: long,
        collateralBalanceShort: short,
      },
      true
    )
  }

  const hasPaymentProfileError =
    formik.errors.floor != null ||
    formik.errors.cap != null ||
    formik.errors.inflection != null

  const isCustomReferenceAsset = referenceAssets.includes(referenceAsset)

  return (
    <Box>
      <Typography pb={theme.spacing(5)} variant="subtitle1">
        Define all the parameters for your Contingent Pool below.
      </Typography>
      <Box pb={3} pt={1}>
        <FormControl fullWidth error={formik.errors.referenceAsset != null}>
          <Autocomplete
            id="referenceAsset"
            renderInput={(params) => (
              <TextField
                {...params}
                label="Reference Asset"
                name="referenceAsset"
                id="referenceAsset"
                onBlur={formik.handleBlur}
                helperText={
                  isCustomReferenceAsset ? (
                    <Stack direction="row" alignContent="center">
                      <CheckCircle
                        fontSize="small"
                        color="success"
                        sx={{ marginRight: theme.spacing(0.5) }}
                      />
                      <span>This reference asset is whitelisted</span>
                    </Stack>
                  ) : (
                    <Stack direction="row" alignItems="center">
                      <Report
                        color="warning"
                        fontSize="small"
                        sx={{ marginRight: theme.spacing(0.5) }}
                      />
                      <span>
                        This reference asset is custom and not on our whitelist
                      </span>
                    </Stack>
                  )
                }
                error={formik.errors.referenceAsset != null}
              />
            )}
            onInputChange={(event) => {
              if (event != null && event.target != null) {
                formik.setFieldValue(
                  'referenceAsset',
                  (event.target as any).value || ''
                )
              }
            }}
            onChange={(event, option) => {
              formik.setFieldValue('referenceAsset', option)
            }}
            value={referenceAsset}
            options={referenceAssets}
          />
        </FormControl>
      </Box>
      <Box pb={3}>
        <FormControl fullWidth>
          <DateTimePicker
            InputProps={{
              name: 'expiryDate',
              id: 'expiryDate',
              onBlur: formik.handleBlur,
              error: formik.errors.expiryDate != null,
            }}
            label="Expiry Date"
            onChange={(event) => {
              formik.setFieldValue('expiryDate', event)
            }}
            minDate={today}
            value={expiryDate}
            renderInput={(params) => <TextField {...params} />}
          />
          {formik.errors.expiryDate != null && (
            <FormHelperText sx={{ color: 'red' }}>
              {formik.errors.expiryDate}
            </FormHelperText>
          )}
        </FormControl>
      </Box>
      <Box>
        <h3>Collateral</h3>

        <Stack pb={3} spacing={2} direction="row">
          <FormControl
            fullWidth
            error={formik.errors.collateralTokenSymbol != null}
          >
            <Autocomplete
              options={possibleOptions.slice(0, 100)}
              value={collateralTokenSymbol}
              onChange={(event, newValue) => {
                formik.setFieldValue('collateralTokenSymbol', newValue)
              }}
              onInputChange={(event) => {
                if (event != null && event.target != null) {
                  setReferenceAssetSearch((event.target as any).value || '')
                }
              }}
              renderInput={(params) => (
                <TextField
                  error={formik.errors.collateralTokenSymbol != null}
                  onBlur={formik.handleBlur}
                  {...params}
                  label="Collateral Asset"
                />
              )}
            />
            {formik.errors.collateralTokenSymbol != null && (
              <FormHelperText>
                {formik.errors.collateralTokenSymbol}
              </FormHelperText>
            )}
            {collateralWalletBalance != null && (
              <FormHelperText>
                Your balance: {parseFloat(collateralWalletBalance).toFixed(4)}{' '}
                {collateralTokenSymbol}{' '}
                <MaxCollateral
                  role="button"
                  onClick={() => {
                    if (collateralWalletBalance != null) {
                      setCollateralBalance(parseFloat(collateralWalletBalance))
                    }
                  }}
                >
                  (Max)
                </MaxCollateral>
              </FormHelperText>
            )}
          </FormControl>
          <FormControl
            fullWidth
            error={formik.errors.collateralBalance != null}
          >
            <TextField
              id="collateralBalance"
              name="collateralBalance"
              label="Collateral Balance"
              inputProps={{ min: 0 }}
              onBlur={formik.handleBlur}
              error={formik.errors.collateralBalance != null}
              value={formik.values.collateralBalance}
              type="number"
              onChange={formik.handleChange}
            />
            {formik.errors.collateralBalance != null && (
              <FormHelperText>{formik.errors.collateralBalance}</FormHelperText>
            )}
          </FormControl>
        </Stack>
      </Box>

      <h3>Payoff</h3>

      <Stack pb={3} spacing={2} direction="row">
        <Box pt={2} width="50%">
          <FormControl fullWidth error={hasPaymentProfileError}>
            {hasPaymentProfileError && (
              <FormHelperText
                sx={{ marginLeft: 0, paddingBottom: theme.spacing(3) }}
              >
                Invalid input. Please ensure that the following is true: <br />
                <code>
                  Floor {'<='} Inflection {'<='} Cap
                </code>
              </FormHelperText>
            )}
            <Stack spacing={3}>
              <TextField
                inputProps={{ min: 0, max: inflection }}
                name="floor"
                error={formik.errors.floor != null}
                id="floor"
                onBlur={formik.handleBlur}
                label="Floor"
                value={floor}
                type="number"
                onChange={formik.handleChange}
              />
              <TextField
                id="inflection"
                error={formik.errors.inflection != null}
                name="inflection"
                onBlur={formik.handleBlur}
                label="Inflection"
                inputProps={{
                  min: floor,
                  max: cap,
                }}
                type="number"
                onChange={formik.handleChange}
                value={inflection}
                sx={{ width: '100%' }}
              />

              <TextField
                error={formik.errors.cap != null}
                inputProps={{ min: inflection }}
                onBlur={formik.handleBlur}
                name="cap"
                id="cap"
                label="Cap"
                value={cap}
                type="number"
                onChange={formik.handleChange}
              />
              <DefineAdvanced formik={formik} />
            </Stack>
          </FormControl>
        </Box>

        {floor != null &&
          cap != null &&
          inflection != null &&
          shortTokenSupply != null &&
          longTokenSupply != null &&
          shortTokenSupply > 0 &&
          longTokenSupply > 0 && (
            <Box width="50%">
              <PayoffProfile
                floor={floor}
                cap={cap}
                inflection={inflection}
                hasError={hasPaymentProfileError}
                collateralBalanceLong={collateralBalanceLong}
                collateralBalanceShort={collateralBalanceShort}
                shortTokenAmount={shortTokenSupply}
                longTokenAmount={longTokenSupply}
              />
            </Box>
          )}
      </Stack>
    </Box>
  )
}
