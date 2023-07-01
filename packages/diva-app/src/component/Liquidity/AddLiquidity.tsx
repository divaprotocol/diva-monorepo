import {
  Alert,
  Card,
  Collapse,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Input,
  Stack,
  useTheme,
  Box,
  TextField,
  AccordionSummary,
  FormControl,
  Tooltip,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import Typography from '@mui/material/Typography'
import React, { useEffect, useState } from 'react'
import { useErcBalance } from '../../hooks/useErcBalance'
import { BigNumber } from 'ethers'
import styled from '@emotion/styled'
import { formatUnits } from 'ethers/lib/utils'
import { ethers } from 'ethers'
import { config } from '../../constants'
import ERC20 from '../../abi/ERC20ABI.json'
import { toExponentialOrNumber } from '../../Util/utils'
import { selectUserAddress } from '../../Redux/appSlice'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { useAppSelector } from '../../Redux/hooks'
import { ApproveActionButtons } from '../ApproveActionButtons'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import { ReactComponent as LongPool } from '../../Images/long-trade-page-icon.svg'
import { ReactComponent as ShortPool } from '../../Images/short-trade-page-icon.svg'
import AccordionDetails from '@mui/material/AccordionDetails'
import { useCreatePoolFormik } from '../CreatePool/formik'
import Accordion from '@mui/material/Accordion'
import { getShortenedAddress } from '../../Util/getShortenedAddress'

const MaxCollateral = styled.u`
  cursor: pointer;
  &:hover {
    color: ${(props) => (props.theme as any).palette.primary.main};
  }
`

type Props = {
  pool?: any
}

export const AddLiquidity = ({ pool }: Props) => {
  const [textFieldValue, setTextFieldValue] = useState('')
  const formik = useCreatePoolFormik()
  const theme = useTheme()
  const [openAlert, setOpenAlert] = React.useState(false)
  const [openExpiredAlert, setOpenExpiredAlert] = React.useState(false)
  const [openCapacityAlert, setOpenCapacityAlert] = React.useState(false)
  const [decimal, setDecimal] = React.useState(18)
  const [loading, setLoading] = React.useState(false)
  const [balanceUpdated, setBalanceUpdated] = React.useState(true)
  const [approving, setApproving] = React.useState('')
  const { provider } = useConnectionContext()
  const account = useAppSelector(selectUserAddress)
  const chainId = provider?.network?.chainId
  const [expanded, setExpanded] = useState(false)
  const [editLongRecipient, setEditLongRecipient] = useState(false)
  const [editShortRecipient, setEditShortRecipient] = useState(false)
  console.log(account)
  // TODO Move this part into useEffect
  const { balance: tokenBalance } = useErcBalance(
    pool ? pool!.collateralToken.id : undefined,
    balanceUpdated
  )
  const token = new ethers.Contract(
    pool.collateralToken.id,
    ERC20,
    provider?.getSigner()
  )
  useEffect(() => {
    formik.setFieldValue('longRecipient', account)
    formik.setFieldValue('shortRecipient', account)
  }, [account])
  useEffect(() => {
    if (pool) {
      setDecimal(pool.collateralToken.decimals)
      setOpenExpiredAlert(Date.now() > 1000 * parseInt(pool.expiryTime))
    }
    if (
      pool! &&
      pool!.capacity.toString() !== ethers.constants.MaxUint256.toString() &&
      textFieldValue !== '' &&
      parseFloat(textFieldValue) +
        parseFloat(formatUnits(pool!.collateralBalance, decimal)) >
        parseFloat(formatUnits(pool!.capacity, decimal))
    ) {
      setOpenCapacityAlert(true)
    } else {
      setOpenCapacityAlert(false)
    }
    if (tokenBalance && parseInt(textFieldValue) > parseInt(tokenBalance!)) {
      setOpenAlert(true)
    } else {
      setOpenAlert(false)
    }
  }, [textFieldValue, pool, tokenBalance])

  const [remainingAllowance, setRemainingAllowance] = useState('')
  useEffect(() => {
    if (account) {
      const getRemainingAllowance = async () => {
        const allowance = await token.allowance(
          account,
          config[chainId]?.divaAddress
        )
        setRemainingAllowance(
          toExponentialOrNumber(Number(formatUnits(allowance, decimal)))
        )
      }
      getRemainingAllowance()
    }
  }, [account, chainId, token])
  return (
    <>
      {loading ? (
        <>
          <Box pt={2} pb={3} maxWidth="470px">
            <Alert severity="info">{approving}</Alert>
          </Box>
        </>
      ) : (
        ''
      )}
      <Collapse in={openExpiredAlert}>
        <Alert
          severity="error"
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => {
                setOpenExpiredAlert(false)
              }}
            >
              {'X'}
            </IconButton>
          }
          sx={{ mb: 2, maxWidth: '470px' }}
        >
          Pool expired. Addition of liquidity is no longer possible
        </Alert>
      </Collapse>
      <Stack
        direction="row"
        spacing={8}
        alignItems="center"
        my={theme.spacing(4)}
      >
        <Stack
          direction="column"
          sx={{
            mt: theme.spacing(2),
          }}
        >
          <Card
            sx={{
              width: '470px',
              border: '1px solid #383838',
              background: theme.palette.background.default,
              borderRadius: '5px',
              borderBottom: 0,
              p: theme.spacing(2),
            }}
          >
            <TextField
              id="outlined-number"
              label="Amount to add"
              type="number"
              sx={{ width: '100%' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ color: '#929292' }}>
                    {pool!.collateralToken.symbol}
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                shrink: true,
              }}
              value={textFieldValue}
              onChange={(e) => {
                const amount = e.target.value
                if (!amount || amount.match(/^\d{1,}(\.\d{0,18})?$/)) {
                  setTextFieldValue(amount)
                }
              }}
            />
            {tokenBalance ? (
              <>
                <Typography variant="h5" color="text.secondary">
                  You have
                  <Typography variant="h4" sx={{ display: 'inline' }}>
                    {' '}
                    {toExponentialOrNumber(parseFloat(tokenBalance!))}{' '}
                    {pool!.collateralToken.symbol}{' '}
                  </Typography>
                  in your wallet
                  {' ('}
                  <MaxCollateral
                    role="button"
                    onClick={() => {
                      if (tokenBalance != null) {
                        setTextFieldValue(tokenBalance)
                      }
                    }}
                  >
                    Max
                  </MaxCollateral>
                  {')'}
                </Typography>
              </>
            ) : (
              <Typography variant="subtitle2" color="text.secondary">
                Please connect your wallet
              </Typography>
            )}
            <Collapse in={openAlert} sx={{ mt: theme.spacing(2) }}>
              <Alert
                severity="error"
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setOpenAlert(false)
                    }}
                  >
                    {'X'}
                  </IconButton>
                }
                sx={{ mb: 2 }}
              >
                Insufficient wallet balance
              </Alert>
            </Collapse>
            <Collapse in={openCapacityAlert} sx={{ mt: theme.spacing(2) }}>
              <Alert
                severity="error"
                action={
                  <IconButton
                    aria-label="close"
                    color="inherit"
                    size="small"
                    onClick={() => {
                      setOpenCapacityAlert(false)
                    }}
                  >
                    {'X'}
                  </IconButton>
                }
                sx={{ mb: 2 }}
              >
                Exceeds pool capacity
              </Alert>
            </Collapse>
          </Card>
          <Card
            sx={{
              width: '470px',
              height: '100%',
              border: '1px solid #1B3448',
              mt: theme.spacing(-1),
              py: theme.spacing(4),
              px: theme.spacing(2),
              background: 'linear-gradient(to bottom, #051827, #121212 110%)',
            }}
          >
            <Stack direction="column" spacing={4} pl={theme.spacing(0.8)}>
              <Typography variant="h3" color="#ffffff">
                You Receive
              </Typography>
              <Stack direction="row" spacing={6}>
                <Stack direction="column" spacing={2} minWidth="100px">
                  <Typography variant="h4" fontWeight="normal" color="#929292">
                    Long Tokens
                  </Typography>
                  <Typography variant="h2" noWrap>
                    {pool &&
                      textFieldValue !== '' &&
                      // (parseFloat(formatEther(pool.supplyInitial)) /
                      //   (parseFloat(
                      //     formatUnits(
                      //       pool.collateralBalanceLongInitial,
                      //       decimal
                      //     )
                      //   ) +
                      //     parseFloat(
                      //       formatUnits(
                      //         pool.collateralBalanceShortInitial,
                      //         decimal
                      //       )
                      //     ))) *
                      parseFloat(textFieldValue).toFixed(4)}
                  </Typography>
                </Stack>
                <Stack direction="column" spacing={2} minWidth="100px">
                  <Typography variant="h4" fontWeight="normal" color="#929292">
                    Short Tokens
                  </Typography>
                  <Typography variant="h2" noWrap>
                    {pool &&
                      textFieldValue !== '' &&
                      parseFloat(textFieldValue).toFixed(4)}
                  </Typography>
                </Stack>
                <Stack direction="column" spacing={2} minWidth="100px">
                  <Typography variant="h4" fontWeight="normal" color="#929292">
                    Share of Pool
                  </Typography>
                  <Typography variant="h2">
                    {pool &&
                      textFieldValue !== '' &&
                      Number(
                        (100 * parseFloat(textFieldValue)) /
                          (parseFloat(textFieldValue) +
                            parseFloat(
                              formatUnits(
                                BigNumber.from(pool.collateralBalance),
                                decimal
                              )
                            ))
                      ).toFixed(2) + ' %'}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
            <ApproveActionButtons
              collateralTokenAddress={pool!.collateralToken.id}
              decimal={pool.collateralToken.decimals}
              textFieldValue={textFieldValue}
              transactionType={'liquidity'}
              onTransactionSuccess={() => setBalanceUpdated(!balanceUpdated)}
              alert={openExpiredAlert || openAlert}
              formik={formik}
            />
            <Typography variant="h6" color="gray">
              {/* {console.log('typeof remainingAllowance', remainingAllowance)} */}
              {/* TODO: use toExponentialOrNumber(remainingAllowance) instead of remainingAllowance, but issue is that remainingAllowance shows undefined */}
              Remaining Allowance: {remainingAllowance}{' '}
              {pool.collateralToken.symbol}
            </Typography>
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
                  <Stack>
                    <Container sx={{ margin: -2, padding: 1 }}>
                      <FormControl
                        fullWidth
                        error={formik.errors.longRecipient != null}
                      >
                        <Tooltip placement="top-end" title="Long Recipient">
                          <TextField
                            name="longRecipient"
                            disabled={!editLongRecipient}
                            id="longRecipient"
                            label="Long Recipient"
                            value={formik.values.longRecipient}
                            onChange={(event) => {
                              formik.setFieldValue(
                                'longRecipient',
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
                            defaultChecked={editLongRecipient}
                            onChange={() => {
                              setEditLongRecipient(!editLongRecipient)
                              formik.setFieldValue('longRecipient', account)
                            }}
                          ></Checkbox>
                        }
                        label="Edit"
                      />
                      <FormControl
                        fullWidth
                        error={formik.errors.shortRecipient != null}
                      >
                        <Tooltip placement="top-end" title="Short Recipient">
                          <TextField
                            name="shortRecipient"
                            disabled={!editShortRecipient}
                            id="shortRecipient"
                            label="Short Recipient"
                            value={formik.values.shortRecipient}
                            onChange={(event) => {
                              formik.setFieldValue(
                                'shortRecipient',
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
                            defaultChecked={editShortRecipient}
                            onChange={() => {
                              setEditShortRecipient(!editShortRecipient)
                              formik.setFieldValue('shortRecipient', account)
                            }}
                          />
                        }
                        label="Edit"
                      />
                    </Container>
                  </Stack>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Card>
        </Stack>
        <Stack
          direction="column"
          spacing={4}
          maxWidth={theme.spacing(65)}
          /* sx={{ background: '#556565' }} */
        >
          <Box sx={{ ml: theme.spacing(6), mt: theme.spacing(-4) }}>
            <Typography variant="h3"> Pool Status</Typography>
          </Box>
          <Box>
            {pool && (
              <Container sx={{ mb: theme.spacing(4) }}>
                {pool &&
                formatUnits(pool.capacity, pool.collateralToken.decimals) !== // TODO: drop this first == 0.0 part when migrating to new contracts
                  '0.0' &&
                pool.capacity.toString() !==
                  ethers.constants.MaxUint256.toString() ? (
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    ml={theme.spacing(3)}
                    /* sx={{ background: '#000000' }} */
                  >
                    <Box>
                      <Typography variant="h4" fontWeight="normal" color="gray">
                        Pool Capacity
                      </Typography>
                      <Typography fontSize="20px" color="white">
                        {pool &&
                          (formatUnits(
                            pool.capacity,
                            pool.collateralToken.decimals
                          ) === '0.0'
                            ? 'Unlimited'
                            : parseFloat(
                                formatUnits(
                                  pool.capacity,
                                  pool.collateralToken.decimals
                                )
                              ).toFixed(2))}{' '}
                        {pool.collateralToken.symbol}{' '}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="normal" color="gray">
                        Currently Utilized
                      </Typography>
                      <Typography fontSize="20px" color="white">
                        {pool &&
                          parseFloat(
                            formatUnits(
                              BigNumber.from(pool.collateralBalance),
                              pool.collateralToken.decimals
                            )
                          ).toFixed(2)}{' '}
                        {pool.collateralToken.symbol!}{' '}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="normal" color="gray">
                        Currently Utilized in %
                      </Typography>
                      <Typography fontSize="20px" color="white">
                        {pool &&
                          (
                            (100 *
                              parseFloat(
                                formatUnits(
                                  BigNumber.from(pool.collateralBalance),
                                  pool.collateralToken.decimals
                                )
                              )) /
                            parseFloat(
                              formatUnits(
                                BigNumber.from(pool.capacity),
                                pool.collateralToken.decimals
                              )
                            )
                          ).toFixed(2)}
                        {'%'}
                      </Typography>
                    </Box>
                  </Stack>
                ) : (
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    ml={theme.spacing(3)}
                    /* sx={{ background: '#000000' }} */
                  >
                    <Box>
                      <Typography variant="h4" fontWeight="normal" color="gray">
                        Pool ID
                      </Typography>
                      <Typography fontSize="20px" color="white">
                        {getShortenedAddress(pool.id, 6, 0)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="normal" color="gray">
                        Pool Capacity
                      </Typography>
                      <Typography fontSize="20px" color="white">
                        Unlimited
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h4" fontWeight="normal" color="gray">
                        TVL
                      </Typography>
                      <Typography fontSize="20px" color="white">
                        {pool &&
                          parseFloat(
                            formatUnits(
                              BigNumber.from(pool.collateralBalance),
                              pool.collateralToken.decimals
                            )
                          ).toFixed(4)}{' '}
                        {pool.collateralToken.symbol!}{' '}
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </Container>
            )}
          </Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="flex-start"
            sx={{
              mb: theme.spacing(4),
            }}
          >
            <Card
              sx={{
                width: '420px',
                border: '1px solid #383838',
                borderRadius: '6px',
                mt: theme.spacing(2),
                ml: theme.spacing(6),
                p: theme.spacing(3),
              }}
            >
              <Stack direction="column" spacing={4}>
                <Stack direction="row" spacing={2}>
                  <LightbulbIcon
                    style={{
                      height: theme.spacing(3),
                      width: theme.spacing(3),
                      color: '#595959',
                    }}
                  />
                  <Typography variant="h3" color="gray">
                    By adding liquidity you receive LONG and SHORT position
                    tokens in return which combined represent a claim against
                    the collateral you deposited but on an isolated basis expose
                    you to the upside (LONG) or downside (SHORT) of the
                    underlying metric
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <LongPool
                    style={{
                      height: theme.spacing(3),
                      width: theme.spacing(3),
                    }}
                  />
                  <Typography variant="h3" color="gray">
                    Bullish? Keep the LONG and sell the SHORT tokens
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <ShortPool
                    style={{
                      height: theme.spacing(3),
                      width: theme.spacing(3),
                    }}
                  />
                  <Typography variant="h3" color="gray">
                    Bearish? Keep the SHORT and sell the LONG tokens
                  </Typography>
                </Stack>
              </Stack>
            </Card>
          </Box>
        </Stack>
      </Stack>
    </>
  )
}
