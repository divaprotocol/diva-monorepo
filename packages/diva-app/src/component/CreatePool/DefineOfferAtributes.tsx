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
  RadioGroup,
  FormControlLabel,
  Radio,
  Container,
  Card,
  Select,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  Accordion,
  InputLabel,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'

import { PayoffProfile } from './PayoffProfile'
import { useCreatePoolFormik } from './formik'
import { useErcBalance } from '../../hooks/useErcBalance'
import styled from '@emotion/styled'
import { DefineAdvanced } from './DefineAdvancedAttributes'
import { CheckCircle, Circle, Report } from '@mui/icons-material'
import { useWhitelist } from '../../hooks/useWhitelist'
import { WhitelistCollateralToken } from '../../lib/queries'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { getDateTime, userTimeZone } from '../../Util/Dates'
import MenuItem from '@mui/material/MenuItem'
import { useAppSelector } from '../../Redux/hooks'
import { selectUserAddress } from '../../Redux/appSlice'
import { useConnectionContext } from '../../hooks/useConnectionContext'

const MaxCollateral = styled.u`
  cursor: pointer;
  &:hover {
    color: ${(props) => (props.theme as any).palette.primary.main};
  }
`

export function DefineOfferAttributes({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const today = new Date()
  const [referenceAssetSearch, setReferenceAssetSearch] = useState('')
  const [value, setValue] = useState('Binary')
  const [direction, setDirection] = useState('Long')
  const [offerDuration, setOfferDuration] = useState(24 * 60 * 60) // 1 Day
  const [expanded, setExpanded] = useState(false)
  const [everyone, setEveryone] = useState(true)
  const [fillOrKill, setFillOrKill] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [unlimited, setUnlimited] = useState(true)
  const account = useAppSelector(selectUserAddress)
  const { isConnected, disconnect, connect } = useConnectionContext()
  useEffect(() => {
    if (window.innerWidth < 768) {
      setMobile(true)
    } else {
      setMobile(false)
    }
  }, [])

  const handleChange = (event) => {
    setValue(event.target.value)
    formik.setFieldValue('payoutProfile', event.target.value)
  }
  const handleDirectionChange = (event) => {
    setDirection(event.target.value)
    formik.setFieldValue('offerDirection', event.target.value)
  }

  const handleOfferDurationChange = (event) => {
    setOfferDuration(event.target.value)
    formik.setFieldValue(
      'offerDuration',
      Math.floor(event.target.value + Date.now() / 1000).toString()
    )
  }
  const handleMinTakerContributionsChange = (event) => {
    formik.setFieldValue('minTakerContribution', event.target.value)
  }
  const { referenceAssets, collateralTokens } = useWhitelist()
  const {
    referenceAsset,
    expiryTime,
    collateralToken,
    collateralBalance,
    inflection,
    capacity,
    cap,
    floor,
    gradient,
    payoutProfile,
  } = formik.values
  const collateralWalletBalance = useErcBalance(collateralToken?.id)
  useEffect(() => {
    if (window.ethereum) {
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
      // QUESTION Do we need to refactor here?
      formik.setValues((_values) => ({
        ..._values,
        collateralBalance: parseFloat(
          formatUnits(collateralBalance.toString(), collateralToken.decimals)
        ),
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.collateralBalance, formik.values.gradient])

  const theme = useTheme()

  const possibleOptions =
    collateralTokens?.filter((v) =>
      v.symbol.includes(referenceAssetSearch.trim())
    ) || []

  const hasPaymentProfileError =
    formik.errors.floor != null ||
    formik.errors.cap != null ||
    formik.errors.inflection != null ||
    formik.errors.gradient != null

  const isCustomReferenceAsset = referenceAssets.includes(referenceAsset)
  useEffect(() => {
    if (unlimited) {
      formik.setValues((_values) => ({
        ..._values,
        capacity: 'Unlimited',
      }))
    } else {
      formik.setValues((_values) => ({
        ..._values,
        capacity: formik.values.collateralBalance.toString(),
      }))
    }
  }, [unlimited, formik.values.collateralBalance])
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
          Offer Configuration
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
          </Container>
          <Container>
            <Box>
              <h3>Offer Terms</h3>

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
                            collateralBalance: parseFloat(collateralBalance),
                            takerShare:
                              parseFloat(collateralBalance) - values.yourShare,
                          }))
                          if (fillOrKill) {
                            if (collateralBalance != '') {
                              formik.setFieldValue(
                                'minTakerContribution',
                                parseFloat(collateralBalance) -
                                  formik.values.yourShare
                              )
                            } else {
                              formik.setFieldValue('minTakerContribution', 0)
                            }
                          }
                        }
                      } else {
                        formik.setValues((values) => ({
                          ...values,
                          collateralBalance: parseFloat(collateralBalance),
                          takerShare:
                            parseFloat(collateralBalance) - values.yourShare,
                        }))
                        if (fillOrKill) {
                          if (collateralBalance != '') {
                            formik.setFieldValue(
                              'minTakerContribution',
                              parseFloat(collateralBalance) -
                                formik.values.yourShare
                            )
                          } else {
                            formik.setFieldValue('minTakerContribution', 0)
                          }
                        }
                      }
                    }}
                  />
                  {formik.errors.collateralBalance != null && (
                    <FormHelperText>
                      {formik.errors.collateralBalance}
                    </FormHelperText>
                  )}
                </FormControl>
              </Stack>
            </Box>
          </Container>
          <Container>
            <Box>
              <Stack pb={3} spacing={2} direction={mobile ? 'column' : 'row'}>
                <FormControl
                  fullWidth
                  error={formik.errors.collateralBalance != null}
                >
                  <TextField
                    id="yourShare"
                    name="yourShare"
                    label="Your Share"
                    inputProps={{ step: 1, min: 0 }}
                    onBlur={formik.handleBlur}
                    error={formik.errors.yourShare != null}
                    value={formik.values.yourShare}
                    type="number"
                    onChange={(event) => {
                      const collateralBalance = event.target.value
                      formik.setValues((values) => ({
                        ...values,
                        yourShare: parseFloat(collateralBalance),
                        takerShare: values.collateralBalance, // TODO Fix this
                      }))
                      if (fillOrKill) {
                        formik.setFieldValue(
                          'minTakerContribution',
                          Number(formik.values.collateralBalance) -
                            parseFloat(collateralBalance)
                        )
                      }
                    }}
                  />
                  {formik.errors.collateralBalance != null && (
                    <FormHelperText>
                      {formik.errors.collateralBalance}
                    </FormHelperText>
                  )}
                  {!isNaN(formik.values.collateralBalance) && (
                    <FormHelperText>
                      You receive{' '}
                      {direction === 'Long' ? (
                        <strong>
                          {formik.values.collateralBalance} LONG Tokens
                        </strong>
                      ) : (
                        <strong>
                          {formik.values.collateralBalance} SHORT Tokens
                        </strong>
                      )}
                    </FormHelperText>
                  )}
                </FormControl>
                <FormControl fullWidth>
                  {/*TODO Removed error={formik.errors.collateralBalance} next to fullWidth due to error -> look into it*/}
                  <TextField
                    id="takerShare"
                    name="takerShare"
                    label="Taker Share"
                    inputProps={{ step: 1, min: 0 }}
                    onBlur={formik.handleBlur}
                    disabled={true}
                    error={formik.errors.takerShare != null}
                    value={
                      formik.values.collateralBalance - formik.values.yourShare
                    } // TODO Update with BigNumber
                    type="number"
                    onChange={(event) => {
                      const collateralBalance = event.target.value
                      formik.setValues((values) => ({
                        ...values,
                        takerShare: parseFloat(collateralBalance), // TODO Update with BigNumber
                      }))
                    }}
                  />
                  {!isNaN(formik.values.collateralBalance) && (
                    <FormHelperText>
                      Taker receives{' '}
                      {direction === 'Long' ? (
                        <strong>
                          {formik.values.collateralBalance} SHORT Tokens
                        </strong>
                      ) : (
                        <strong>
                          {formik.values.collateralBalance} LONG Tokens
                        </strong>
                      )}
                    </FormHelperText>
                  )}
                </FormControl>
              </Stack>
            </Box>
          </Container>

          <Stack pb={3} direction={mobile ? 'column' : 'row'}>
            <Container>
              <h3>Your Direction</h3>
              <FormControl>
                <RadioGroup
                  row
                  aria-labelledby="demo-row-radio-buttons-group-label"
                  name="row-radio-buttons-group"
                  value={direction}
                  onChange={handleDirectionChange}
                >
                  <FormControlLabel
                    value="Long"
                    control={<Radio />}
                    label="Long"
                  />
                  <FormControlLabel
                    value="Short"
                    control={<Radio />}
                    label="Short"
                  />
                </RadioGroup>
              </FormControl>
            </Container>
            {/*<Container>*/}
            <FormControl
              sx={{
                pt: theme.spacing(5),
                pl: theme.spacing(4),
                pr: theme.spacing(3),
              }}
              fullWidth
            >
              <TextField
                id="select"
                label="Offer Expires in"
                value={offerDuration}
                onChange={handleOfferDurationChange}
                select
              >
                <MenuItem value={60 * 60}>1 Hour</MenuItem>
                <MenuItem value={4 * 60 * 60}>4 Hours</MenuItem>
                <MenuItem value={12 * 60 * 60}>12 Hours</MenuItem>
                <MenuItem value={24 * 60 * 60}>1 Day</MenuItem>
                <MenuItem value={7 * 24 * 60 * 60}>7 Days</MenuItem>
              </TextField>
            </FormControl>
            {/*</Container>*/}
          </Stack>
          <Container>
            <Accordion
              expanded={expanded}
              onChange={() => setExpanded(!expanded)}
              sx={{
                maxWidth: '95%',
                background: 'none',
                padding: 0,
                borderTop: 'none',
                ':before': {
                  display: 'none',
                },
              }}
            >
              <AccordionSummary
                sx={{
                  paddingLeft: 0,
                }}
              >
                <Typography color="primary" variant="subtitle2">
                  Advanced Settings
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 0 }}>
                <Box pb={3}>
                  <Stack direction={mobile ? 'column' : 'row'}>
                    <Container sx={{ margin: -2, padding: 1 }}>
                      <FormControl
                        fullWidth
                        error={formik.errors.takerAddress != null}
                      >
                        <Tooltip placement="top-end" title="Taker Address">
                          <TextField
                            name="takerAddress"
                            disabled={everyone}
                            id="takerAddress"
                            label="Taker Address"
                            value={formik.values.takerAddress}
                            onChange={(event) => {
                              formik.setFieldValue(
                                'takerAddress',
                                event.target.value
                              )
                            }}
                            type="text"
                          />
                        </Tooltip>
                      </FormControl>
                      <FormControlLabel
                        sx={{ pb: theme.spacing(2) }}
                        control={
                          <Checkbox
                            defaultChecked={everyone}
                            onChange={() => {
                              formik.setFieldValue(
                                'takerAddress',
                                ethers.constants.AddressZero
                              )
                              setEveryone(!everyone)
                            }}
                          />
                        }
                        label="Everyone"
                      />
                      <FormControl
                        fullWidth
                        error={formik.errors.capacity != null}
                      >
                        <Tooltip
                          placement="top-end"
                          title="Maximum collateral that the pool can accept."
                        >
                          <TextField
                            name="capacity"
                            error={formik.errors.capacity != null}
                            disabled={unlimited}
                            onBlur={formik.handleBlur}
                            id="capacity"
                            label="Maximum Pool Capacity"
                            value={capacity}
                            helperText={
                              formik.errors.capacity != null
                                ? formik.errors.capacity
                                : ''
                            }
                            type="number"
                            onChange={formik.handleChange}
                          />
                        </Tooltip>
                      </FormControl>
                      <FormControlLabel
                        control={
                          <Checkbox
                            defaultChecked={unlimited}
                            onChange={() => {
                              formik.setFieldValue('capacity', 'Unlimited')
                              setUnlimited(!unlimited)
                            }}
                          />
                        }
                        label="Unlimited"
                      />
                    </Container>
                    <Container
                      sx={{ margin: -3, padding: 2, pr: 4, ml: -1.5, mr: -8 }}
                    >
                      <FormControl
                        fullWidth
                        error={formik.errors.minTakerContribution != null}
                      >
                        <Tooltip
                          placement="top-end"
                          title="Minimum collateral amount the taker has to contribute on first fill"
                        >
                          <TextField
                            name="minTakerContribution"
                            error={formik.errors.minTakerContribution != null}
                            disabled={fillOrKill}
                            onBlur={formik.handleBlur}
                            id="minTakerContribution"
                            label="Minimum Taker Contribution"
                            value={formik.values.minTakerContribution}
                            helperText={
                              formik.errors.minTakerContribution != null
                                ? formik.errors.minTakerContribution
                                : ''
                            }
                            type="string"
                            onChange={formik.handleChange}
                          />
                        </Tooltip>
                      </FormControl>
                      <FormControlLabel
                        control={
                          <Checkbox
                            defaultChecked={fillOrKill}
                            onChange={() => {
                              formik.setFieldValue(
                                'minTakerContribution',
                                (
                                  formik.values.collateralBalance -
                                  formik.values.yourShare
                                ).toString()
                              )
                              setFillOrKill(!fillOrKill)
                            }}
                          />
                        }
                        label="Fill Or Kill"
                      />
                    </Container>
                  </Stack>
                </Box>
              </AccordionDetails>
            </Accordion>
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
            gradient != null && (
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
