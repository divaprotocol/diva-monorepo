import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material'
import { Box } from '@mui/material'
import { useWallet } from '@web3-ui/hooks'
import request from 'graphql-request'
import { useQuery } from 'react-query'
import { config } from '../../constants'
import { WhitelistQueryResponse, queryWhitelist } from '../../lib/queries'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import { useCreatePoolFormik } from './formik'

const stringifyValue = (val: any) => {
  if (val?.name) return val.name
  if (val instanceof Date) {
    return val.toDateString()
  } else if (typeof val === 'string') {
    if (val.length > 10) {
      return getShortenedAddress(val)
    }
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
  collateralBalanceShort: 'Collateral Balance (Short)',
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
  const { provider } = useWallet()
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
    <Box pt={5}>
      <Typography pb={3} variant="subtitle1">
        Please review the correctness of the pool's parameters before creating
        it
      </Typography>

      <TableContainer
        sx={{
          padding: 0,
          margin: 0,
          marginBottom: theme.spacing(3),
        }}
      >
        <Table>
          <TableBody>
            {Object.keys(values)
              .filter(
                (v) =>
                  ![
                    'collateralBalance',
                    'collateralWalletBalance',
                    'step',
                  ].includes(v)
              )
              .map((key: any) => (
                <TableRow key={key}>
                  <TableCell>
                    <strong>{dict[key] || key}</strong>
                  </TableCell>
                  <TableCell align="right">
                    {stringifyValue((values as any)[key])}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
