import { DateTimePicker } from '@mui/lab'
import ClockIcon from '@mui/icons-material/AccessTime'
import KeyboardDoubleArrowUpOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowUpOutlined'
import KeyboardDoubleArrowRightOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowRightOutlined'
import KeyboardDoubleArrowDownOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowDownOutlined'
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
import { PayoffProfile } from '../Graphs/payOffProfile'
import { toExponentialOrNumber } from '../../Util/utils'

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
  const [value, setValue] = useState(formik.values.payoutProfile)
  const [mobile, setMobile] = useState(false)
  const handleChange = (event) => {
    formik.setFieldValue('cap', formik.initialValues.cap)
    formik.setFieldValue('floor', formik.initialValues.floor)
    formik.setFieldValue('inflection', formik.initialValues.inflection)
    formik.setFieldValue('gradient', formik.initialValues.gradient)
    setValue(event.target.value)
    formik.setFieldValue('payoutProfile', event.target.value)
  }
  const { referenceAssets, collateralTokens } = useWhitelist()
  const { disconnect, connect } = useConnectionContext()
  const {
    referenceAsset,
    expiryTime,
    collateralToken,
    gradient,
    inflection,
    cap,
    floor,
    payoutProfile,
  } = formik.values
  const collateralWalletBalance = useErcBalance(collateralToken?.id)
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
  }, [formik.values.floor, formik.values.inflection, formik.values.cap])
  useEffect(() => {
    if (window.ethereum && formik.values.jsonToExport !== '{}') {
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
  }, [payoutProfile, collateralWalletBalance])

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
      formik.values.collateralBalance.toString() != '' &&
      !isNaN(formik.values.collateralBalance)
    ) {
      const collateralBalance = parseUnits(
        formik.values.collateralBalance.toString(),
        collateralToken.decimals
      )
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
    formik.errors.inflection != null

  const isCustomReferenceAsset = referenceAssets.includes(referenceAsset)
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
                  {formik.errors.collateralBalance != null && (
                    <FormHelperText>
                      {formik.errors.collateralBalance}
                    </FormHelperText>
                  )}
                  {collateralWalletBalance != null && collateralToken != null && (
                    <FormHelperText>
                      Your balance:{' '}
                      {toExponentialOrNumber(Number(collateralWalletBalance))}{' '}
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
            <DefineAdvanced formik={formik} />
          </Container>
        </Box>
      </Container>
      <Container>
        <Stack>
          <Typography
            style={{ color: 'white' }}
            pb={theme.spacing(2)}
            pt={theme.spacing(2)}
            variant="subtitle1"
          >
            Payoff Profiles
          </Typography>
          {floor != null &&
            cap != null &&
            inflection != null &&
            gradient != null && (
              <Box
                sx={{
                  maxWidth: '85%',
                  marginLeft: 3,
                  marginBottom: 2,
                }}
              >
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
                  <strong>
                    0.00 {collateralToken != null ? collateralToken.symbol : ''}
                    /LONG
                  </strong>{' '}
                  and
                  <strong>
                    {' '}
                    1.00 {collateralToken != null ? collateralToken.symbol : ''}
                    /SHORT
                  </strong>{' '}
                  token if the reported outcome is{' '}
                  {floor < inflection && inflection < cap
                    ? 'at or '
                    : ''} below {floor}{' '}
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
                  <strong>
                    1.00 {collateralToken != null ? collateralToken.symbol : ''}
                    /LONG
                  </strong>{' '}
                  and
                  <strong>
                    {' '}
                    0.00 {collateralToken != null ? collateralToken.symbol : ''}
                    /SHORT
                  </strong>{' '}
                  token if the reported outcome is{' '}
                  {floor < inflection && inflection < cap
                    ? 'at or '
                    : ''} above {cap}{' '}
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
                  <strong>
                    {gradient.toString() !== '' ? gradient.toFixed(2) : 0}{' '}
                    {collateralToken != null ? collateralToken.symbol : ''}/LONG
                  </strong>{' '}
                  and{' '}
                  <strong>
                    {gradient.toString() !== '' ? (1 - gradient).toFixed(2) : 1}{' '}
                    {collateralToken != null ? collateralToken.symbol : ''}
                    /SHORT
                  </strong>{' '}
                  token if the reported outcome is {inflection}
                </Typography>
              </Stack>
            </Container>
          </Card>
        </Stack>
      </Container>
    </Stack>
  )
}
