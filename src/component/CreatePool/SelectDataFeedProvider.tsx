import { CheckCircle, Report } from '@mui/icons-material'
import {
  Autocomplete,
  FormControl,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import request from 'graphql-request'
import { useQuery } from 'react-query'
import { whiteListEndpoint } from '../../constants'
import { WhitelistQueryResponse, queryWhitelist } from '../../lib/queries'
import { useCreatePoolFormik } from './formik'

export function SelectDataFeedProvider({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const whitelistQuery = useQuery<WhitelistQueryResponse>('whitelist', () =>
    request(whiteListEndpoint, queryWhitelist)
  )

  const matchingDataFeedProviders =
    whitelistQuery.data?.dataProviders.filter((v) =>
      v.dataFeeds.some(
        (f) => f.referenceAssetUnified === formik.values.referenceAsset
      )
    ) || []

  const isWhitelistedDataFeed =
    matchingDataFeedProviders.length > 0 &&
    matchingDataFeedProviders.some(
      (v) => formik.values.dataFeedProvider === v.id
    )

  const theme = useTheme()

  let helperText: JSX.Element

  if (isWhitelistedDataFeed) {
    helperText = (
      <Stack direction="row" alignContent="center">
        <CheckCircle
          fontSize="small"
          color="success"
          sx={{ marginRight: theme.spacing(0.5) }}
        />
        <span>This data feed is whitelisted</span>
      </Stack>
    )
  } else if (
    formik.touched.dataFeedProvider != null &&
    formik.errors.dataFeedProvider == null &&
    !isWhitelistedDataFeed
  ) {
    helperText = (
      <Stack direction="row" alignItems="center">
        <Report
          color="warning"
          fontSize="small"
          sx={{ marginRight: theme.spacing(0.5) }}
        />
        <span>
          The address provided is not a whitelisted datafeed, please make sure
          you trust the owner of this address
        </span>
      </Stack>
    )
  }

  return (
    <>
      <Typography pb={1} variant="subtitle1">
        Select a <strong>trusted</strong> Data Feed Provider for this pool.
      </Typography>
      <FormControl
        fullWidth
        error={formik.errors.dataFeedProvider != null}
        sx={{
          paddingTop: theme.spacing(5),
          paddingBottom: theme.spacing(5),
        }}
      >
        <Autocomplete
          id="dataFeedProvider"
          renderInput={(params) => (
            <TextField
              {...params}
              label="Data Feed Provider"
              name="dataFeedProvider"
              id="dataFeedProvider"
              error={formik.errors.dataFeedProvider != null}
              onBlur={formik.handleBlur}
              helperText={helperText}
            />
          )}
          onInputChange={(event) => {
            if (event != null && event.target != null) {
              console.log('on input change', (event.target as any).value || '')
              formik.setFieldValue(
                'dataFeedProvider',
                (event.target as any).value || '',
                false
              )
            }
          }}
          onChange={(event, option) => {
            console.log(option)
            formik.setFieldValue('dataFeedProvider', option || '')
          }}
          getOptionLabel={(option) =>
            matchingDataFeedProviders.find((v) => v.id === option)?.name ||
            option
          }
          value={formik.values.dataFeedProvider}
          options={matchingDataFeedProviders.map((v) => v.id || '')}
        />
      </FormControl>
    </>
  )
}
