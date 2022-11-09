import {
  Alert,
  Card,
  Collapse,
  Container,
  Divider,
  IconButton,
  Input,
  Stack,
  useTheme,
  Box,
  TextField,
} from '@mui/material'
import Typography from '@mui/material/Typography'
import React, { useEffect, useState } from 'react'
import { useErcBalance } from '../../hooks/useErcBalance'
import { BigNumber } from 'ethers'
import styled from '@emotion/styled'
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers/lib/utils'
import { ethers } from 'ethers'
import { config } from '../../constants'
import ERC20 from '@diva/contracts/abis/erc20.json'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { selectUserAddress } from '../../Redux/appSlice'
import { useDispatch } from 'react-redux'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { useAppSelector } from '../../Redux/hooks'
import { ApproveActionButtons } from '../ApproveActionButtons'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
import { ReactComponent as LongPool } from '../../Images/long-trade-page-icon.svg'
import { ReactComponent as ShortPool } from '../../Images/short-trade-page-icon.svg'
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
  const tokenBalance = useErcBalance(
    pool ? pool!.collateralToken.id : undefined,
    balanceUpdated
  )
  const token = new ethers.Contract(
    pool.collateralToken.id,
    ERC20,
    provider?.getSigner()
  )
  useEffect(() => {
    if (pool) {
      setDecimal(pool.collateralToken.decimals)
      setOpenExpiredAlert(Date.now() > 1000 * parseInt(pool.expiryTime))
    }
    if (
      pool! &&
      pool!.capacity.toString() !== '0.0' &&
      textFieldValue !== '' &&
      parseFloat(textFieldValue) +
        parseFloat(pool!.collateralBalance.toString()) >
        parseFloat(pool!.capacity.toString())
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

  const [remainingAllowanace, setRemainingAllowance] = useState<number>()
  useEffect(() => {
    if (account) {
      const getRemainingAllownace = async () => {
        const Allownace = await token.allowance(
          account,
          config[chainId]?.divaAddress
        )
        setRemainingAllowance(Number(Allownace))
      }
      getRemainingAllownace()
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
                    &nbsp; {parseFloat(tokenBalance!).toFixed(4)}{' '}
                    {pool!.collateralToken.symbol} &nbsp;
                  </Typography>
                  in your wallet.{' '}
                  <MaxCollateral
                    role="button"
                    onClick={() => {
                      if (tokenBalance != null) {
                        setTextFieldValue(tokenBalance)
                      }
                    }}
                  >
                    (Max)
                  </MaxCollateral>
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
              height: '280px',
              border: '1px solid #1B3448',
              mt: theme.spacing(-1),
              py: theme.spacing(4),
              px: theme.spacing(2),
              background: 'linear-gradient(to bottom, #1B3448, #000000 110%)',
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
                      (
                        (parseFloat(formatEther(pool.supplyInitial)) /
                          (parseFloat(
                            formatUnits(
                              pool.collateralBalanceLongInitial,
                              decimal
                            )
                          ) +
                            parseFloat(
                              formatUnits(
                                pool.collateralBalanceShortInitial,
                                decimal
                              )
                            ))) *
                        parseFloat(formatEther(parseEther(textFieldValue)))
                      ).toFixed(4)}
                  </Typography>
                </Stack>
                <Stack direction="column" spacing={2} minWidth="100px">
                  <Typography variant="h4" fontWeight="normal" color="#929292">
                    Short Tokens
                  </Typography>
                  <Typography variant="h2" noWrap>
                    {pool &&
                      textFieldValue !== '' &&
                      (
                        (parseFloat(formatEther(pool.supplyInitial)) /
                          (parseFloat(
                            formatUnits(
                              pool.collateralBalanceLongInitial,
                              decimal
                            )
                          ) +
                            parseFloat(
                              formatUnits(
                                pool.collateralBalanceShortInitial,
                                decimal
                              )
                            ))) *
                        parseFloat(formatEther(parseEther(textFieldValue)))
                      ).toFixed(4)}
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
                        parseFloat(textFieldValue) /
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
            />
            <Typography variant="h6" color="gray">
              Remaining Allowance: {remainingAllowanace}
            </Typography>
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
                  '115792089237316195423570985008687907853269984665640564039457584007913129639935' ? (
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
                        {pool.id}
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
                    Bullish? Keep the LONG tokens and sell the SHORT tokens
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
                    Bearish? Keep the SHORT tokens and sell the LONG tokens
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
