import { DateTimePicker } from '@mui/lab'
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  TextField,
  Button,
  Autocomplete,
  Accordion,
  Slider,
  Stack,
  AccordionSummary,
  AccordionDetails,
  Typography,
  debounce,
  useTheme,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useQuery } from 'react-query'

import { PayoffProfile } from './PayoffProfile'
import referenceAssets from './referenceAssets.json'
import { Tokens } from '../../lib/types'
import { useCreatePoolFormik } from './formik'
import { useBalance } from '../../hooks/useBalance'

function DefineAdvanced({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const [expanded, setExpanded] = useState(false)
  const {
    collateralBalanceShort,
    shortTokenSupply,
    longTokenSupply,
    collateralBalanceLong,
  } = formik.values

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
      <AccordionSummary aria-controls="panel1d-content" id="panel1d-header">
        <Typography>Advanced Settings</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box pb={3}>
          <FormControl
            fullWidth
            error={formik.errors.collateralBalanceShort != null}
          >
            <TextField
              name="collateralBalanceShort"
              id="collateralBalanceShort"
              label="Short Pool Balance"
              error={formik.errors.collateralBalanceShort != null}
              inputProps={{ min: 0 }}
              value={collateralBalanceShort}
              type="number"
              onChange={formik.handleChange}
            />
            {formik.errors.collateralBalanceShort != null && (
              <FormHelperText>
                {formik.errors.collateralBalanceShort}
              </FormHelperText>
            )}
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl
            fullWidth
            error={formik.errors.collateralBalanceLong != null}
          >
            <TextField
              name="collateralBalanceLong"
              id="collateralBalanceLong"
              label="Long Pool Balance"
              error={formik.errors.collateralBalanceLong != null}
              inputProps={{ min: 0 }}
              value={collateralBalanceLong}
              type="number"
              onChange={formik.handleChange}
            />
            {formik.errors.collateralBalanceLong != null && (
              <FormHelperText>
                {formik.errors.collateralBalanceLong}
              </FormHelperText>
            )}
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl fullWidth error={formik.errors.shortTokenSupply != null}>
            <TextField
              name="shortTokenSupply"
              id="shortTokenSupply"
              error={formik.errors.shortTokenSupply != null}
              label="Short Token Supply"
              value={shortTokenSupply}
              type="number"
              onChange={formik.handleChange}
            />
            {formik.errors.shortTokenSupply != null && (
              <FormHelperText>{formik.errors.shortTokenSupply}</FormHelperText>
            )}
          </FormControl>
        </Box>
        <Box pb={3}>
          <FormControl fullWidth error={formik.errors.longTokenSupply != null}>
            <TextField
              name="longTokenSupply"
              error={formik.errors.longTokenSupply != null}
              id="longTokenSupply"
              label="Long Token Supply"
              value={longTokenSupply}
              type="number"
              onChange={formik.handleChange}
            />
            {formik.errors.longTokenSupply != null && (
              <FormHelperText>{formik.errors.longTokenSupply}</FormHelperText>
            )}
          </FormControl>
        </Box>
      </AccordionDetails>
    </Accordion>
  )
}

