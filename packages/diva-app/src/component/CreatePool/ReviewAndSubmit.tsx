import {
  Card,
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
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

const stringifyValue = (val: any) => {
  if (val?.symbol) return val.symbol
  if (val instanceof Date) {
    return val.toDateString()
  } else if (typeof val === 'string') {
    return val
  } else if (typeof val === 'number') {
    return `${val}`
  }
  return ''
}

const dict: {
  [key: string]: any
} = {
  referenceAsset: 'Reference Asset',
  expiryTime: 'Expiry Time',
  floor: 'Floor',
  cap: 'Cap',
  inflection: 'Inflection',
  gradient: 'Gradient',
  collateralBalance: 'Collateral Balance ',
  collateralBalanceLong: 'Collateral Balance (Long)',
  shortTokenSupply: 'Token Supply (Short)',
  longTokenSupply: 'Token Supply (Long)',
  dataProvider: 'Data Provider',
  collateralToken: 'Collateral Token',
  tokenSupply: 'Position Token Supply',
  capacity: 'Maximum Pool Capacity',
}

export function ReviewAndSubmit({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const { values } = formik
  const theme = useTheme()
  const { provider } = useConnectionContext()
  const chainId = provider?.network?.chainId

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
                  {values.expiryTime.toString()}
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
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography fontSize={'0.85rem'} sx={{ ml: theme.spacing(2) }}>
                  Floor
                </Typography>
                <Typography fontSize={'0.85rem'}>{values.floor}</Typography>
              </Stack>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography fontSize={'0.85rem'} sx={{ ml: theme.spacing(2) }}>
                  Cap
                </Typography>
                <Typography fontSize={'0.85rem'}>{values.cap}</Typography>
              </Stack>
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
                  {values.collateralToken.name}
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
                  Position Token Supply
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
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography fontSize={'0.85rem'} sx={{ ml: theme.spacing(2) }}>
                  Pool Description
                </Typography>
                <Typography fontSize={'0.85rem'}>TBD</Typography>
              </Stack>
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
                <Typography fontSize={'0.85rem'}>
                  {values.dataProvider}
                </Typography>
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
              <Box width="50%">
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
              // border-radius: '5px',
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
                style={{ color: 'gray' }}
              >
                <Circle sx={{ height: 0.02, maxWidth: 0.01 }} /> If ETH/USD is
                at or below {values.floor} on 31/12/2022 (08:12am CET), the
                payout will be 0.0 WAGM18 per long and 1.0 WAGMI18 per short
                position token
              </Typography>
              <Typography
                fontSize={'0.85rem'}
                sx={{ mt: theme.spacing(2) }}
                style={{ color: 'gray' }}
              >
                <Circle sx={{ height: 0.02, maxWidth: 0.01 }} /> If ETH/USD is
                at or above {values.cap} on 31/12/2022 (08:12am CET), the payout
                will be 1.0 WAGM18 per long and 0.0 WAGMI18 per short position
                token
              </Typography>
              <Typography
                fontSize={'0.85rem'}
                sx={{ pb: theme.spacing(2), mt: theme.spacing(2) }}
                style={{ color: 'gray' }}
              >
                <Circle sx={{ height: 0.02, maxWidth: 0.01 }} /> If ETH/USD is
                at
                {' ' + values.inflection} on 31/12/2022 (08:12am CET), the
                payout will be 0.5 WAGM18 per long and 0.5 WAGMI18 per short
                position token
              </Typography>
            </Container>
          </Card>
        </Stack>
      </Container>
    </Stack>
  )
}
