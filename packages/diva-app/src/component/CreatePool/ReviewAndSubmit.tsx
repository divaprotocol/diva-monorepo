import {
  Card,
  Container,
  FormControl,
  FormHelperText,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { Box } from '@mui/material'
import request from 'graphql-request'
import { useQuery } from 'react-query'
import { config } from '../../constants'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { WhitelistQueryResponse, queryWhitelist } from '../../lib/queries'
import { useCreatePoolFormik } from './formik'
import { Circle } from '@mui/icons-material'
import { PayoffProfile } from './PayoffProfile'
import { useWhitelist } from '../../hooks/useWhitelist'
import { useEffect, useState } from 'react'
import {
  getDateTime,
  getExpiryMinutesFromNow,
  userTimeZone,
} from '../../Util/Dates'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import { ethers } from 'ethers'
import ERC20 from '@diva/contracts/abis/erc20.json'

export function ReviewAndSubmit({
  formik,
  transaction,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
  transaction?: string
}) {
  const { values } = formik
  const theme = useTheme()
  const { provider } = useConnectionContext()
  const chainId = provider?.network?.chainId
  const dataSource = useWhitelist()
  const [dataSourceName, setDataSourceName] = useState('')
  const [mobile, setMobile] = useState(false)
  const [tokenSymbol, setTokenSymbol] = useState('')

  useEffect(() => {
    const tokenContract = new ethers.Contract(
      formik.values.collateralToken.id,
      ERC20,
      provider.getSigner()
    )
    tokenContract.symbol().then((symbol) => {
      setTokenSymbol(symbol)
    })
  }, [])
  useEffect(() => {
    if (window.innerWidth < 768) {
      setMobile(true)
    } else {
      setMobile(false)
    }
  }, [])
  useEffect(() => {
    const dataName = dataSource?.dataProviders?.find(
      (dataName: { id: string }) => dataName?.id == values.dataProvider
    )
    if (dataName?.name != null) {
      setDataSourceName(
        dataName.name + ' (' + getShortenedAddress(values.dataProvider) + ')'
      )
    } else {
      setDataSourceName(values.dataProvider)
    }
  }, [dataSource.dataProviders, values.dataProvider])

  const whitelistQuery = useQuery<WhitelistQueryResponse>('whitelist', () =>
    request(config[chainId].whitelistSubgraph, queryWhitelist)
  )

  const matchingDataFeedProviders =
    whitelistQuery.data?.dataProviders.filter((v) =>
      v.dataFeeds.some(
        (f) => f.referenceAssetUnified === formik.values.referenceAsset
      )
    ) || []

  const isWhitelistedDataFeed =
    matchingDataFeedProviders.length > 0 &&
    matchingDataFeedProviders.some((v) => formik.values.dataProvider === v.id)
  return (
    <Stack
      direction={mobile ? 'column' : 'row'}
      sx={{ justifyContent: 'space-between' }}
    >
      <Container sx={{ minWidth: '60%' }}>
        <Typography
          pb={theme.spacing(1)}
          pt={theme.spacing(1)}
          variant="subtitle1"
          color="white"
        >
          Review
        </Typography>
        <Box border={1} borderColor="secondary.dark">
          <Container sx={{ pb: theme.spacing(4) }}>
            <Stack spacing={theme.spacing(2)}>
              <Typography pt={theme.spacing(2)} variant="subtitle1">
                Please review the correctness of the pool's parameters before
                creating it
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold' }}
                color="primary"
              >
                Event
              </Typography>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography fontSize={'0.85rem'} sx={{ ml: theme.spacing(2) }}>
                  Reference Asset
                </Typography>
                <Typography fontSize={'0.85rem'}>
                  {values.referenceAsset}
                </Typography>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography fontSize={'0.85rem'} sx={{ ml: theme.spacing(2) }}>
                  Expiry Time
                </Typography>
                <Typography fontSize={'0.85rem'}>
                  {values.expiryTime.toLocaleString().slice(0, 11) +
                    ' ' +
                    getDateTime(Number(values.expiryTime) / 1000).slice(
                      11,
                      19
                    ) +
                    ' ' +
                    userTimeZone()}
                </Typography>
              </Stack>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold' }}
                color="primary"
              >
                Payoff
              </Typography>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography fontSize={'0.85rem'} sx={{ ml: theme.spacing(2) }}>
                  Payoff Profile
                </Typography>
                <Typography fontSize={'0.85rem'}>
                  {values.payoutProfile}
                </Typography>
              </Stack>
              {!isNaN(values.floor) && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Floor
                  </Typography>
                  <Typography fontSize={'0.85rem'}>{values.floor}</Typography>
                </Stack>
              )}
              {!isNaN(values.cap) && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Cap
                  </Typography>
                  <Typography fontSize={'0.85rem'}>{values.cap}</Typography>
                </Stack>
              )}
              {!isNaN(values.inflection) && transaction === 'createpool' && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Inflection
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {values.inflection}
                  </Typography>
                </Stack>
              )}
              {!isNaN(values.gradient) && transaction === 'createpool' && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Gradient
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {Number(values.gradient).toFixed(2)}
                  </Typography>
                </Stack>
              )}
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold' }}
                color="primary"
              >
                {transaction === 'createoffer' ? 'Offer terms' : 'Collateral'}
              </Typography>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography fontSize={'0.85rem'} sx={{ ml: theme.spacing(2) }}>
                  Collateral Token
                </Typography>
                <Typography fontSize={'0.85rem'}>
                  {values.collateralToken.symbol}
                </Typography>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography fontSize={'0.85rem'} sx={{ ml: theme.spacing(2) }}>
                  Collateral Balance
                </Typography>
                <Typography fontSize={'0.85rem'}>
                  {values.collateralBalance}
                </Typography>
              </Stack>
              {transaction === 'createpool' && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    LONG / SHORT Token Supply
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {values.tokenSupply}
                  </Typography>
                </Stack>
              )}
              {(transaction === 'createoffer' ||
                transaction === 'filloffer') && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Your Contribution
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {values.offerDirection === 'Long'
                      ? values.collateralBalanceLong
                      : values.collateralBalanceShort}
                  </Typography>
                </Stack>
              )}
              {(transaction === 'createoffer' ||
                transaction === 'filloffer') && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Taker Contribution
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {values.offerDirection === 'Long'
                      ? values.collateralBalanceShort
                      : values.collateralBalanceLong}
                  </Typography>
                </Stack>
              )}
              {(transaction === 'createoffer' ||
                transaction === 'filloffer') && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Your Direction
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {values.offerDirection}
                  </Typography>
                </Stack>
              )}
              {(transaction === 'createoffer' ||
                transaction === 'filloffer') && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Offer Expiry
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {/*{values.expiryTime.toLocaleString().slice(0, 11) +
                    ' ' +
                    getDateTime(Number(values.expiryTime) / 1000).slice(
                      11,
                      19
                    ) +
                    ' ' +
                    userTimeZone()}*/}
                    {new Date(parseFloat(values.offerDuration) * 1000)
                      .toLocaleString()
                      .slice(0, 11) +
                      ' ' +
                      getDateTime(
                        Number(
                          new Date(parseFloat(values.offerDuration) * 1000)
                        ) / 1000
                      ).slice(11, 19) +
                      ' ' +
                      userTimeZone()}
                    {/*{values.offerDuration ===*/}
                    {/*  Math.floor(24 * 60 * 60 + Date.now() / 1000).toString() &&*/}
                    {/*  '1 Day'}*/}
                  </Typography>
                </Stack>
              )}
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold' }}
                color="primary"
              >
                Advanced
              </Typography>
              {transaction === 'createpool' && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Max Pool Capacity
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {values.capacity}
                  </Typography>
                </Stack>
              )}
              {(transaction === 'createoffer' ||
                transaction === 'filloffer') && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Taker Address
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {values.takerAddress}
                  </Typography>
                </Stack>
              )}
              {(transaction === 'createoffer' ||
                transaction === 'filloffer') && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Min Taker Contribution
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {values.minTakerContribution}
                  </Typography>
                </Stack>
              )}
              {/*<Stack direction="row" sx={{ justifyContent: 'space-between' }}>*/}
              {/*  <Typography fontSize={'0.85rem'} sx={{ ml: theme.spacing(2) }}>*/}
              {/*    Pool Description*/}
              {/*  </Typography>*/}
              {/*  <Typography fontSize={'0.85rem'}>TBD</Typography>*/}
              {/*</Stack>*/}
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold' }}
                color="primary"
              >
                Oracle
              </Typography>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography fontSize={'0.85rem'} sx={{ ml: theme.spacing(2) }}>
                  Data Provider
                </Typography>
                <Typography fontSize={'0.85rem'}>{dataSourceName}</Typography>
              </Stack>
            </Stack>
          </Container>
        </Box>
      </Container>
      <Container>
        <Stack>
          {transaction === 'filloffer' && (
            <Card
              style={{
                border: '1px solid #1B3448',
                background:
                  'linear-gradient(180deg, #051827 0%, rgba(5, 24, 39, 0) 100%)',
              }}
            >
              <Container sx={{ pt: theme.spacing(2) }}>
                <FormControl
                  fullWidth
                  error={
                    formik.values.offerDirection === 'Long'
                      ? formik.errors.collateralBalanceShort != null
                      : formik.errors.collateralBalanceLong != null
                  }
                >
                  <TextField
                    id="takerShare"
                    name="takerShare"
                    label="Your Contribution"
                    onBlur={formik.handleBlur}
                    error={formik.errors.takerShare != null}
                    value={parseFloat(formik.values.collateralBalance)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {tokenSymbol}
                        </InputAdornment>
                      ),
                    }}
                    type="number"
                    onChange={(event) => {
                      const collateralBalance = event.target.value
                      formik.setValues((values) => ({
                        ...values,
                        takerShare: parseFloat(collateralBalance),
                      }))
                    }}
                  />
                  {!isNaN(
                    formik.values.offerDirection === 'Long'
                      ? formik.values.collateralBalanceShort
                      : formik.values.collateralBalanceLong
                  ) && (
                    <FormHelperText>
                      You receive{' '}
                      {formik.values.offerDirection === 'Long' ? (
                        <strong>{formik.values.takerShare} SHORT Tokens</strong>
                      ) : (
                        <strong>{formik.values.takerShare} LONG Tokens</strong>
                      )}
                    </FormHelperText>
                  )}
                </FormControl>
                <Container sx={{ ml: theme.spacing(40) }}>
                  <FormHelperText>
                    Expires in:{' '}
                    {Math.floor(
                      getExpiryMinutesFromNow(formik.values.offerDuration) / 60
                    )}
                    h{' '}
                    {getExpiryMinutesFromNow(formik.values.offerDuration) % 60}m
                  </FormHelperText>
                </Container>

                <LinearProgress
                  variant="determinate"
                  sx={{ height: '15px', borderRadius: 1 }}
                  value={
                    ((formik.values.takerShare -
                      Number(formik.values.minTakerContribution)) /
                      (Number(formik.values.collateralBalance) -
                        Number(formik.values.minTakerContribution))) *
                    100
                  }
                />
                <Stack
                  height="100%"
                  direction="row"
                  justifyContent="space-between"
                >
                  <Typography fontSize={'0.85rem'}>
                    {formik.values.minTakerContribution + ' ' + tokenSymbol}
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {formik.values.collateralBalance + ' ' + tokenSymbol}
                  </Typography>
                </Stack>
                <FormHelperText>
                  Remaining fill amount{' '}
                  {Number(formik.values.collateralBalance) -
                    formik.values.takerShare}{' '}
                  {tokenSymbol}
                </FormHelperText>
              </Container>
            </Card>
          )}
          <Typography color="white" pb={theme.spacing(2)} variant="subtitle1">
            Payoff Profile
          </Typography>
          {values.floor != null &&
            values.cap != null &&
            values.inflection != null &&
            values.tokenSupply != null &&
            values.tokenSupply > 0 && (
              <Box sx={{ maxWidth: '85%' }}>
                <PayoffProfile
                  floor={values.floor}
                  cap={values.cap}
                  inflection={values.inflection}
                  hasError={false}
                  collateralBalanceLong={values.collateralBalanceLong}
                  collateralBalanceShort={values.collateralBalanceShort}
                  tokenSupply={values.tokenSupply}
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
                {values.referenceAsset} is{' '}
                <strong>
                  {values.floor < values.inflection &&
                  values.inflection < values.cap
                    ? 'at or '
                    : ''}{' '}
                  below {values.floor}
                </strong>{' '}
                on{' '}
                {values.expiryTime.toLocaleString().slice(0, 11) +
                  ' ' +
                  getDateTime(Number(values.expiryTime) / 1000).slice(11, 19) +
                  ' ' +
                  userTimeZone()}
                , the payout will be{' '}
                <strong>0.00 {values.collateralToken.symbol} per LONG</strong>{' '}
                and{' '}
                <strong> 1.00 {values.collateralToken.symbol} per SHORT</strong>{' '}
                token
              </Typography>
              <Typography
                fontSize={'0.85rem'}
                sx={{ mt: theme.spacing(2) }}
                style={{ color: 'white' }}
              >
                <Circle sx={{ height: 0.02, maxWidth: 0.02 }} /> If{' '}
                {values.referenceAsset} is{' '}
                <strong>
                  {values.floor < values.inflection &&
                  values.inflection < values.cap
                    ? 'at or '
                    : ''}{' '}
                  above {values.cap}{' '}
                </strong>{' '}
                on{' '}
                {values.expiryTime.toLocaleString().slice(0, 11) +
                  ' ' +
                  getDateTime(Number(values.expiryTime) / 1000).slice(11, 19) +
                  ' ' +
                  userTimeZone()}
                , the payout will be{' '}
                <strong>1.00 {values.collateralToken.symbol} per LONG</strong>{' '}
                and{' '}
                <strong> 0.00 {values.collateralToken.symbol} per SHORT</strong>{' '}
                token
              </Typography>
              <Typography
                fontSize={'0.85rem'}
                sx={{ pb: theme.spacing(2), mt: theme.spacing(2) }}
                style={{ color: 'white' }}
              >
                <Circle sx={{ height: 0.02, maxWidth: 0.02 }} /> If{' '}
                {values.referenceAsset} is{' '}
                <strong>
                  {' '}
                  at
                  {' ' + values.inflection}{' '}
                </strong>{' '}
                on{' '}
                {values.expiryTime.toLocaleString().slice(0, 11) +
                  ' ' +
                  getDateTime(Number(values.expiryTime) / 1000).slice(11, 19) +
                  ' ' +
                  userTimeZone()}
                , the payout will be{' '}
                <strong>
                  {values.gradient.toFixed(2)} {values.collateralToken.symbol}{' '}
                  per LONG
                </strong>{' '}
                and{' '}
                <strong>
                  {(1 - values.gradient).toFixed(2)}{' '}
                  {values.collateralToken.symbol} per SHORT
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
