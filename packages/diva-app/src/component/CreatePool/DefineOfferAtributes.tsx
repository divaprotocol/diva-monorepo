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
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  Accordion,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { ethers } from 'ethers'
import { useCreatePoolFormik } from './formik'
import { useErcBalance } from '../../hooks/useErcBalance'
import styled from '@emotion/styled'
import { CheckCircle, Report } from '@mui/icons-material'
import { useWhitelist } from '../../hooks/useWhitelist'
import { WhitelistCollateralToken } from '../../lib/queries'
import { formatUnits, parseUnits } from 'ethers/lib/utils'

import { useAppSelector } from '../../Redux/hooks'
import { selectChainId, selectUserAddress } from '../../Redux/appSlice'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import { PayoffProfile } from '../Graphs/payOffProfile'
import { toExponentialOrNumber } from '../../Util/utils'
import KeyboardDoubleArrowUpOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowUpOutlined'
import KeyboardDoubleArrowDownOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowDownOutlined'
import KeyboardDoubleArrowRightOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowRightOutlined'
import { config } from '../../constants'
import { isAdminUser } from '../../Util/utils'

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
    yourShare,
    takerShare,
  } = formik.values
  const [referenceAssetSearch, setReferenceAssetSearch] = useState('')
  const [value, setValue] = useState(formik.values.payoutProfile)
  const [direction, setDirection] = useState(formik.values.offerDirection)
  const [offerExpiry, setOfferExpiry] = useState(
    Number(formik.values.offerExpiry) * 1000
  ) // 1 Day
  const [expanded, setExpanded] = useState(
    formik.values.takerAddress !== ethers.constants.AddressZero ||
      capacity !== 'Unlimited' ||
      Number(formik.values.minTakerContribution) ===
        formik.values.collateralBalance - formik.values.yourShare
  )
  const [everyone, setEveryone] = useState(
    formik.values.takerAddress === ethers.constants.AddressZero
  )
  const [offerExpiryToggle, setOfferExpiryToggle] = useState('1 Day')
  const [fillOrKill, setFillOrKill] = useState(
    Number(formik.values.minTakerContribution) ===
      formik.values.collateralBalance - formik.values.yourShare
  )
  const [mobile, setMobile] = useState(false)
  const [unlimited, setUnlimited] = useState(capacity == 'Unlimited')
  const userAddress = useAppSelector(selectUserAddress)
  const chainId = useAppSelector(selectChainId)
  const { disconnect, connect } = useConnectionContext()
  useEffect(() => {
    if (window.innerWidth < 768) {
      setMobile(true)
    } else {
      setMobile(false)
    }
  }, [])

  const handleChange = (event) => {
    setValue(event.target.value)
    formik.setFieldValue('cap', formik.initialValues.cap)
    formik.setFieldValue('floor', formik.initialValues.floor)
    formik.setFieldValue('inflection', formik.initialValues.inflection)
    formik.setFieldValue('gradient', formik.initialValues.gradient)
    formik.setFieldValue('payoutProfile', event.target.value)
  }
  const handleDirectionChange = (event) => {
    setDirection(event.target.value)
    formik.setFieldValue('offerDirection', event.target.value)
  }

  const handleOfferExpiryChange = (event) => {
    setOfferExpiryToggle('')
    setOfferExpiry(event.getTime())
    formik.setFieldValue(
      'offerExpiry',
      Math.floor(event.getTime() / 1000).toString()
    )
  }
  const handleOfferExpiryChangeBtnGrp = (event) => {
    setOfferExpiry(Number(event.target.value))
    const timeLeft = Number(event.target.value) - Date.now()
    console.log(timeLeft)
    if (timeLeft <= 3600000) {
      setOfferExpiryToggle('1 Hour')
    } else if (timeLeft > 3600000 && timeLeft <= 14400000) {
      setOfferExpiryToggle('4 Hrs')
    } else if (timeLeft > 14400000 && timeLeft <= 43200000) {
      setOfferExpiryToggle('12 Hrs')
    } else if (timeLeft > 43200000 && timeLeft <= 86400000) {
      setOfferExpiryToggle('1 Day')
    } else if (timeLeft > 86400000 && timeLeft <= 604800000) {
      setOfferExpiryToggle('7 Days')
    }
    formik.setFieldValue(
      'offerExpiry',
      Math.floor(event.target.value / 1000).toString()
    )
  }
  const handleMinTakerContributionsChange = (event) => {
    formik.setFieldValue('minTakerContribution', event.target.value)
  }
  const { referenceAssets, collateralTokens } = useWhitelist()

  const { balance: collateralWalletBalance } = useErcBalance(
    collateralToken?.id
  )
  useEffect(() => {
    if (payoutProfile === 'Binary') {
      formik.setFieldValue('gradient', 1)
      formik.setFieldValue('cap', formik.values.inflection)
      formik.setFieldValue('floor', formik.values.inflection)
    }
  }, [formik.values])
  useEffect(() => {
    if (payoutProfile === 'Linear') {
      formik.setFieldValue('inflection', (floor + cap) / 2)
    }
  }, [formik.values.floor, formik.values.inflection])
  useEffect(() => {
    if (payoutProfile === 'Linear') {
      formik.setFieldValue('inflection', (cap + floor) / 2)
    }
  }, [formik.values.cap, formik.values.inflection])
  useEffect(() => {
    formik.setFieldValue('takerShare', collateralBalance - yourShare)
    if (fillOrKill) {
      formik.setFieldValue(
        'minTakerContribution',
        collateralBalance - yourShare
      )
    }
  }, [formik.values])

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', () => {
        disconnect()
        connect('metamask')
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
    formik.setFieldValue(
      'collateralToken',
      config[chainId].collateralTokens?.[0]
    )
  }, [chainId])

  useEffect(() => {
    if (
      collateralToken != null &&
      formik.values.gradient.toString() != '' &&
      formik.values.gradient >= 0 &&
      formik.values.gradient <= 1 &&
      formik.values.collateralBalance.toString() != '' &&
      !isNaN(formik.values.collateralBalance)
    ) {
      const collateralBalance = parseUnits(
        formik.values.collateralBalance.toString(),
        collateralToken.decimals
      )
      // QUESTION Do we need to refactor here?
      formik.setValues((_values) => ({
        ..._values,
        collateralBalance: parseFloat(
          formatUnits(collateralBalance, collateralToken.decimals)
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
  const isCustomReferenceAssetAllowed = useMemo(
    () => config[chainId].isCustomReferenceAssetAllowed,
    [chainId]
  )
  const isCustomCollateralAssetAllowed = useMemo(
    () => config[chainId].isCustomCollateralAssetAllowed,
    [chainId]
  )

  const isAdmin = useMemo(
    () => isAdminUser(userAddress, chainId, config),
    [userAddress, chainId]
  )

  useEffect(() => {
    if (unlimited) {
      formik.setValues((_values) => ({
        ..._values,
        capacity: 'Unlimited',
      }))
    }
  }, [unlimited, formik.values.collateralBalance])

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
                    if (
                      event != null &&
                      event.target != null &&
                      (isCustomReferenceAssetAllowed || isAdmin)
                    ) {
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
                  label="Observation Time"
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
                    {`${formik.errors.expiryTime}`}
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
                value={formik.values.payoutProfile}
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
                      onChange={formik.handleChange}
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
                      if (
                        event != null &&
                        event.target != null &&
                        (isCustomCollateralAssetAllowed || isAdmin)
                      ) {
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
                      {`${formik.errors.collateralToken}`}
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
                    onChange={formik.handleChange}
                  />
                  {collateralWalletBalance != null &&
                    collateralToken != null && (
                      <FormHelperText>
                        Your balance:{' '}
                        {toExponentialOrNumber(
                          parseFloat(collateralWalletBalance)
                        )}{' '}
                        {collateralToken?.symbol} {'('}
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
                          Max
                        </MaxCollateral>
                        {')'}
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
                    onChange={formik.handleChange}
                  />
                  {formik.errors.collateralBalance != null && (
                    <FormHelperText>
                      {formik.errors.collateralBalance}
                    </FormHelperText>
                  )}
                  {!isNaN(formik.values.collateralBalance) && (
                    <FormHelperText>
                      Max payout:{' '}
                      {formik.values.collateralBalance +
                        ' ' +
                        collateralToken?.symbol}
                      {' ('}
                      <strong>
                        <span style={{ color: '#3393E0' }}>
                          {formik.values.yourShare != 0
                            ? (
                                formik.values.collateralBalance /
                                formik.values.yourShare
                              ).toFixed(2) + 'x'
                            : 'n/a'}
                        </span>
                      </strong>
                      {')'}
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
                    value={formik.values.takerShare} // TODO Update with BigNumber
                    type="number"
                    onChange={formik.handleChange}
                  />
                  {!isNaN(formik.values.collateralBalance) && (
                    <FormHelperText>
                      Max payout:{' '}
                      {formik.values.collateralBalance +
                        ' ' +
                        collateralToken?.symbol}
                      {' ('}
                      <strong>
                        <span style={{ color: '#3393E0' }}>
                          {formik.values.takerShare != 0
                            ? (
                                formik.values.collateralBalance /
                                formik.values.takerShare
                              ).toFixed(2) + 'x'
                            : 'n/a'}
                        </span>
                      </strong>
                      {')'}
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
                  value={formik.values.offerDirection}
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
            <Stack
              sx={{
                width: '100%',
                pt: theme.spacing(5),
                ml: theme.spacing(mobile ? 0 : 3),
                pr: theme.spacing(3),
              }}
            >
              <FormControl
                sx={{
                  pb: theme.spacing(2),
                }}
                fullWidth
              >
                <DateTimePicker
                  InputProps={{
                    name: 'offerDuration',
                    id: 'offerDuration',
                    onBlur: formik.handleBlur,
                    error: formik.errors.offerExpiry != null,
                  }}
                  label="Offer Expires in"
                  onChange={handleOfferExpiryChange}
                  minDate={today}
                  value={offerExpiry}
                  components={{
                    OpenPickerIcon: ClockIcon,
                  }}
                  renderInput={(params) => <TextField {...params} />}
                />
                {formik.errors.offerExpiry != null && (
                  <FormHelperText sx={{ color: 'red' }}>
                    {formik.errors.offerExpiry}
                  </FormHelperText>
                )}
              </FormControl>
              <ToggleButtonGroup
                fullWidth
                color="primary"
                size="small"
                value={offerExpiry}
                exclusive
                onChange={handleOfferExpiryChangeBtnGrp}
              >
                <ToggleButton
                  selected={offerExpiryToggle == '1 Hour'}
                  value={Date.now() + 60 * 60 * 1000}
                >
                  1 Hour
                </ToggleButton>
                <ToggleButton
                  selected={offerExpiryToggle == '4 Hrs'}
                  value={Date.now() + 4 * 60 * 60 * 1000}
                >
                  4 Hrs
                </ToggleButton>
                <ToggleButton
                  selected={offerExpiryToggle == '12 Hrs'}
                  value={Date.now() + 12 * 60 * 60 * 1000}
                >
                  12 Hrs
                </ToggleButton>
                <ToggleButton
                  selected={offerExpiryToggle == '1 Day'}
                  value={Date.now() + 24 * 60 * 60 * 1000}
                >
                  1 Day
                </ToggleButton>
                <ToggleButton
                  selected={offerExpiryToggle == '7 Days'}
                  value={Date.now() + 7 * 24 * 60 * 60 * 1000}
                >
                  7 Days
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
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
                      <FormControl fullWidth>
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
            Payoff Profiles
          </Typography>
          {floor != null &&
            cap != null &&
            inflection != null &&
            gradient != null && (
              <Box sx={{ maxWidth: '85%', marginLeft: 3, marginBottom: 2 }}>
                <PayoffProfile
                  floor={floor}
                  cap={cap}
                  inflection={inflection}
                  gradient={gradient}
                  hasError={hasPaymentProfileError}
                  referenceAsset={referenceAsset}
                  collateralToken={
                    collateralToken ? collateralToken.symbol : null
                  }
                />
              </Box>
            )}
          <Typography
            pb={theme.spacing(1)}
            pt={theme.spacing(1)}
            variant="subtitle1"
            color="white"
          >
            Payoff Scenarios
          </Typography>
          <Card
            style={{
              maxWidth: theme.spacing(60),
              border: '1px solid #1B3448',
              background:
                'linear-gradient(180deg, #051827 0%, rgba(5, 24, 39, 0) 100%)',
            }}
          >
            <Container>
              <Stack direction={'row'}>
                <KeyboardDoubleArrowUpOutlinedIcon
                  sx={{ mt: theme.spacing(2), mr: theme.spacing(2) }}
                />
                <Typography
                  fontSize={'0.85rem'}
                  sx={{ mt: theme.spacing(2) }}
                  style={{ color: 'white' }}
                >
                  {direction === 'Long' ? (
                    <>
                      <strong>
                        <span style={{ color: '#3393E0' }}>0.00x</span>
                      </strong>{' '}
                      your /{' '}
                      <strong>
                        <span style={{ color: '#3393E0' }}>
                          {(
                            formik.values.collateralBalance /
                            formik.values.takerShare
                          ).toFixed(2) + 'x'}
                        </span>
                      </strong>{' '}
                      taker multiple{' '}
                    </>
                  ) : (
                    <>
                      <strong>
                        <span style={{ color: '#3393E0' }}>
                          {(
                            formik.values.collateralBalance /
                            formik.values.yourShare
                          ).toFixed(2) + 'x'}
                        </span>
                      </strong>{' '}
                      your /{' '}
                      <strong>
                        <span style={{ color: '#3393E0' }}>0.00x</span>
                      </strong>{' '}
                      taker multiple{' '}
                    </>
                  )}
                  if the reported outcome is{' '}
                  {floor < inflection && inflection < cap ? 'at or ' : ''} below{' '}
                  {floor}{' '}
                </Typography>
              </Stack>
              <Stack direction={'row'}>
                <KeyboardDoubleArrowRightOutlinedIcon
                  sx={{ mt: theme.spacing(2), mr: theme.spacing(2) }}
                />
                <Typography
                  fontSize={'0.85rem'}
                  sx={{ mt: theme.spacing(2) }}
                  style={{ color: 'white' }}
                >
                  {direction === 'Long' ? (
                    <>
                      <strong>
                        <span style={{ color: '#3393E0' }}>
                          {(
                            formik.values.collateralBalance /
                            formik.values.yourShare
                          ).toFixed(2) + 'x'}
                        </span>
                      </strong>{' '}
                      your /{' '}
                      <strong>
                        <span style={{ color: '#3393E0' }}>0.00x</span>
                      </strong>{' '}
                      taker multiple{' '}
                    </>
                  ) : (
                    <>
                      <strong>
                        <span style={{ color: '#3393E0' }}>0.00x</span>
                      </strong>{' '}
                      your /{' '}
                      <strong>
                        <span style={{ color: '#3393E0' }}>
                          {(
                            formik.values.collateralBalance /
                            formik.values.takerShare
                          ).toFixed(2) + 'x'}
                        </span>
                      </strong>{' '}
                      taker multiple{' '}
                    </>
                  )}
                  if the reported outcome is{' '}
                  {floor < inflection && inflection < cap ? 'at or ' : ''} above{' '}
                  {cap}{' '}
                </Typography>
              </Stack>
              <Stack direction={'row'}>
                <KeyboardDoubleArrowDownOutlinedIcon
                  sx={{ mt: theme.spacing(2), mr: theme.spacing(2) }}
                />
                <Typography
                  fontSize={'0.85rem'}
                  sx={{ pb: theme.spacing(2), mt: theme.spacing(2) }}
                  style={{ color: 'white' }}
                >
                  {direction === 'Long' ? (
                    <>
                      <strong>
                        <span style={{ color: '#3393E0' }}>
                          {(
                            (gradient * formik.values.collateralBalance) /
                            formik.values.yourShare
                          ).toFixed(2) + 'x'}
                        </span>
                      </strong>{' '}
                      your /{' '}
                      <strong>
                        <span style={{ color: '#3393E0' }}>
                          {(
                            ((1 - gradient) * formik.values.collateralBalance) /
                            formik.values.takerShare
                          ).toFixed(2) + 'x'}
                        </span>
                      </strong>{' '}
                      taker multiple{' '}
                    </>
                  ) : (
                    <>
                      <strong>
                        <span style={{ color: '#3393E0' }}>
                          {(
                            ((1 - gradient) * formik.values.collateralBalance) /
                            formik.values.yourShare
                          ).toFixed(2) + 'x'}
                        </span>
                      </strong>{' '}
                      your /{' '}
                      <strong>
                        <span style={{ color: '#3393E0' }}>
                          {(
                            (gradient * formik.values.collateralBalance) /
                            formik.values.takerShare
                          ).toFixed(2) + 'x'}
                        </span>
                      </strong>{' '}
                      taker multiple{' '}
                    </>
                  )}
                  if the reported outcome is {inflection}
                </Typography>
              </Stack>
            </Container>
          </Card>
        </Stack>
      </Container>
    </Stack>
  )
}
