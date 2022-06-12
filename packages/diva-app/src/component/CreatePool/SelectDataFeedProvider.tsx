import { CheckCircle, Report } from '@mui/icons-material'
import {
  Autocomplete,
  FormControl,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { config } from '../../constants'
import { useWhitelist } from '../../hooks/useWhitelist'
import { WhitelistQueryResponse, queryWhitelist } from '../../lib/queries'
import { useCreatePoolFormik } from './formik'

export function SelectDataFeedProvider({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const { referenceAsset } = formik.values
  const whitelist = useWhitelist()

  const matchingDataFeedProviders = whitelist.dataProviders.filter((p) =>
    p.dataFeeds.some((f) => f.referenceAssetUnified === referenceAsset)
  )

  const isWhitelistedDataFeed =
    matchingDataFeedProviders.length > 0 &&
    matchingDataFeedProviders.some((v) => formik.values.dataProvider === v.id)

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
    formik.touched.dataProvider != null &&
    formik.errors.dataProvider == null &&
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
        Select a <strong>trusted</strong> data provider for this pool.
      </Typography>
      <FormControl
        fullWidth
        error={formik.errors.dataProvider != null}
        sx={{
          paddingTop: theme.spacing(5),
          paddingBottom: theme.spacing(5),
        }}
      >
        <Autocomplete
          id="dataProvider"
          renderInput={(params) => (
            <TextField
              {...params}
              label="Data Provider"
              name="dataProvider"
              id="dataProvider"
              error={formik.errors.dataProvider != null}
              onBlur={formik.handleBlur}
              helperText={helperText}
            />
          )}
          onInputChange={(event) => {
            if (event != null && event.target != null) {
              formik.setFieldValue(
                'dataProvider',
                (event.target as any).value || '',
                false
              )
            }
          }}
          onChange={(event, option) => {
            formik.setFieldValue('dataProvider', option || '')
          }}
          getOptionLabel={(option) =>
            matchingDataFeedProviders.find((v) => v.id === option)?.name ||
            option
          }
          value={formik.values.dataProvider}
          options={matchingDataFeedProviders.map((v) => v.id || '')}
        />
      </FormControl>
    </>
  )
}
