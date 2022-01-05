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
  Typography,
} from '@mui/material'
import { useFormik } from 'formik'
import { useState } from 'react'
import { useQuery } from 'react-query'

import { PayoffProfile } from './PayoffProfile'
import referenceAssets from './referenceAssets.json'
import { Tokens } from '../../lib/types'

export function StepOne({ next }: { next: () => void }) {
  const today = new Date()
  const [referenceAssetSearch, setReferenceAssetSearch] = useState('')
  const [referenceAssetValue, setReferenceAssetValue] = useState<string | null>(
    null
  )

  const tokensQuery = useQuery<Tokens>('tokens', () =>
    fetch('/tokenSymbols.json').then((res) => res.json())
  )

  const collateralTokenAssets = tokensQuery.data || {}

  const formik = useFormik({
    initialValues: {
      referenceAsset: referenceAssets[0],
      expiryDate: new Date(),
      amount: 1,
      floor: 0,
      cap: 2,
      strike: 1,
      collateral: null,
      shortPool: 10,
      longPool: 10,
      shortToken: 10,
      longToken: 10,
    },
    onSubmit: () => {
      next()
    },
    validate: (values) => {
      // validate expiry date, - today in 2 hrs? 12 hrs, 48 hrs?
      // validate other vars
      // floor can't be higher than strike
      // strike can't be lower than floor or higher than cap
      // cap can't be lower than strike

      return {}
    },
  })

  const possibleOptions = ['ETH'].concat(
    Object.keys(collateralTokenAssets).filter((v) =>
      v.startsWith(referenceAssetSearch)
    )
  )

  const {
    referenceAsset,
    expiryDate,
    shortPool,
    shortToken,
    amount,
    strike,
    cap,
    floor,
    longToken,
    longPool,
  } = formik.values

  return (
    <Box>
      <Box pb={3} pt={4}>
        <FormControl fullWidth>
          <InputLabel>Reference Asset</InputLabel>
          <Select
            name="referenceAsset"
            id="referenceAsset"
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
          <FormHelperText>Current value: 1234</FormHelperText>
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
                setReferenceAssetValue(newValue)
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
        strike != null &&
        shortToken != null &&
        longToken != null && (
          <PayoffProfile
            floor={floor}
            cap={cap}
            strike={strike}
            shortTokenAmount={shortToken}
            longTokenAmount={longToken}
          />
        )}
      <Box pb={3}>
        <FormControl fullWidth>
          <TextField
            inputProps={{ min: 0, max: strike }}
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
              id="strike"
              name="strike"
              label="Strike"
              inputProps={{
                min: floor,
                max: cap,
              }}
              sx={{
                minWidth: '80px',
              }}
              onChange={formik.handleChange}
              value={strike}
            />
            <Box sx={{ width: '100%' }}>
              <Slider
                aria-label="Strike"
                name="Strike"
                step={(cap - floor) / 20}
                value={strike}
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
                  formik.setFieldValue('strike', (event.target as any).value)
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
            inputProps={{ min: strike }}
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
            name="shortPool"
            id="shortPool"
            label="Short Pool Balance"
            inputProps={{ min: 0 }}
            value={shortPool}
            type="number"
            onChange={formik.handleChange}
          />
        </FormControl>
      </Box>
      <Box pb={3}>
        <FormControl fullWidth>
          <TextField
            name="longPool"
            id="longPool"
            label="Long Pool Balance"
            inputProps={{ min: 0 }}
            value={longPool}
            type="number"
            onChange={formik.handleChange}
          />
        </FormControl>
      </Box>
      <Box pb={3}>
        <FormControl fullWidth>
          <TextField
            name="shortToken"
            id="shortToken"
            label="Short Token Amount"
            value={shortToken}
            type="number"
            onChange={formik.handleChange}
          />
        </FormControl>
      </Box>
      <Box pb={3}>
        <FormControl fullWidth>
          <TextField
            name="longToken"
            id="longToken"
            label="Long Token Amount"
            value={longToken}
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
