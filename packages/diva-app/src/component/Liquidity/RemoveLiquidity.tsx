import { BigNumber, Contract, ethers } from 'ethers'
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Collapse,
  Container,
  IconButton,
  Input,
  Stack,
  Typography,
  useTheme,
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useErcBalance } from '../../hooks/useErcBalance'
import styled from '@emotion/styled'
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers/lib/utils'
import { useCoinIcon } from '../../hooks/useCoinIcon'
import ERC20 from '../../abi/ERC20ABI.json'
import Button from '@mui/material/Button'
import { config } from '../../constants'
import DIVA_ABI from '../../abi/DIVAABI.json'
import { fetchPool } from '../../Redux/appSlice'
import { useDispatch } from 'react-redux'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { ReactComponent as Star } from '../../Images/star-svgrepo-com.svg'

const MaxCollateral = styled.u`
  cursor: pointer;
  &:hover {
    color: ${(props) => (props.theme as any).palette.primary.main};
  }
`
const CoinIcon = (address: any) => {
  return <img alt={address} src={useCoinIcon(address)} style={{ height: 30 }} />
}
type Props = {
  pool?: any
}

export const RemoveLiquidity = ({ pool }: Props) => {
  const [textFieldValue, setTextFieldValue] = useState('')

  const [openExpiredAlert, setOpenExpiredAlert] = React.useState(false)
  const [longToken, setLongToken] = React.useState('')
  const [shortToken, setShortToken] = React.useState('')
  const [decimal, setDecimal] = React.useState(18)
  const [actionEnabled, setActionEnabled] = React.useState(false)
  const [openAlert, setOpenAlert] = React.useState(false)
  const [loading, setLoading] = useState(false)
  const [maxCollateral, setMaxCollateral] = React.useState<any>(0)
  const [balanceUpdated, setBalanceUpdated] = React.useState(true)
  const { provider } = useConnectionContext()
  const chainId = provider?.network?.chainId
  const dispatch = useDispatch()
  const theme = useTheme()
  const tokenBalanceLong = useErcBalance(
    pool ? pool!.longToken.id : undefined,
    balanceUpdated
  )
  const tokenBalanceShort = useErcBalance(
    pool ? pool!.shortToken.id : undefined,

    balanceUpdated
  )
  useEffect(() => {
    if (pool) {
      setOpenExpiredAlert(pool.statusFinalReferenceValue === 'Confirmed')
      setDecimal(pool!.collateralToken.decimals)
      if (tokenBalanceLong && tokenBalanceShort && decimal) {
        const longBalance = parseEther(tokenBalanceLong)
        const shortBalance = parseEther(tokenBalanceShort)
        const colLong = longBalance
          .mul(
            BigNumber.from(pool.collateralBalanceLongInitial).add(
              BigNumber.from(pool.collateralBalanceShortInitial)
            )
          )
          .mul(parseUnits('1', 18 - decimal))
          .div(BigNumber.from(pool.supplyInitial))
          .mul(
            parseUnits('1', 18)
              .sub(BigNumber.from(pool.redemptionFee))
              .sub(BigNumber.from(pool.settlementFee))
          )
          .div(parseEther('1'))
        const colShort = shortBalance
          .mul(
            BigNumber.from(pool.collateralBalanceLongInitial).add(
              BigNumber.from(pool.collateralBalanceShortInitial)
            )
          )
          .mul(parseUnits('1', 18 - decimal))
          .div(BigNumber.from(pool.supplyInitial))
          .mul(
            parseUnits('1', 18)
              .sub(BigNumber.from(pool.redemptionFee))
              .sub(BigNumber.from(pool.settlementFee))
          )
          .div(parseEther('1'))
        {
          colLong.lt(colShort)
            ? setMaxCollateral(colLong)
            : setMaxCollateral(colShort)
        }
      }
      if (textFieldValue !== '') {
        if (parseFloat(textFieldValue) === 0) {
          setActionEnabled(false)
        } else {
          setLongToken(
            formatEther(
              parseEther(textFieldValue)
                .mul(parseEther('1'))
                .div(
                  parseEther('1')
                    .sub(BigNumber.from(pool.redemptionFee))
                    .sub(BigNumber.from(pool.settlementFee))
                )
                .mul(BigNumber.from(pool.supplyInitial))
                .div(
                  BigNumber.from(pool.collateralBalanceLongInitial)
                    .add(BigNumber.from(pool.collateralBalanceShortInitial))
                    .mul(parseUnits('1', 18 - decimal))
                )
            )
          )
          setShortToken(
            formatEther(
              parseEther(textFieldValue)
                .mul(parseEther('1'))
                .div(
                  parseEther('1')
                    .sub(BigNumber.from(pool.redemptionFee))
                    .sub(BigNumber.from(pool.settlementFee))
                )
                .mul(BigNumber.from(pool.supplyInitial))
                .div(
                  BigNumber.from(pool.collateralBalanceLongInitial)
                    .add(BigNumber.from(pool.collateralBalanceShortInitial))
                    .mul(parseUnits('1', 18 - decimal))
                )
            )
          )
          setActionEnabled(true)
        }
      }
    }
    if (
      tokenBalanceLong &&
      maxCollateral &&
      textFieldValue !== '' &&
      maxCollateral.lt(parseUnits(textFieldValue, decimal))
    ) {
      setOpenAlert(true)
    } else {
      setOpenAlert(false)
    }
  }, [tokenBalanceLong, tokenBalanceShort, textFieldValue, chainId, pool])

  async function removeLiquidityTrade() {
    try {
      setLoading(true)
      const diva = new ethers.Contract(
        config[chainId].divaAddress,
        DIVA_ABI,
        provider?.getSigner()
      )
      const tx = await diva!.removeLiquidity(
        window.location.pathname.split('/')[1],
        parseEther(longToken)
      )
      await tx?.wait()
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.error(error)
    }
  }
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        mt: theme.spacing(2),
      }}
    >
      <Box>
        {loading ? (
          <>
            <Box pt={2} pb={3}>
              <Alert severity="info">Removing...</Alert>
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
            sx={{ mb: 2 }}
          >
            Final value is already confirmed. Please redeem your tokens in My
            Positions.
          </Alert>
        </Collapse>
        <Card sx={{ minWidth: '500px', borderRadius: '16px' }}>
          <Container sx={{ mt: theme.spacing(2) }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ mt: theme.spacing(2) }}>Amount</Typography>
              <Input
                type="number"
                inputProps={{ style: { textAlign: 'right' } }}
                value={textFieldValue}
                onChange={(e) => {
                  const amount = e.target.value
                  if (
                    amount.split('.')[1] != null &&
                    amount.split('.')[1]!.length <= decimal
                  ) {
                    setTextFieldValue(amount)
                  } else if (amount.split('.')[1] == null) {
                    setTextFieldValue(amount)
                  }
                }}
              />
            </Stack>
            {tokenBalanceLong ? (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  You can remove up to{' '}
                  {parseFloat(formatEther(maxCollateral)).toFixed(4)}{' '}
                  {pool!.collateralToken.symbol}
                  {' (after fees) '}
                  <MaxCollateral
                    role="button"
                    onClick={() => {
                      if (maxCollateral != 0) {
                        setTextFieldValue(formatEther(maxCollateral))
                      }
                    }}
                  >
                    {'(Max)'}
                  </MaxCollateral>
                </Typography>
              </>
            ) : (
              <Typography variant="subtitle2" color="text.secondary">
                Please connect your wallet
              </Typography>
            )}
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ mt: theme.spacing(2) }}>Long Token</Typography>
              <Typography sx={{ mt: theme.spacing(2) }}>
                {(+longToken).toFixed(4)}
              </Typography>
            </Stack>
            {tokenBalanceLong ? (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  Your balance: {parseFloat(tokenBalanceLong).toFixed(4)}
                </Typography>
              </>
            ) : (
              <Typography variant="subtitle2" color="text.secondary">
                Please connect your wallet
              </Typography>
            )}
            <Stack direction="row" justifyContent="space-between">
              <Typography sx={{ mt: theme.spacing(2) }}>Short Token</Typography>
              <Typography sx={{ mt: theme.spacing(2) }}>
                {(+shortToken).toFixed(4)}
              </Typography>
            </Stack>
            {tokenBalanceShort ? (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  Your balance: {parseFloat(tokenBalanceShort).toFixed(4)}
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
            <div
              style={{
                height: '100px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {loading ? (
                <CircularProgress />
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                  value="Submit"
                  disabled={
                    !pool ||
                    actionEnabled == false ||
                    openExpiredAlert ||
                    textFieldValue === '' ||
                    chainId == null ||
                    openAlert === true
                  }
                  onClick={() => {
                    setLoading(true)
                    const diva = new ethers.Contract(
                      config[chainId].divaAddress,
                      DIVA_ABI,
                      provider?.getSigner()
                    )
                    diva!
                      .removeLiquidity(
                        window.location.pathname.split('/')[1],
                        parseEther(longToken)
                      )
                      .then((tx) => {
                        /**
                         * dispatch action to refetch the pool after action
                         */
                        tx.wait().then(() => {
                          setLoading(false)
                          setTimeout(() => {
                            setBalanceUpdated(false)
                            dispatch(
                              fetchPool({
                                graphUrl:
                                  config[chainId as number].divaSubgraph,
                                poolId: window.location.pathname.split('/')[1],
                              })
                            )
                          }, 5000)
                        })
                      })
                      .catch((err) => {
                        setLoading(false)
                        console.error(err)
                      })
                  }}
                  style={{
                    maxWidth: theme.spacing(38),
                    maxHeight: theme.spacing(5),
                    minWidth: theme.spacing(38),
                    minHeight: theme.spacing(5),
                  }}
                >
                  Remove
                </Button>
              )}
            </div>
          </Container>
        </Card>
      </Box>
      <Box>
        <Container
          sx={{ width: '490px', mt: theme.spacing(4), mb: theme.spacing(2) }}
        >
          <Stack direction="row" justifyContent="space-between">
            <Typography>Current Pool Size</Typography>
            <Typography>
              {pool &&
                parseFloat(
                  formatUnits(BigNumber.from(pool.collateralBalance), decimal)
                ).toFixed(4)}{' '}
              {pool!.collateralToken.symbol}{' '}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography>Protocol Fee</Typography>
            <Typography>
              {pool &&
                textFieldValue !== '' &&
                (
                  (parseFloat(
                    formatEther(BigNumber.from(pool!.redemptionFee))
                  ) *
                    parseFloat(
                      formatUnits(parseUnits(textFieldValue, decimal), decimal)
                    )) /
                  (1.0 -
                    parseFloat(
                      formatEther(BigNumber.from(pool.redemptionFee))
                    ) -
                    parseFloat(formatEther(BigNumber.from(pool.settlementFee))))
                ).toFixed(4)}{' '}
              {pool!.collateralToken.symbol}{' '}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography>Settlement Fee</Typography>
            <Typography>
              {pool &&
                textFieldValue !== '' &&
                (
                  (parseFloat(
                    formatEther(BigNumber.from(pool!.settlementFee))
                  ) *
                    parseFloat(
                      formatUnits(parseUnits(textFieldValue, decimal), decimal)
                    )) /
                  (1.0 -
                    parseFloat(
                      formatEther(BigNumber.from(pool.redemptionFee))
                    ) -
                    parseFloat(formatEther(BigNumber.from(pool.settlementFee))))
                ).toFixed(4)}{' '}
              {pool!.collateralToken.symbol}{' '}
            </Typography>
          </Stack>
        </Container>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            minWidth: theme.spacing(82),
          }}
        >
          <Card
            sx={{
              mt: theme.spacing(2),
              borderRadius: '16px',
              width: '450px',
            }}
          >
            <Container
              sx={{
                mt: theme.spacing(2),
                mb: theme.spacing(2),
              }}
            >
              <Stack direction="row">
                <Star
                  style={{
                    marginTop: theme.spacing(-1),
                    paddingRight: theme.spacing(1),
                    height: theme.spacing(4),
                    width: theme.spacing(4),
                  }}
                />
                <Typography fontSize={'0.85rem'} style={{ color: 'gray' }}>
                  {' '}
                  By removing liquidity you are giving back long and short
                  position tokens proportional to the pool balance and receive
                  collateral in return
                </Typography>
              </Stack>
            </Container>
          </Card>
        </Box>
      </Box>
    </Stack>
  )
}
