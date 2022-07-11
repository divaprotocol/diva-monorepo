import { Card, Container, Stack, Typography, useTheme } from '@mui/material'
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
import { getDateTime, userTimeZone } from '../../Util/Dates'

export function ReviewAndSubmit({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const { values } = formik
  const theme = useTheme()
  const { provider } = useConnectionContext()
  const chainId = provider?.network?.chainId
  const dataSource = useWhitelist()
  const [dataSourceName, setDataSourceName] = useState('')
  useEffect(() => {
    const dataName = dataSource?.dataProviders?.find(
      (dataName: { id: string }) => dataName?.id == values.dataProvider
    )
    if (dataName?.name != null) {
      setDataSourceName(dataName?.name)
    } else {
      setDataSourceName('Unknown')
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
    <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
      <Stack>
        <Typography
          pb={theme.spacing(1)}
          pt={theme.spacing(1)}
          variant="subtitle1"
        >
          Review
        </Typography>
        <Box
          border={1}
          borderColor="secondary.dark"
          minWidth={theme.spacing(120)}
        >
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
                  {values.expiryTime.toLocaleString()}
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
                <Typography fontSize={'0.85rem'}>placeholder</Typography>
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
              {!isNaN(values.inflection) && (
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
              {!isNaN(values.gradient) && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Gradient
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {values.gradient}
                  </Typography>
                </Stack>
              )}
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold' }}
                color="primary"
              >
                Collateral
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
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography fontSize={'0.85rem'} sx={{ ml: theme.spacing(2) }}>
                  Long / Short Token Supply
                </Typography>
                <Typography fontSize={'0.85rem'}>
                  {values.tokenSupply}
                </Typography>
              </Stack>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 'bold' }}
                color="primary"
              >
                Advanced
              </Typography>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography fontSize={'0.85rem'} sx={{ ml: theme.spacing(2) }}>
                  Max Pool Capacity
                </Typography>
                <Typography fontSize={'0.85rem'}>{values.capacity}</Typography>
              </Stack>
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
      </Stack>
      <Container>
        <Stack>
          <Typography pb={theme.spacing(2)} variant="subtitle1">
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
                <Circle sx={{ height: 0.02, maxWidth: 0.01 }} /> If ETH/USD is
                at or below {values.floor} on{' '}
                {getDateTime(values.expiryTime).slice(11, 19) +
                  ' ' +
                  userTimeZone()}
                , the payout will be 0.0 {values.collateralToken.symbol} per
                long and 1.0 {values.collateralToken.symbol} per short position
                token
              </Typography>
              <Typography
                fontSize={'0.85rem'}
                sx={{ mt: theme.spacing(2) }}
                style={{ color: 'white' }}
              >
                <Circle sx={{ height: 0.02, maxWidth: 0.01 }} /> If ETH/USD is
                at or above {values.cap} on{' '}
                {getDateTime(values.expiryTime).slice(11, 19) +
                  ' ' +
                  userTimeZone()}
                , the payout will be 1.0 {values.collateralToken.symbol} per
                long and 0.0 {values.collateralToken.symbol} per short position
                token
              </Typography>
              <Typography
                fontSize={'0.85rem'}
                sx={{ pb: theme.spacing(2), mt: theme.spacing(2) }}
                style={{ color: 'white' }}
              >
                <Circle sx={{ height: 0.02, maxWidth: 0.01 }} /> If ETH/USD is
                at
                {' ' + values.inflection} on{' '}
                {getDateTime(values.expiryTime).slice(11, 19) +
                  ' ' +
                  userTimeZone()}
                , the payout will be {values.gradient}{' '}
                {values.collateralToken.symbol} per long and{' '}
                {1 - values.gradient} {values.collateralToken.symbol} per short
                position token
              </Typography>
            </Container>
          </Card>
        </Stack>
      </Container>
    </Stack>
  )
}