export function DefinePoolAttributes({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const today = new Date()
  const [referenceAssetSearch, setReferenceAssetSearch] = useState('')

  const tokensQuery = useQuery<Tokens>('tokens', () =>
    fetch('/ropstenTokens.json').then((res) => res.json())
  )

  const collateralTokenAssets = tokensQuery.data || {}
  const collateralTokenAddress =
    collateralTokenAssets[formik.values.collateralTokenSymbol as string]
  const collateralWalletBalance = useBalance(collateralTokenAddress)

  useEffect(() => {
    formik.setFieldValue('collateralWalletBalance', collateralWalletBalance)
  }, [collateralWalletBalance])

  const theme = useTheme()

  const possibleOptions = Object.keys(collateralTokenAssets).filter((v) =>
    referenceAssetSearch.trim().length > 0
      ? v.startsWith(referenceAssetSearch.trim())
      : true
  )

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

  const onChangeSlide = useCallback(
    debounce((event) => {
      formik.setFieldValue('inflection', (event.target as any).value)
    }),
    []
  )

  const hasCollateralWalletBalanceError =
    (formik.errors.collateralWalletBalance || '').length > 0

  return (
    <Box pb={10}>
      <Box pb={3} pt={3}>
        <FormControl fullWidth>
          <InputLabel>Reference Asset</InputLabel>
          <Select
            name="referenceAsset"
            id="referenceAsset"
            error={formik.errors.referenceAsset != null}
            label="Reference Asset"
            onChange={(event) => {
              formik.setFieldValue('referenceAsset', event.target.value)
            }}
            value={referenceAsset}
          >
            {referenceAssets.map((v) => (
              <MenuItem key={v} value={v}>
                {v}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box pb={3}>
        <FormControl fullWidth>
          <DateTimePicker
            InputProps={{
              name: 'expiryDate',
              id: 'expiryDate',
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
          <FormControl fullWidth>
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
                <TextField {...params} label="Collateral Asset" />
              )}
            />
            {collateralWalletBalance != null && (
              <FormHelperText>
                Your balance: {parseFloat(collateralWalletBalance).toFixed(6)}{' '}
                {collateralTokenSymbol}
              </FormHelperText>
            )}
          </FormControl>
          <FormControl fullWidth>
            <TextField
              id="collateralAmount"
              name="collateralAmount"
              label="Collateral Amount"
              inputProps={{ min: 0 }}
              error={hasCollateralWalletBalanceError}
              value={collateralBalanceLong + collateralBalanceShort}
              type="number"
              onChange={(event) => {
                const num = parseFloat(event.target.value)
                setCollateralBalance(num)
              }}
            />
            {hasCollateralWalletBalanceError && (
              <FormHelperText>
                {formik.errors.collateralWalletBalance}{' '}
                <Button
                  onClick={() => {
                    if (collateralWalletBalance != null) {
                      setCollateralBalance(parseFloat(collateralWalletBalance))
                    }
                  }}
                >
                  Set max
                </Button>
              </FormHelperText>
            )}

            {formik.errors.collateralBalance != null && (
              <FormHelperText>{formik.errors.collateralBalance}</FormHelperText>
            )}
          </FormControl>
        </Stack>
      </Box>
      <Box pb={3}>
        <FormControl fullWidth error={formik.errors.floor != null}>
          <TextField
            inputProps={{ min: 0, max: inflection }}
            name="floor"
            error={formik.errors.floor != null}
            id="floor"
            label="Floor"
            value={floor}
            type="number"
            onChange={formik.handleChange}
          />
          {formik.errors.floor != null && (
            <FormHelperText>{formik.errors.floor}</FormHelperText>
          )}
        </FormControl>
      </Box>
      <Box pb={3}>
        <h3>Payoff Profile</h3>
        <FormControl fullWidth error={formik.errors.inflection != null}>
          <Stack direction="row" spacing={4}>
            <TextField
              id="inflection"
              error={formik.errors.inflection != null}
              name="inflection"
              label="inflection"
              inputProps={{
                min: floor,
                max: cap,
              }}
              InputProps={{
                endAdornment: formik.errors.inflection == null && (
                  <Box sx={{ width: '100%' }}>
                    <Slider
                      aria-label="inflection"
                      name="inflection"
                      step={(cap - floor) / 20}
                      value={inflection}
                      min={floor}
                      max={cap}
                      onChange={onChangeSlide}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                ),
              }}
              sx={{
                width: '100%',
              }}
              onChange={formik.handleChange}
              value={inflection}
            />
          </Stack>
          {formik.errors.inflection != null && (
            <FormHelperText>{formik.errors.inflection}</FormHelperText>
          )}
        </FormControl>
      </Box>
      <Box pb={3}>
        <FormControl fullWidth error={formik.errors.cap != null}>
          <TextField
            error={formik.errors.cap != null}
            inputProps={{ min: inflection }}
            name="cap"
            id="cap"
            label="Cap"
            value={cap}
            type="number"
            onChange={formik.handleChange}
          />
          {formik.errors.cap != null && (
            <FormHelperText>{formik.errors.cap}</FormHelperText>
          )}
        </FormControl>
      </Box>

      {formik.isValid &&
        floor != null &&
        cap != null &&
        inflection != null &&
        shortTokenSupply != null &&
        longTokenSupply != null && (
          <PayoffProfile
            floor={floor}
            cap={cap}
            strike={inflection}
            shortTokenAmount={shortTokenSupply}
            longTokenAmount={longTokenSupply}
          />
        )}

      <DefineAdvanced formik={formik} />

      <Box pb={3} pt={5}>
        <Button
          size="medium"
          onClick={() => {
            formik.setFieldValue('step', 2)
          }}
          disabled={!formik.isValid}
        >
          Next
        </Button>
      </Box>
    </Box>
  )
}
