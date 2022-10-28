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
  Container,
  Card,
} from '@mui/material'
import { useEffect, useState } from 'react'

import { PayoffProfile } from './PayoffProfile'
import { useCreatePoolFormik } from './formik'
import { useErcBalance } from '../../hooks/useErcBalance'
import styled from '@emotion/styled'
import { DefineAdvanced } from './DefineAdvancedAttributes'
import {
  CheckCircle,
  Circle,
  FormatListBulleted,
  Report,
} from '@mui/icons-material'
import { useWhitelist } from '../../hooks/useWhitelist'
import { WhitelistCollateralToken } from '../../lib/queries'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { getDateTime, userTimeZone } from '../../Util/Dates'
import { useConnectionContext } from '../../hooks/useConnectionContext'

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
  const [value, setValue] = useState('Binary')
  const [mobile, setMobile] = useState(false)
  const handleChange = (event) => {
    setValue(event.target.value)
    formik.setFieldValue('payoutProfile', event.target.value)
  }
  const { referenceAssets, collateralTokens } = useWhitelist()
  const { disconnect, connect } = useConnectionContext()
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
    gradient,
    payoutProfile,
  } = formik.values
  const collateralWalletBalance = useErcBalance(collateralToken?.id)
  useEffect(() => {
    if (window.ethereum && formik.values.jsonToExport !== '{}') {
      window.ethereum.on('accountsChanged', () => {
        disconnect()
        connect()
        formik.setFieldValue('collateralWalletBalance', collateralWalletBalance)
      })
    }
  }, [])
  useEffect(() => {
    if (window.innerWidth < 768) {
      setMobile(true)
    } else {
      setMobile(false)
    }
  }, [])
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
      formik.values.gradient <= 1 &&
      formik.values.collateralBalance.toString() != ''
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
    switch (payoutProfile) {
      case 'Binary':
        formik.setFieldValue('cap', formik.values.inflection)
        formik.setFieldValue('floor', formik.values.inflection)
        formik.setFieldValue('gradient', 1)
        break
      case 'Linear':
        formik.setFieldValue('gradient', 0.5)
        formik.setFieldValue(
          'cap',
          formik.values.inflection + formik.values.inflection / 2
        )
        formik.setFieldValue(
          'floor',
          formik.values.inflection - formik.values.inflection / 2
        )
        break
      case 'Custom':
        formik.setFieldValue(
          'cap',
          formik.values.inflection + formik.values.inflection / 2
        )
        formik.setFieldValue(
          'floor',
          formik.values.inflection - formik.values.inflection / 2
        )
        formik.setFieldValue(
          'inflection',
          (formik.values.cap + formik.values.floor) / 2
        )
        break
    }
  }, [payoutProfile])

  return (
    <Stack direction={mobile ? 'column' : 'row'}>
      <Container sx={{ minWidth: '60%' }}>
        <Typography
          style={{ color: 'white' }}
          pb={theme.spacing(2)}
          variant="subtitle1"
        >
          Pool Configuration
        </Typography>
        <Box
          sx={{ pb: theme.spacing(5) }}
          border={1}
          borderColor="secondary.dark"
        >
          <Container>
            <h3>Event</h3>
            <Stack spacing={2} direction={mobile ? 'column' : 'row'}>
              <FormControl
                fullWidth
                error={formik.errors.referenceAsset != null}
              >
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
                              This reference asset is custom and not on our
                              whitelist
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

            <h3>Payoff Type</h3>
            <FormControl>
              <RadioGroup
                row
                aria-labelledby="demo-row-radio-buttons-group-label"
                name="row-radio-buttons-group"
                value={value}
                onChange={handleChange}
              >
                <FormControlLabel
                  value="Binary"
                  control={<Radio />}
                  label="Binary"
                />
                <FormControlLabel
                  value="Linear"
                  control={<Radio />}
                  label="Linear"
                />
                <FormControlLabel
                  value="Custom"
                  control={<Radio />}
                  label="Custom"
                />
              </RadioGroup>
            </FormControl>
            <Stack
              pr={-5}
              pb={3}
              spacing={2}
              direction={mobile ? 'column' : 'row'}
            >
              {value === 'Binary' && (
                <Box pt={2} width="100%">
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
                        step: 1,
                        min: floor,
                        max: cap,
                      }}
                      type="number"
                      onChange={(event) => {
                        if (payoutProfile === 'Binary') {
                          formik.handleChange(event)
                          formik.setValues((values) => ({
                            ...values,
                            cap: parseFloat(event.target.value),
                            floor: parseFloat(event.target.value),
                            inflection: parseFloat(event.target.value),
                            gradient: 1,
                          }))
                        }
                      }}
                      value={inflection}
                      sx={{ width: mobile ? '100%' : '48%' }}
                    />
                  </Tooltip>
                </Box>
              )}
              {value === 'Linear' && (
                <Box pt={2} width="100%">
                  <Stack
                    // sx={{ justifyContent: 'space-between' }}
                    direction={mobile ? 'column' : 'row'}
                    spacing={2}
                  >
                    <Tooltip
                      placement="top-end"
                      title="Value of the reference asset at or below which the long token pays out 0 and the short token 1 (max payout)."
                    >
                      <TextField
                        inputProps={{ step: 1, min: 0, max: inflection }}
                        name="floor"
                        error={formik.errors.floor != null}
                        id="floor"
                        onBlur={formik.handleBlur}
                        label="Floor"
                        value={floor}
                        type="number"
                        onChange={(event) => {
                          if (payoutProfile === 'Linear') {
                            formik.handleChange(event)
                            formik.setValues((values) => ({
                              ...values,
                              floor: parseFloat(event.target.value),
                              inflection:
                                (parseFloat(event.target.value) + cap) / 2,
                            }))
                          }
                        }}
                        sx={{ width: '100%' }}
                      />
                    </Tooltip>
                    <Tooltip
                      placement="top-end"
                      title="Value of the reference asset at or above which the long token pays out 1 (max payout) and the short token 0."
                    >
                      <TextField
                        error={formik.errors.cap != null}
                        inputProps={{ step: 1, min: inflection }}
                        onBlur={formik.handleBlur}
                        name="cap"
                        id="cap"
                        label="Cap"
                        value={cap}
                        type="number"
                        onChange={(event) => {
                          formik.handleChange(event)
                          formik.setValues((values) => ({
                            ...values,
                            cap: parseFloat(event.target.value),
                            inflection:
                              (parseFloat(event.target.value) + floor) / 2,
                          }))
                        }}
                        sx={{ width: '100%' }}
                      />
                    </Tooltip>
                  </Stack>
                </Box>
              )}
              {value === 'Custom' && (
                <Box pt={2} width="100%">
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
                    <Stack sx={{ justifyContent: 'space-between' }} spacing={3}>
                      <Stack
                        sx={{ justifyContent: 'space-between' }}
                        direction={mobile ? 'column' : 'row'}
                        spacing={2}
                      >
                        <Tooltip
                          placement="top-end"
                          title="Value of the reference asset at or below which the long token pays out 0 and the short token 1 (max payout)."
                        >
                          <TextField
                            inputProps={{ step: 1, min: 0, max: inflection }}
                            name="floor"
                            error={formik.errors.floor != null}
                            id="floor"
                            onBlur={formik.handleBlur}
                            label="Floor"
                            value={floor}
                            type="number"
                            onChange={formik.handleChange}
                            sx={{ width: '100%' }}
                          />
                        </Tooltip>
                        <Tooltip
                          placement="top-end"
                          title="Value of the reference asset at or above which the long token pays out 1 (max payout) and the short token 0."
                        >
                          <TextField
                            error={formik.errors.cap != null}
                            inputProps={{ step: 1, min: inflection }}
                            onBlur={formik.handleBlur}
                            name="cap"
                            id="cap"
                            label="Cap"
                            value={cap}
                            type="number"
                            onChange={formik.handleChange}
                            sx={{ width: '100%' }}
                          />
                        </Tooltip>
                      </Stack>
                      <Stack
                        sx={{ justifyContent: 'space-between' }}
                        direction={mobile ? 'column' : 'row'}
                        spacing={2}
                      >
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
                              step: 1,
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
                          title="Payout of long token at inflection. Short token payout at inflection is 1-Gradient."
                        >
                          <TextField
                            name="gradient"
                            id="gradient"
                            label="Gradient"
                            onBlur={formik.handleBlur}
                            error={formik.errors.gradient != null}
                            inputProps={{ step: 0.01, min: 0 }}
                            onChange={formik.handleChange}
                            value={gradient}
                            type="number"
                            sx={{ width: '100%' }}
                          />
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </FormControl>
                </Box>
              )}
            </Stack>
            <Box>
              <h3>Collateral</h3>

              <Stack pb={3} spacing={2} direction={mobile ? 'column' : 'row'}>
                <FormControl
                  fullWidth
                  error={formik.errors.collateralToken != null}
                >
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
                        setReferenceAssetSearch(
                          (event.target as any).value || ''
                        )
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
                    <FormHelperText>
                      {formik.errors.collateralToken}
                    </FormHelperText>
                  )}
                  {collateralWalletBalance != null && collateralToken != null && (
                    <FormHelperText>
                      Your balance:{' '}
                      {parseFloat(collateralWalletBalance).toFixed(4)}{' '}
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
                    inputProps={{ step: 1, min: 0 }}
                    onBlur={formik.handleBlur}
                    error={formik.errors.collateralBalance != null}
                    value={formik.values.collateralBalance}
                    type="number"
                    onChange={(event) => {
                      const value = event.target.value
                      const arr = value.split('.')
                      const collateralBalance = event.target.value
                      if (arr.length > 1) {
                        if (arr[1].length <= collateralToken.decimals) {
                          formik.setValues((values) => ({
                            ...values,
                            collateralBalance,
                            tokenSupply: parseFloat(collateralBalance),
                          }))
                        }
                      } else {
                        formik.setValues((values) => ({
                          ...values,
                          collateralBalance,
                          tokenSupply: parseFloat(collateralBalance),
                        }))
                      }
                    }}
                  />
                  {formik.errors.collateralBalance != null && (
                    <FormHelperText>
                      {formik.errors.collateralBalance}
                    </FormHelperText>
                  )}
                  {!isNaN(formik.values.tokenSupply) && (
                    <FormHelperText>
                      You receive {formik.values.tokenSupply} LONG and{' '}
                      {formik.values.tokenSupply} SHORT tokens
                    </FormHelperText>
                  )}
                </FormControl>
              </Stack>
            </Box>
            <DefineAdvanced formik={formik} />
          </Container>
        </Box>
      </Container>
      <Container>
        <Stack>
          <Typography
            style={{ color: 'white' }}
            pb={theme.spacing(2)}
            variant="subtitle1"
          >
            Payoff Profile
          </Typography>
          {floor != null &&
            cap != null &&
            inflection != null &&
            tokenSupply != null &&
            tokenSupply > 0 && (
              <Box sx={{ maxWidth: '85%' }}>
                <PayoffProfile
                  floor={floor}
                  cap={cap}
                  inflection={inflection}
                  gradient={gradient}
                  hasError={hasPaymentProfileError}
                />
              </Box>
            )}
          <Card
            style={{
              maxWidth: theme.spacing(60),
              border: '1px solid #1B3448',
              background:
                'linear-gradient(180deg, #051827 0%, rgba(5, 24, 39, 0) 100%)',
            }}
          >
            <Container>
              <Typography
                pb={theme.spacing(1)}
                pt={theme.spacing(1)}
                variant="subtitle1"
              >
                Payoff Scenarios
              </Typography>
              <Typography
                fontSize={'0.85rem'}
                sx={{ mt: theme.spacing(2) }}
                style={{ color: 'white' }}
              >
                <Circle sx={{ height: 0.02, maxWidth: 0.02 }} /> If{' '}
                {referenceAsset} is{' '}
                <strong>
                  {floor < inflection && inflection < cap ? 'at or ' : ''} below{' '}
                  {floor}{' '}
                </strong>{' '}
                on{' '}
                {expiryTime != null && !isNaN(expiryTime.getTime())
                  ? expiryTime.toLocaleString().slice(0, 11) +
                    ' ' +
                    getDateTime(Number(expiryTime) / 1000).slice(11, 19) +
                    ' ' +
                    userTimeZone()
                  : ''}
                , the payout will be{' '}
                <strong>
                  0.00 {collateralToken != null ? collateralToken.symbol : ''}{' '}
                  per LONG
                </strong>{' '}
                and
                <strong>
                  {' '}
                  1.00 {collateralToken != null
                    ? collateralToken.symbol
                    : ''}{' '}
                  per SHORT
                </strong>{' '}
                token
              </Typography>
              <Typography
                fontSize={'0.85rem'}
                sx={{ mt: theme.spacing(2) }}
                style={{ color: 'white' }}
              >
                <Circle sx={{ height: 0.02, maxWidth: 0.02 }} /> If{' '}
                {referenceAsset} is{' '}
                <strong>
                  {floor < inflection && inflection < cap ? 'at or ' : ''} above{' '}
                  {cap}{' '}
                </strong>{' '}
                on{' '}
                {expiryTime != null && !isNaN(expiryTime.getTime())
                  ? expiryTime.toLocaleString().slice(0, 11) +
                    ' ' +
                    getDateTime(Number(expiryTime) / 1000).slice(11, 19) +
                    ' ' +
                    userTimeZone()
                  : ''}
                , the payout will be{' '}
                <strong>
                  1.00 {collateralToken != null ? collateralToken.symbol : ''}{' '}
                  per LONG
                </strong>{' '}
                and
                <strong>
                  {' '}
                  0.00 {collateralToken != null
                    ? collateralToken.symbol
                    : ''}{' '}
                  per SHORT
                </strong>{' '}
                token
              </Typography>
              <Typography
                fontSize={'0.85rem'}
                sx={{ pb: theme.spacing(2), mt: theme.spacing(2) }}
                style={{ color: 'white' }}
              >
                <Circle sx={{ height: 0.02, maxWidth: 0.02 }} />
                If {referenceAsset} is{' '}
                <strong>
                  {' '}
                  at
                  {' ' + inflection}{' '}
                </strong>{' '}
                on{' '}
                {expiryTime != null && !isNaN(expiryTime.getTime())
                  ? expiryTime.toLocaleString().slice(0, 11) +
                    ' ' +
                    getDateTime(Number(expiryTime) / 1000).slice(11, 19) +
                    ' ' +
                    userTimeZone()
                  : ''}
                , the payout will be{' '}
                <strong>
                  {gradient.toString() !== '' ? gradient.toFixed(2) : 0}{' '}
                  {collateralToken != null ? collateralToken.symbol : ''} per
                  LONG
                </strong>{' '}
                and{' '}
                <strong>
                  {gradient.toString() !== '' ? (1 - gradient).toFixed(2) : 1}{' '}
                  {collateralToken != null ? collateralToken.symbol : ''} per
                  SHORT
                </strong>{' '}
                token
              </Typography>
            </Container>
          </Card>
        </Stack>
      </Container>
    </Stack>
  )
}
