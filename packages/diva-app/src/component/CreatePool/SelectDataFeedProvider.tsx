import { CheckCircle, Report } from '@mui/icons-material'
import {
  Autocomplete,
  Box,
  Card,
  Container,
  FormControl,
  Link,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import { config } from '../../constants'
import { useWhitelist } from '../../hooks/useWhitelist'
import { WhitelistQueryResponse, queryWhitelist } from '../../lib/queries'
import { useCreatePoolFormik } from './formik'
import {
  EtherscanLinkType,
  getEtherscanLink,
} from '../../Util/getEtherscanLink'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import React, { useEffect, useState } from 'react'
import { useAppSelector } from '../../Redux/hooks'
import { selectChainId } from '../../Redux/appSlice'
const linkSVG = (
  <svg
    width="16"
    height="16"
    viewBox="0 -2 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M3.33333 3.33333V12.6667H12.6667V8H14V12.6667C14 13.4 13.4 14 12.6667 14H3.33333C2.59333 14 2 13.4 2 12.6667V3.33333C2 2.6 2.59333 2 3.33333 2H8V3.33333H3.33333ZM9.33333 3.33333V2H14V6.66667H12.6667V4.27333L6.11333 10.8267L5.17333 9.88667L11.7267 3.33333H9.33333Z"
      fill="#3393E0"
    />
  </svg>
)

export function SelectDataFeedProvider({
  formik,
}: {
  formik: ReturnType<typeof useCreatePoolFormik>
}) {
  const { referenceAsset } = formik.values
  const whitelist = useWhitelist()
  const chainId = useAppSelector(selectChainId)
  const matchingDataFeedProviders = whitelist.dataProviders.filter((p) =>
    p.dataFeeds.some((f) => f.referenceAssetUnified === referenceAsset)
  )

  const isWhitelistedDataFeed =
    matchingDataFeedProviders.length > 0 &&
    matchingDataFeedProviders.some((v) => formik.values.dataProvider === v.id)

  const theme = useTheme()
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    if (window.innerWidth < 768) {
      setMobile(true)
    } else {
      setMobile(false)
    }
  }, [])
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
      <Stack direction={'row'} alignItems="center">
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
    <Stack direction={mobile ? 'column' : 'row'} spacing={theme.spacing(2)}>
      <Container>
        <Typography variant="subtitle1">Data Provider</Typography>
        <Box
          style={{
            border: '1px solid #383838',
            minWidth: theme.spacing(60),
          }}
        >
          <Container>
            <Typography variant="subtitle1">
              Select a <strong>trusted</strong> data provider for this pool.
            </Typography>
            <FormControl
              error={formik.errors.dataProvider != null}
              sx={{
                paddingTop: theme.spacing(1),
                paddingBottom: theme.spacing(5),
                width: '100%',
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
                  matchingDataFeedProviders.find((v) => v.id === option)
                    ?.name || option
                }
                value={formik.values.dataProvider}
                options={matchingDataFeedProviders.map((v) => v.id || '')}
              />
            </FormControl>
          </Container>
        </Box>
      </Container>
      <Stack
        pr={mobile ? theme.spacing(3) : theme.spacing(12)}
        pl={mobile ? theme.spacing(3) : theme.spacing(0)}
      >
        <Typography pb={1} variant="subtitle1">
          Info
        </Typography>
        <Card
          style={{
            minWidth: theme.spacing(mobile ? 60 : 0),
            border: '1px solid #1B3448',
            // border-radius: '5px',
            background:
              'linear-gradient(180deg, #051827 0%, rgba(5, 24, 39, 0) 100%)',
          }}
        >
          <Container maxWidth="sm">
            <Typography pt={theme.spacing(1)} variant="subtitle1">
              Oracle Address
            </Typography>
            <Typography
              fontSize={'0.85rem'}
              sx={{ mt: theme.spacing(2) }}
              style={{ color: 'gray' }}
            >
              <Link
                style={{ color: 'gray' }}
                underline={'none'}
                rel="noopener noreferrer"
                target="_blank"
                href={getEtherscanLink(
                  chainId,
                  formik.values.dataProvider,
                  EtherscanLinkType.ADDRESS
                )}
              >
                {formik.values.dataProvider}
              </Link>
            </Typography>
            <Typography pt={theme.spacing(2)} variant="subtitle1">
              Data Fact Sheet
            </Typography>
            <Typography
              fontSize={'0.85rem'}
              sx={{ mt: theme.spacing(2), pb: theme.spacing(2) }}
              style={{ color: 'gray' }}
            >
              n/a {linkSVG}
            </Typography>
          </Container>
        </Card>
      </Stack>
    </Stack>
  )
}
