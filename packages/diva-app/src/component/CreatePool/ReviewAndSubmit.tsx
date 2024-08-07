import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Card,
  Container,
  FormControl,
  FormHelperText,
  InputAdornment,
  LinearProgress,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import { Box } from '@mui/material'
import request from 'graphql-request'
import { useQuery } from 'react-query'
import { config, CREATE_POOL_TYPE } from '../../constants'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { WhitelistQueryResponse, queryWhitelist } from '../../lib/queries'
import { Circle } from '@mui/icons-material'
import { useWhitelist } from '../../hooks/useWhitelist'
import React, { useEffect, useState } from 'react'
import {
  getDateTime,
  getExpiryMinutesFromNow,
  userTimeZone,
} from '../../Util/Dates'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import { ethers } from 'ethers'
import ERC20 from '../../abi/ERC20ABI.json'
import DIVA_ABI from '../../abi/DIVAABI.json'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { PayoffProfile } from '../Graphs/payOffProfile'
import { useAppSelector } from '../../Redux/hooks'
import { toExponentialOrNumber } from '../../Util/utils'
import styled from '@emotion/styled'
import { useErcBalance } from '../../hooks/useErcBalance'
import { setMaxPayout } from '../../Redux/Stats'
import { ExpandMoreOutlined } from '@mui/icons-material'
import { _checkConditions } from '../ApproveActionButtons'
import KeyboardDoubleArrowUpOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowUpOutlined'
import KeyboardDoubleArrowDownOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowDownOutlined'
import KeyboardDoubleArrowRightOutlinedIcon from '@mui/icons-material/KeyboardDoubleArrowRightOutlined'

const MaxCollateral = styled.u`
  cursor: pointer;
  &:hover {
    color: ${(props) => (props.theme as any).palette.primary.main};
  }
`

