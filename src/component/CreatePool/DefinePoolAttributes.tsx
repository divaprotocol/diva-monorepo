import { DatePicker } from '@mui/lab'
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
  Slider,
  Stack,
} from '@mui/material'
import { useFormik } from 'formik'
import { useState } from 'react'
import { useQuery } from 'react-query'

import { PayoffProfile } from './PayoffProfile'
import referenceAssets from './referenceAssets.json'
import { Tokens } from '../../lib/types'
import { useCreatePoolFormik } from './formik'
import { useErc20Balance } from '../../hooks/useErc20Balance'

export function DefinePoolAttributes({
  next,
  formik,
}: {
  next: () => void
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const today = new Date()
  const [referenceAssetSearch, setReferenceAssetSearch] = useState('')
  const [referenceAssetValue, setReferenceAssetValue] = useState<string | null>(
    null
  )

  useErc20Balance(formik.values.collateralToken)

  const tokensQuery = useQuery<Tokens>('tokens', () =>
    fetch('/tokenSymbols.json').then((res) => res.json())
  )

  const collateralTokenAssets = tokensQuery.data || {}

  const possibleOptions = ['ETH'].concat(
    Object.keys(collateralTokenAssets).filter((v) =>
      v.startsWith(referenceAssetSearch)
    )
  )

  const {
    referenceAsset,
    expiryDate,
    collateralBalanceShort,
    shortTokenSupply,
    amount,
    inflection,
    cap,
    floor,
    longTokenSupply,
    collateralBalanceLong,
  } = formik.values

  return (
    <Box>
      <Box pb={3} pt={4}>
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
              <MenuItem value={v}>{v}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box pb={3}>
        <FormControl fullWidth>
          <DatePicker
            InputProps={{
              name: 'expiryDate',
              id: 'expiryDate',
            }}
            label="Expiry Date"
            onChange={(event) => {
              formik.setFieldValue('expiryDate', event)
            }}
            minDate={today}
            value={expiryDate}
            renderInput={(params) => <TextField {...params} />}
          />
          <FormHelperText>8:00 pm local time (CET)</FormHelperText>
        </FormControl>
      </Box>
      <Box>
        <h3>Collateral</h3>

        <Box pb={3}>
          <FormControl fullWidth style={{ paddingRight: '3em' }}>
            <Autocomplete
              options={possibleOptions.slice(0, 100)}
              value={referenceAssetValue}
              onChange={(event, newValue) => {
                formik.setFieldValue('collateralToken', newValue)
              }}
              onInputChange={(event) => {
                if (event != null && event.target != null) {
                  setReferenceAssetSearch((event.target as any).value)
                }
              }}
              renderInput={(params) => <TextField {...params} label="Asset" />}
            />
          </FormControl>
        </Box>

        <Box pb={3}>
          <FormControl fullWidth>
            <TextField
              id="amount"
              name="amount"
              label="Amount"
              inputProps={{ min: 0 }}
              value={amount}
              type="number"
              onChange={formik.handleChange}
            />
          </FormControl>
        </Box>
      </Box>
      {floor != null &&
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
      <Box pb={3}>
        <FormControl fullWidth>
          <TextField
            inputProps={{ min: 0, max: inflection }}
            name="floor"
            id="floor"
            label="Floor"
            value={floor}
            type="number"
            onChange={formik.handleChange}
          />
        </FormControl>
      </Box>
      <Box pb={3}>
        <FormControl fullWidth>
          <Stack direction="row" spacing={2}>
            <TextField
              id="inflection"
              name="inflection"
              label="inflection"
              inputProps={{
                min: floor,
                max: cap,
              }}
              sx={{
                minWidth: '80px',
              }}
              onChange={formik.handleChange}
              value={inflection}
            />
            <Box sx={{ width: '100%' }}>
              <Slider
                aria-label="inflection"
                name="inflection"
                step={(cap - floor) / 20}
                value={inflection}
                max={cap}
                marks={[
                  {
                    value: floor,
                    label: floor,
                  },
                  {
                    value: cap,
                    label: cap,
                  },
                ]}
                onChange={(event) => {
                  formik.setFieldValue(
                    'inflection',
                    (event.target as any).value
                  )
                }}
                valueLabelDisplay="auto"
              />
            </Box>
          </Stack>
        </FormControl>
      </Box>
      <Box pb={3}>
        <FormControl fullWidth>
          <TextField
            inputProps={{ min: inflection }}
            name="cap"
            id="cap"
            label="Cap"
            value={cap}
            type="number"
            onChange={formik.handleChange}
          />
        </FormControl>
      </Box>

      <Box pb={3}>
        <FormControl fullWidth>
          <TextField
            name="collateralBalanceShort"
            id="collateralBalanceShort"
            label="Short Pool Balance"
            inputProps={{ min: 0 }}
            value={collateralBalanceShort}
            type="number"
            onChange={formik.handleChange}
          />
        </FormControl>
      </Box>
      <Box pb={3}>
        <FormControl fullWidth>
          <TextField
            name="collateralBalanceLong"
            id="collateralBalanceLong"
            label="Long Pool Balance"
            inputProps={{ min: 0 }}
            value={collateralBalanceLong}
            type="number"
            onChange={formik.handleChange}
          />
        </FormControl>
      </Box>
      <Box pb={3}>
        <FormControl fullWidth>
          <TextField
            name="shortTokenSupply"
            id="shortTokenSupply"
            label="Short Token Supply"
            value={shortTokenSupply}
            type="number"
            onChange={formik.handleChange}
          />
        </FormControl>
      </Box>
      <Box pb={3}>
        <FormControl fullWidth>
          <TextField
            name="longTokenSupply"
            id="longTokenSupply"
            label="Long Token Supply"
            value={longTokenSupply}
            type="number"
            onChange={formik.handleChange}
          />
        </FormControl>
      </Box>
      <Box pb={3}>
        <Button onClick={() => formik.handleSubmit()}>Next</Button>
      </Box>
    </Box>
  )
}
