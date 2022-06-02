import { DateTimePicker } from '@mui/lab'
import ClockIcon from '@mui/icons-material/AccessTime'
import {
  Box,
  FormControl,
  FormHelperText,
  TextField,
  Autocomplete,
  Stack,
  Typography,
  useTheme,
  Tooltip,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material'
import { useEffect, useState } from 'react'

import { PayoffProfile } from './PayoffProfile'
import { useCreatePoolFormik } from './formik'
import { useErcBalance } from '../../hooks/useErcBalance'
import styled from '@emotion/styled'
import { DefineAdvanced } from './DefineAdvancedAttributes'
import { CheckCircle, Report } from '@mui/icons-material'
import { useWhitelist } from '../../hooks/useWhitelist'
import { WhitelistCollateralToken } from '../../lib/queries'
import { formatUnits, parseUnits } from 'ethers/lib/utils'

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
  const [value, setValue] = useState('binary')

  const handleChange = (event) => {
    setValue(event.target.value)
  }
  const { referenceAssets, collateralTokens } = useWhitelist()

  const {
    referenceAsset,
    expiryTime,
    collateralToken,
    collateralBalanceShort,
    collateralBalanceLong,
    tokenSupply,
    inflection,
    cap,
    floor,
  } = formik.values
  const collateralWalletBalance = useErcBalance(collateralToken?.id)
  useEffect(() => {
    formik.setFieldValue('collateralWalletBalance', collateralWalletBalance)
  }, [collateralWalletBalance])

  useEffect(() => {
    if (referenceAssets.length > 0) {
      formik.setFieldValue('referenceAsset', referenceAssets[0], false)
    }
  }, [referenceAssets.length])

  useEffect(() => {
    if (
      collateralToken != null &&
      formik.values.gradient.toString() != '' &&
      formik.values.gradient >= 0 &&
      formik.values.gradient <= 1
    ) {
      const collateralBalanceLong = parseUnits(
        formik.values.collateralBalance,
        collateralToken.decimals
      )
        .mul(
          parseUnits(
            formik.values.gradient.toString(),
            collateralToken.decimals
          )
        )
        .div(parseUnits('1', collateralToken.decimals))
      const collateralBalanceShort = parseUnits(
        formik.values.collateralBalance,
        collateralToken.decimals
      )
        .mul(
          parseUnits('1', collateralToken.decimals).sub(
            parseUnits(
              formik.values.gradient.toString(),
              collateralToken.decimals
            )
          )
        )
        .div(parseUnits('1', collateralToken.decimals))

      formik.setValues((_values) => ({
        ..._values,
        collateralBalanceLong: parseFloat(
          formatUnits(collateralBalanceLong, collateralToken.decimals)
        ),
        collateralBalanceShort: parseFloat(
          formatUnits(collateralBalanceShort, collateralToken.decimals)
        ),
        tokenSupply: parseFloat(formik.values.collateralBalance),
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.collateralBalance, formik.values.gradient])

  const theme = useTheme()

  const possibleOptions =
    collateralTokens?.filter((v) =>
      v.symbol.includes(referenceAssetSearch.trim())
    ) || []

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
  useEffect(() => {
    switch (value) {
      case 'binary':
        formik.setValues((_values) => ({
          ..._values,
          cap: formik.values.inflection,
          floor: formik.values.inflection,
        }))
        break
      case 'linear':
        formik.setValues((_values) => ({
          ..._values,
          inflection: (formik.values.cap + formik.values.floor) / 2,
          gradient: 0.5,
        }))
        break
    }
  }, [value, formik.values.cap, formik.values.floor, formik.values.inflection])
  return (
    <Box>
      <Typography pb={theme.spacing(2)} variant="subtitle1">
        Define all the parameters for your Contingent Pool below.
      </Typography>
      <h3>Event</h3>
      <Stack spacing={2} direction="row">
        <FormControl fullWidth error={formik.errors.referenceAsset != null}>
          <Autocomplete
            id="referenceAsset"
            renderInput={(params) => (
              <>
                <TextField
                  {...params}
                  label="Reference Asset"
                  name="referenceAsset"
                  id="referenceAsset"
                  onBlur={formik.handleBlur}
                  error={formik.errors.referenceAsset != null}
                />
                <Typography
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  pt={2}
                  pb={4}
                >
                  {formik.errors.referenceAsset != null ? (
                    <FormHelperText>
                      {formik.errors.referenceAsset}
                    </FormHelperText>
                  ) : isCustomReferenceAsset ? (
                    <>
                      <CheckCircle
                        fontSize="small"
                        color="success"
                        sx={{ marginRight: theme.spacing(0.5) }}
                      />
                      <span>This reference asset is whitelisted</span>
                    </>
                  ) : (
                    <>
                      <Report
                        color="warning"
                        fontSize="small"
                        sx={{ marginRight: theme.spacing(0.5) }}
                      />
                      <span>
                        This reference asset is custom and not on our whitelist
                      </span>
                    </>
                  )}
                </Typography>
              </>
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
        <FormControl fullWidth>
          <DateTimePicker
            InputProps={{
              name: 'expiryTime',
              id: 'expiryTime',
              onBlur: formik.handleBlur,
              error: formik.errors.expiryTime != null,
            }}
            label="Expiry Time"
            onChange={(event) => {
              formik.setFieldValue('expiryTime', event)
            }}
            minDate={today}
            value={expiryTime}
            components={{
              OpenPickerIcon: ClockIcon,
            }}
            renderInput={(params) => <TextField {...params} />}
          />
          {formik.errors.expiryTime != null && (
            <FormHelperText sx={{ color: 'red' }}>
              {formik.errors.expiryTime}
            </FormHelperText>
          )}
        </FormControl>
      </Stack>
      <Box>
        <h3>Collateral</h3>

        <Stack pb={3} spacing={2} direction="row">
          <FormControl fullWidth error={formik.errors.collateralToken != null}>
            <Autocomplete
              options={possibleOptions}
              value={collateralToken}
              onChange={(_, newValue) => {
                formik.setFieldValue('collateralToken', newValue)
              }}
              getOptionLabel={(option: WhitelistCollateralToken) =>
                option?.symbol || ''
              }
              onInputChange={(event) => {
                if (event != null && event.target != null) {
                  setReferenceAssetSearch((event.target as any).value || '')
                }
              }}
              renderInput={(params) => (
                <TextField
                  error={formik.errors.collateralToken != null}
                  onBlur={formik.handleBlur}
                  {...params}
                  label="Collateral Asset"
                />
              )}
            />
            {formik.errors.collateralToken != null && (
              <FormHelperText>{formik.errors.collateralToken}</FormHelperText>
            )}
            {collateralWalletBalance != null && collateralToken != null && (
              <FormHelperText>
                Your balance: {parseFloat(collateralWalletBalance).toFixed(4)}{' '}
                {collateralToken?.symbol}{' '}
                <MaxCollateral
                  role="button"
                  onClick={() => {
                    if (collateralWalletBalance != null) {
                      formik.setFieldValue(
                        'collateralBalance',
                        collateralWalletBalance
                      )
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
              label="Collateral Amount"
              inputProps={{ min: 0 }}
              onBlur={formik.handleBlur}
              error={formik.errors.collateralBalance != null}
              value={formik.values.collateralBalance}
              type="number"
              onChange={(event) => {
                const collateralBalance = event.target.value

                formik.setValues((values) => ({
                  ...values,
                  collateralBalance,
                  tokenSupply: parseFloat(collateralBalance),
                }))
              }}
            />
            {formik.errors.collateralBalance != null && (
              <FormHelperText>{formik.errors.collateralBalance}</FormHelperText>
            )}
          </FormControl>
        </Stack>
      </Box>

      <h3>Payoff type</h3>
      <FormControl>
        <RadioGroup
          row
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          value={value}
          onChange={handleChange}
        >
          <FormControlLabel value="binary" control={<Radio />} label="Binary" />
          <FormControlLabel value="linear" control={<Radio />} label="Linear" />
          <FormControlLabel value="custom" control={<Radio />} label="Custom" />
        </RadioGroup>
      </FormControl>
      <Stack pb={3} spacing={2} direction="row">
        {value === 'binary' && (
          <Box pt={2} width="50%">
            <Stack spacing={3}>
              <Tooltip
                placement="top-end"
                title="Value of the reference asset at which the long token pays out Gradient and the short token 1 - Gradient (see advanced settings)."
              >
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
              </Tooltip>
            </Stack>
          </Box>
        )}
        {value === 'linear' && (
          <Box pt={2} width="50%">
            <Stack spacing={3}>
              <Tooltip
                placement="top-end"
                title="Value of the reference asset at or below which the long token pays out 0 and the short token 1 (max payout)."
              >
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
              </Tooltip>
              <Tooltip
                placement="top-end"
                title="Value of the reference asset at or above which the long token pays out 1 (max payout) and the short token 0."
              >
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
              </Tooltip>
            </Stack>
          </Box>
        )}
        {value === 'custom' && (
          <Box pt={2} width="50%">
            <FormControl fullWidth error={hasPaymentProfileError}>
              {hasPaymentProfileError && (
                <FormHelperText
                  sx={{ marginLeft: 0, paddingBottom: theme.spacing(3) }}
                >
                  Invalid input. Please ensure that the following is true:{' '}
                  <br />
                  <code>
                    Floor {'<='} Inflection {'<='} Cap
                  </code>
                </FormHelperText>
              )}
              <Stack spacing={3}>
                <Tooltip
                  placement="top-end"
                  title="Value of the reference asset at or below which the long token pays out 0 and the short token 1 (max payout)."
                >
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
                </Tooltip>
                <Tooltip
                  placement="top-end"
                  title="Value of the reference asset at which the long token pays out Gradient and the short token 1 - Gradient (see advanced settings)."
                >
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
                </Tooltip>
                <Tooltip
                  placement="top-end"
                  title="Value of the reference asset at or above which the long token pays out 1 (max payout) and the short token 0."
                >
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
                </Tooltip>

                <DefineAdvanced formik={formik} />
              </Stack>
            </FormControl>
          </Box>
        )}

        {floor != null &&
          cap != null &&
          inflection != null &&
          tokenSupply != null &&
          tokenSupply > 0 && (
            <Box width="50%">
              <PayoffProfile
                floor={floor}
                cap={cap}
                inflection={inflection}
                hasError={hasPaymentProfileError}
                collateralBalanceLong={collateralBalanceLong}
                collateralBalanceShort={collateralBalanceShort}
                tokenSupply={tokenSupply}
              />
            </Box>
          )}
      </Stack>
    </Box>
  )
}