export function ReviewAndSubmit({
  formik,
  transaction,
}: {
  formik: any
  transaction?: string
}) {
  const { values } = formik
  const theme = useTheme()
  const [errorMessage, setErrorMessage] = useState<string>('')
  const { provider, address } = useConnectionContext()
  const chainId = useAppSelector((state) => state.appSlice.chainId)
  const dataSource = useWhitelist()
  const [dataSourceName, setDataSourceName] = useState('')
  const [mobile, setMobile] = useState(false)
  const [maxYieldTaker, setMaxYieldTaker] = useState(0)
  const [maxYieldMaker, setMaxYieldMaker] = useState(0)
  const [maxPayout, setMaxPayout] = useState(0)
  const [tokenSymbol, setTokenSymbol] = useState('')
  const [actualFillableAmount, setActualFillableAmount] = useState(
    formik.values.takerShare
  )
  const [takerFilledAmount, setTakerFilledAmount] = useState(0)
  const [decimal, setDecimal] = useState(18)
  const [dataProvider, setDataProvider] = useState('')
  const { balance: collateralWalletBalance } = useErcBalance(
    formik.values.collateralToken.id
  )
  // QUESTION Why not use hook that will also handle null values?
  const diva = new ethers.Contract(
    config[chainId!].divaAddress,
    DIVA_ABI,
    provider.getSigner()
  )

  const divaDomain =
    chainId != null
      ? {
          name: 'DIVA Protocol',
          version: '1',
          chainId,
          verifyingContract: config[chainId!].divaAddress,
        }
      : null

  const token = new ethers.Contract(
    formik.values.collateralToken.id,
    ERC20,
    provider.getSigner()
  )

  // @todo Commented out this useEffect because it was causing problems in Create step 3 for some reason.
  // It looked like this function was running although we didn't create an offer and hence formik.values.jsonToExport was undefined
  // useEffect(() => {
  //   console.log('formik.values', formik.values)
  //   if (
  //     diva != undefined &&
  //     divaDomain != undefined &&
  //     formik.values != undefined &&
  //     address != null
  //   ) {
  //     _checkConditions(
  //       diva,
  //       divaDomain,
  //       formik.values.jsonToExport, // offerCreationStats,
  //       CREATE_POOL_TYPE,
  //       formik.values.signature,
  //       address,
  //       parseUnits(formik.values.yourShare.toString(), decimal)
  //     ).then((res) => {
  //       if (!res.success) {
  //         setErrorMessage(res.message)
  //       } else {
  //         setErrorMessage('')
  //       }
  //     })
  //   }
  // }, [formik.values, address, diva, divaDomain])

  useEffect(() => {
    token.decimals().then((decimals: number) => {
      setDecimal(decimals)
    })
  }, [token])

  useEffect(() => {
    if (
      transaction === 'filloffer' &&
      diva !== undefined &&
      formik.values.jsonToExport != '{}'
    ) {
      diva
        .getOfferRelevantStateCreateContingentPool(
          formik.values.jsonToExport,
          formik.values.signature
        )
        .then((params: any) => {
          setActualFillableAmount(
            formatUnits(params.actualTakerFillableAmount, decimal)
          )
          setTakerFilledAmount(
            Number(formatUnits(params.offerInfo.takerFilledAmount, decimal))
          )
        })

      setMaxYieldTaker(
        (Number(
          formatUnits(formik.values.jsonToExport.takerCollateralAmount, decimal)
        ) +
          Number(
            formatUnits(
              formik.values.jsonToExport.makerCollateralAmount,
              decimal
            )
          )) /
          Number(
            formatUnits(
              formik.values.jsonToExport.takerCollateralAmount,
              decimal
            )
          )
      )
    }

    if (transaction === 'createoffer' && diva !== undefined) {
      setMaxYieldMaker(
        (formik.values.takerShare + formik.values.yourShare) /
          formik.values.yourShare
      )
    }
  }, [decimal, diva, formik.values.jsonToExport])
  useEffect(() => {
    if (transaction === 'filloffer' && diva !== undefined) {
      formik.setFieldValue('yourShare', actualFillableAmount)
      setMaxPayout(parseFloat(actualFillableAmount) * maxYieldTaker)
    }
  }, [actualFillableAmount, decimal])
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
      (dataName: { id: string }) =>
        dataName?.id.toLowerCase() == values.dataProvider.toLowerCase()
    )
    if (dataName?.name != null) {
      setDataProvider(values.dataProvider)
      setDataSourceName(
        dataName.name + ' (' + getShortenedAddress(values.dataProvider) + ')'
      )
    } else {
      setDataProvider(values.dataProvider)
      setDataSourceName(getShortenedAddress(values.dataProvider))
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
          <Container sx={{ pb: theme.spacing(4), pt: theme.spacing(3) }}>
            <Stack spacing={theme.spacing(2)}>
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
                  Observation Time
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
                {transaction !== 'createpool' ? 'Offer terms' : 'Collateral'}
              </Typography>
              {transaction === 'filloffer' && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Max yield
                  </Typography>
                  <Typography fontSize={'1rem'} color={'#3393E0'}>
                    {maxYieldTaker.toFixed(2) + 'x'}
                  </Typography>
                </Stack>
              )}
              {transaction === 'createpool' && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Collateral Amount
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {Number(values.collateralBalance).toFixed(2) +
                      ' ' +
                      values.collateralToken.symbol}
                  </Typography>
                </Stack>
              )}
              {transaction === 'createoffer' && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Collateral Amount
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {Number(formik.values.collateralBalance).toFixed(2) +
                      ' ' +
                      tokenSymbol}
                  </Typography>
                </Stack>
              )}
              {transaction === 'filloffer' &&
                formik.values.jsonToExport != '{}' && (
                  <Stack
                    direction="row"
                    sx={{ justifyContent: 'space-between' }}
                  >
                    <Typography
                      fontSize={'0.85rem'}
                      sx={{ ml: theme.spacing(2) }}
                    >
                      Offer Size
                    </Typography>
                    <Typography fontSize={'0.85rem'}>
                      {toExponentialOrNumber(
                        Number(
                          formatUnits(
                            formik.values.jsonToExport.takerCollateralAmount,
                            decimal
                          )
                        ),
                        2,
                        2
                      ) +
                        ' ' +
                        tokenSymbol}
                    </Typography>
                  </Stack>
                )}
              {transaction === 'createoffer' && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Your Contribution
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {values.yourShare.toFixed(2) + ' ' + tokenSymbol}
                  </Typography>
                </Stack>
              )}
              {transaction === 'createoffer' && (
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography
                    fontSize={'0.85rem'}
                    sx={{ ml: theme.spacing(2) }}
                  >
                    Taker Contribution
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {values.takerShare.toFixed(2) + ' ' + tokenSymbol}
                  </Typography>
                </Stack>
              )}
              {transaction === 'createoffer' && (
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
                    Offer Expires in
                  </Typography>
                  <Typography fontSize={'0.85rem'}>
                    {Math.floor(
                      getExpiryMinutesFromNow(formik.values.offerExpiry) / 60
                    )}
                    h {getExpiryMinutesFromNow(formik.values.offerExpiry) % 60}m
                  </Typography>
                </Stack>
              )}
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
                <Tooltip placement="top-end" title={dataProvider}>
                  <Typography fontSize={'0.85rem'}>{dataSourceName}</Typography>
                </Tooltip>
              </Stack>
              <Accordion
                sx={{
                  backgroundColor: '#121212',
                  '&:before': {
                    display: 'none',
                  },
                  marginTop: theme.spacing(3.5),
                  marginBottom: theme.spacing(1),
                  boxShadow: 'none',
                }}
                elevation={0}
                defaultExpanded={transaction === 'filloffer' ? false : true}
              >
                <AccordionSummary
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                  sx={{
                    padding: '0px',
                    backgroundColor: '#121212',
                    boxShadow: 'none',
                  }}
                  expandIcon={<ExpandMoreOutlined />}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 'bold' }}
                    color="primary"
                  >
                    Advanced
                  </Typography>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    backgroundColor: '#121212',
                    padding: 0,
                    boxShadow: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    rowGap: theme.spacing(2),
                    opacity: 0.7,
                  }}
                >
                  {transaction === 'createpool' && (
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between' }}
                    >
                      <Typography
                        fontSize={'0.85rem'}
                        sx={{ ml: theme.spacing(2) }}
                      >
                        Max Pool Capacity
                      </Typography>
                      <Typography fontSize={'0.85rem'}>
                        {values.capacity !== 'Unlimited'
                          ? Number(values.capacity).toFixed(2) +
                            ' ' +
                            tokenSymbol
                          : 'Unlimited'}
                      </Typography>
                    </Stack>
                  )}
                  {transaction === 'createoffer' && (
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between' }}
                    >
                      <Typography
                        fontSize={'0.85rem'}
                        sx={{ ml: theme.spacing(2) }}
                      >
                        Max Pool Capacity
                      </Typography>
                      <Typography fontSize={'0.85rem'}>
                        {values.capacity !== 'Unlimited'
                          ? Number(values.capacity).toFixed(2)
                          : 'Unlimited'}
                      </Typography>
                    </Stack>
                  )}
                  {transaction === 'filloffer' && (
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between' }}
                    >
                      <Typography
                        fontSize={'0.85rem'}
                        sx={{ ml: theme.spacing(2) }}
                      >
                        Max Pool Capacity
                      </Typography>
                      <Typography fontSize={'0.85rem'}>
                        {values.capacity !== 'Unlimited'
                          ? formatUnits(values.capacity, decimal)
                          : 'Unlimited'}
                      </Typography>
                    </Stack>
                  )}
                  {(transaction === 'createoffer' ||
                    transaction === 'filloffer') && (
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between' }}
                    >
                      <Typography
                        fontSize={'0.85rem'}
                        sx={{ ml: theme.spacing(2) }}
                      >
                        Taker Address
                      </Typography>
                      <Tooltip
                        placement="top-end"
                        title={
                          values.takerAddress === ethers.constants.AddressZero
                            ? ''
                            : values.takerAddress
                        }
                      >
                        <Typography fontSize={'0.85rem'}>
                          {values.takerAddress === ethers.constants.AddressZero
                            ? 'Anyone'
                            : getShortenedAddress(values.takerAddress)}
                        </Typography>
                      </Tooltip>
                    </Stack>
                  )}
                  {(transaction === 'createoffer' ||
                    transaction === 'filloffer') && (
                    <Stack
                      direction="row"
                      sx={{ justifyContent: 'space-between' }}
                    >
                      <Typography
                        fontSize={'0.85rem'}
                        sx={{ ml: theme.spacing(2) }}
                      >
                        Min Fill Amount (applicable on 1st fill only)
                      </Typography>
                      <Typography fontSize={'0.85rem'}>
                        {toExponentialOrNumber(
                          Number(values.minTakerContribution),
                          2,
                          2
                        ) +
                          ' ' +
                          tokenSymbol}
                      </Typography>
                    </Stack>
                  )}
                </AccordionDetails>
              </Accordion>
            </Stack>
          </Container>
        </Box>
      </Container>
      <Container>
        <Stack>
          {transaction === 'filloffer' && (
            <>
              <Typography
                color="white"
                pb={theme.spacing(2)}
                variant="subtitle1"
              >
                Fill Offer
              </Typography>
              <Card
                style={{
                  maxWidth: theme.spacing(60),
                  border: '1px solid #1B3448',
                  background:
                    'linear-gradient(180deg, #051827 0%, rgba(5, 24, 39, 0) 100%)',
                  marginBottom: theme.spacing(2),
                }}
              >
                <Container sx={{ pt: theme.spacing(4) }}>
                  <FormControl
                    fullWidth
                    error={formik.errors.collateralBalance != null}
                  >
                    <TextField
                      id="takerShare"
                      name="takerShare"
                      label="Amount"
                      onBlur={formik.handleBlur}
                      error={formik.errors.takerShare != null}
                      value={
                        formik.values.yourShare === 0
                          ? ''
                          : formik.values.yourShare
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {tokenSymbol}
                          </InputAdornment>
                        ),
                      }}
                      type="number"
                      onChange={(event) => {
                        const value = event.target.value
                        const arr = value.split('.')
                        const collateralBalance = event.target.value
                        setMaxPayout(Number(value) * maxYieldTaker)
                        if (arr.length > 1) {
                          if (arr[1].length <= decimal) {
                            if (collateralBalance !== '') {
                              formik.setFieldValue(
                                'yourShare',
                                Number(collateralBalance)
                              )
                            } else {
                              formik.setFieldValue('yourShare', 0)
                            }
                          }
                        } else {
                          if (collateralBalance !== '') {
                            formik.setFieldValue(
                              'yourShare',
                              Number(collateralBalance)
                            )
                          } else {
                            formik.setFieldValue('yourShare', 0)
                          }
                        }
                      }}
                    />
                    {errorMessage !== '' && (
                      <Alert severity="error">{errorMessage}</Alert>
                    )}
                    {!isNaN(formik.values.collateralBalance) && (
                      <>
                        <Stack
                          height="100%"
                          direction="row"
                          justifyContent="space-between"
                          sx={{
                            mb: theme.spacing(1),
                          }}
                        >
                          <FormHelperText
                            sx={{
                              display: 'flex',
                              justifyContent: 'flex-end',
                              ml: theme.spacing(0),
                            }}
                          >
                            {`Max payout: ${toExponentialOrNumber(
                              maxPayout,
                              2,
                              2
                            )} ${'dUSD'}`}
                          </FormHelperText>
                          <FormHelperText
                            sx={{
                              mr: theme.spacing(-0.25),
                              display: 'flex',
                              justifyContent: 'flex-end',
                            }}
                          >
                            Balance:{' '}
                            {toExponentialOrNumber(
                              parseFloat(collateralWalletBalance)
                            )}
                            {' ('}
                            <MaxCollateral
                              role="button"
                              onClick={() => {
                                if (
                                  parseFloat(actualFillableAmount) >
                                  parseFloat(collateralWalletBalance)
                                ) {
                                  formik.setFieldValue(
                                    'yourShare',
                                    collateralWalletBalance
                                  )
                                  setMaxPayout(
                                    Number(collateralWalletBalance) *
                                      maxYieldTaker
                                  )
                                } else {
                                  formik.setFieldValue(
                                    'yourShare',
                                    actualFillableAmount
                                  )
                                  setMaxPayout(
                                    Number(actualFillableAmount) * maxYieldTaker
                                  )
                                }
                              }}
                            >
                              Max
                            </MaxCollateral>
                            {')'}
                          </FormHelperText>
                        </Stack>
                      </>
                    )}
                  </FormControl>
                  <LinearProgress
                    variant="determinate"
                    sx={{
                      mt: theme.spacing(1),
                      mb: theme.spacing(1),
                      height: '15px',
                      borderRadius: 1,
                    }}
                    value={
                      (takerFilledAmount /
                        (actualFillableAmount + takerFilledAmount)) *
                      100
                    }
                  />
                  <Stack
                    height="100%"
                    direction="row"
                    justifyContent="space-between"
                    sx={{
                      mb: theme.spacing(1),
                    }}
                  >
                    {/* <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        fontSize={'0.75rem'}
                        sx={{
                          opacity: 0.5,
                        }}
                      >
                        {'Filled:'}
                      </Typography>
                      <Typography fontSize={'0.85rem'}>
                        {takerFilledAmount + ' ' + tokenSymbol}
                      </Typography>
                    </Stack> */}
                    {/* <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        fontSize={'0.75rem'}
                        sx={{
                          opacity: 0.5,
                        }}
                      >
                        {'Offer size: '}
                      </Typography>
                      <Typography fontSize={'0.85rem'}>
                        {Number(actualFillableAmount + takerFilledAmount) +
                          ' ' +
                          tokenSymbol}
                      </Typography>
                    </Stack> */}
                  </Stack>
                  <FormHelperText
                    sx={{
                      mb: theme.spacing(1),
                    }}
                  >
                    Remaining:{' '}
                    {toExponentialOrNumber(
                      parseFloat(actualFillableAmount),
                      2,
                      2
                    )}{' '}
                    {tokenSymbol}
                  </FormHelperText>
                </Container>
              </Card>
            </>
          )}
          {transaction === 'filloffer' ? (
            <Typography color="white" pb={theme.spacing(2)} variant="subtitle1">
              Your Payoff Profile
            </Typography>
          ) : (
            <Typography color="white" pb={theme.spacing(2)} variant="subtitle1">
              Payoff Profiles
            </Typography>
          )}
          {values.floor != null &&
            values.cap != null &&
            values.inflection != null &&
            values.gradient != null && (
              <Box sx={{ maxWidth: '85%', marginLeft: 3, marginBottom: 2 }}>
                {transaction !== 'createpool' &&
                transaction !== 'createoffer' ? (
                  <PayoffProfile
                    floor={values.floor}
                    cap={values.cap}
                    inflection={values.inflection}
                    gradient={values.gradient}
                    hasError={false}
                    referenceAsset={values.referenceAsset}
                    offerDirection={values.offerDirection}
                    longDirection={values.offerDirection === 'Long'}
                    maxYieldTaker={maxYieldTaker}
                    showMultiple={true}
                    collateralToken={
                      values.collateralToken
                        ? values.collateralToken.symbol
                        : null
                    }
                  />
                ) : (
                  <PayoffProfile
                    floor={values.floor}
                    cap={values.cap}
                    inflection={values.inflection}
                    gradient={values.gradient}
                    referenceAsset={values.referenceAsset}
                    hasError={false}
                    collateralToken={
                      values.collateralToken
                        ? values.collateralToken.symbol
                        : null
                    }
                  />
                )}
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
          {transaction === 'filloffer' && (
            <Box>
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
                      {values.offerDirection === 'Long' ? (
                        <strong>
                          <span style={{ color: '#3393E0' }}>0.00x</span>
                        </strong>
                      ) : (
                        <strong>
                          <span style={{ color: '#3393E0' }}>
                            {maxYieldTaker.toFixed(2) + 'x'}
                          </span>
                        </strong>
                      )}{' '}
                      if reported outcome is{' '}
                      {values.floor < values.inflection &&
                      values.inflection < values.cap
                        ? 'at or '
                        : ''}{' '}
                      below {values.floor}
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
                      {values.offerDirection === 'Long' ? (
                        <strong>
                          <span style={{ color: '#3393E0' }}>
                            {maxYieldTaker.toFixed(2) + 'x'}
                          </span>
                        </strong>
                      ) : (
                        <strong>
                          <span style={{ color: '#3393E0' }}>0.00x</span>
                        </strong>
                      )}{' '}
                      if reported outcome is{' '}
                      {values.floor < values.inflection &&
                      values.inflection < values.cap
                        ? 'at or '
                        : ''}{' '}
                      above {values.cap}{' '}
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
                      {values.offerDirection === 'Long' ? (
                        <strong>
                          <span style={{ color: '#3393E0' }}>
                            {(values.gradient * maxYieldTaker).toFixed(2) + 'x'}
                          </span>
                        </strong>
                      ) : (
                        <strong>
                          <span style={{ color: '#3393E0' }}>
                            {((1 - values.gradient) * maxYieldTaker).toFixed(
                              2
                            ) + 'x'}
                          </span>
                        </strong>
                      )}{' '}
                      if reported outcome is
                      {' ' + values.inflection}
                    </Typography>
                  </Stack>
                </Container>
              </Card>
            </Box>
          )}
          {transaction === 'createoffer' && (
            <Box>
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
                      {values.offerDirection === 'Long' ? (
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
                      {values.floor < values.inflection &&
                      values.inflection < values.cap
                        ? 'at or '
                        : ''}{' '}
                      below {values.floor}{' '}
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
                      {values.offerDirection === 'Long' ? (
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
                      {values.floor < values.inflection &&
                      values.inflection < values.cap
                        ? 'at or '
                        : ''}{' '}
                      above {values.cap}{' '}
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
                      {values.offerDirection === 'Long' ? (
                        <>
                          <strong>
                            <span style={{ color: '#3393E0' }}>
                              {(
                                (values.gradient *
                                  formik.values.collateralBalance) /
                                formik.values.yourShare
                              ).toFixed(2) + 'x'}
                            </span>
                          </strong>{' '}
                          your /{' '}
                          <strong>
                            <span style={{ color: '#3393E0' }}>
                              {(
                                ((1 - values.gradient) *
                                  formik.values.collateralBalance) /
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
                                ((1 - values.gradient) *
                                  formik.values.collateralBalance) /
                                formik.values.yourShare
                              ).toFixed(2) + 'x'}
                            </span>
                          </strong>{' '}
                          your /{' '}
                          <strong>
                            <span style={{ color: '#3393E0' }}>
                              {(
                                (values.gradient *
                                  formik.values.collateralBalance) /
                                formik.values.takerShare
                              ).toFixed(2) + 'x'}
                            </span>
                          </strong>{' '}
                          taker multiple{' '}
                        </>
                      )}
                      if the reported outcome is {values.inflection}
                    </Typography>
                  </Stack>
                </Container>
              </Card>
            </Box>
          )}
          {transaction === 'createpool' && (
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
                      0.00{' '}
                      {values.collateralToken != null
                        ? values.collateralToken.symbol
                        : ''}
                      /LONG
                    </strong>{' '}
                    and
                    <strong>
                      {' '}
                      1.00{' '}
                      {values.collateralToken != null
                        ? values.collateralToken.symbol
                        : ''}
                      /SHORT
                    </strong>{' '}
                    token if the reported outcome is{' '}
                    {values.floor < values.inflection &&
                    values.inflection < values.cap
                      ? 'at or '
                      : ''}{' '}
                    below {values.floor}{' '}
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
                      1.00{' '}
                      {values.collateralToken != null
                        ? values.collateralToken.symbol
                        : ''}
                      /LONG
                    </strong>{' '}
                    and
                    <strong>
                      {' '}
                      0.00{' '}
                      {values.collateralToken != null
                        ? values.collateralToken.symbol
                        : ''}
                      /SHORT
                    </strong>{' '}
                    token if the reported outcome is{' '}
                    {values.floor < values.inflection &&
                    values.inflection < values.cap
                      ? 'at or '
                      : ''}{' '}
                    above {values.cap}{' '}
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
                      {values.gradient.toString() !== ''
                        ? values.gradient.toFixed(2)
                        : 0}{' '}
                      {values.collateralToken != null
                        ? values.collateralToken.symbol
                        : ''}
                      /LONG
                    </strong>{' '}
                    and{' '}
                    <strong>
                      {values.gradient.toString() !== ''
                        ? (1 - values.gradient).toFixed(2)
                        : 1}{' '}
                      {values.collateralToken != null
                        ? values.collateralToken.symbol
                        : ''}
                      /SHORT
                    </strong>{' '}
                    token if the reported outcome is {values.inflection}
                  </Typography>
                </Stack>
              </Container>
            </Card>
          )}
        </Stack>
      </Container>
    </Stack>
  )
}
