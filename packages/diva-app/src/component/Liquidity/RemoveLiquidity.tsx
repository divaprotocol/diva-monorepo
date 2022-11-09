import { BigNumber, Contract, ethers } from 'ethers'
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Collapse,
  Container,
  Divider,
  IconButton,
  Input,
  Stack,
  TextField,
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
import LightbulbIcon from '@mui/icons-material/Lightbulb'

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
  const protocolFees =
    pool &&
    textFieldValue !== '' &&
    (
      parseFloat(formatEther(BigNumber.from(pool!.redemptionFee))) *
      parseFloat(formatUnits(parseUnits(textFieldValue, decimal), decimal))
    ).toFixed(4)
  const settlementFees =
    pool &&
    textFieldValue !== '' &&
    (
      parseFloat(formatEther(BigNumber.from(pool!.settlementFee))) *
      parseFloat(formatUnits(parseUnits(textFieldValue, decimal), decimal))
    ).toFixed(4)

  const receivingAmount =
    pool &&
    textFieldValue !== '' &&
    (
      parseFloat(textFieldValue) -
      (parseFloat(protocolFees) + parseFloat(settlementFees))
    ).toFixed(4)
  const returnAmount =
    textFieldValue == '' ? 0 : Number(parseFloat(textFieldValue).toFixed(4))

  const currentPoolSize =
    pool &&
    parseFloat(
      formatUnits(BigNumber.from(pool.collateralBalance), decimal)
    ).toFixed(4) + pool.collateralToken.symbol

  const yourPoolShare =
    pool &&
    Number(
      parseFloat(formatUnits(maxCollateral.toString())) /
        parseFloat(formatUnits(BigNumber.from(pool.collateralBalance), decimal))
    ).toFixed(4) + ' %'

  useEffect(() => {
    if (pool) {
      setOpenExpiredAlert(pool.statusFinalReferenceValue === 'Confirmed')
      setDecimal(pool!.collateralToken.decimals)
      if (tokenBalanceLong && tokenBalanceShort && decimal) {
        const longBalance = parseUnits(
          tokenBalanceLong,
          pool!.collateralToken.decimals
        )
        const shortBalance = parseUnits(
          tokenBalanceShort,
          pool!.collateralToken.decimals
        )
        const colLong = longBalance
          .mul(
            BigNumber.from(pool.collateralBalanceLongInitial).add(
              BigNumber.from(pool.collateralBalanceShortInitial)
            )
          )
          .mul(parseUnits('1', 18 - decimal))
          .div(BigNumber.from(pool.supplyInitial))
        const colShort = shortBalance
          .mul(
            BigNumber.from(pool.collateralBalanceLongInitial).add(
              BigNumber.from(pool.collateralBalanceShortInitial)
            )
          )
          .mul(parseUnits('1', 18 - decimal))
          .div(BigNumber.from(pool.supplyInitial))
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
        parseUnits(longToken, decimal)
      )
      await tx?.wait()
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.error(error)
    }
  }

  return (
    <>
      {loading ? (
        <>
          <Box pt={2} pb={3} maxWidth="470px">
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
      <Stack
        direction="row"
        spacing={theme.spacing(20)}
        sx={{ my: theme.spacing(6) }}
      >
        <Box>
          <Card
            sx={{
              width: '430px',
              border: '1px solid #383838',
              background: theme.palette.background.default,
              borderRadius: '5px',
              borderBottom: 0,
              p: theme.spacing(2),
            }}
          >
            <TextField
              id="outlined-number"
              label="Amount to remove"
              type="number"
              sx={{ width: '100%' }}
              InputLabelProps={{
                shrink: true,
              }}
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
            {tokenBalanceLong ? (
              <Typography
                variant="h5"
                color="text.secondary"
                sx={{ ml: theme.spacing(2) }}
              >
                You can remove up to{' '}
                <Typography variant="h4" sx={{ display: 'inline' }}>
                  &nbsp;
                  {parseFloat(formatEther(maxCollateral)).toFixed(4)}{' '}
                  {pool!.collateralToken.symbol}&nbsp;
                </Typography>
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
          </Card>
          <Card
            sx={{
              width: '430px',
              height: '280px',
              border: '1px solid #1B3448',
              mt: theme.spacing(-1),
              py: theme.spacing(4),
              px: theme.spacing(2),
              background: 'linear-gradient(to bottom, #1B3448, #000000 110%)',
            }}
          >
            <Stack direction="column" spacing={4}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h3">Protocol Fee</Typography>
                <Typography variant="h3">
                  {protocolFees} {pool!.collateralToken.symbol}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h3">Settlement Fee</Typography>
                <Typography variant="h3">
                  {settlementFees} {pool!.collateralToken.symbol}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h3">
                  You will receive (after fees)
                </Typography>
                <Typography variant="h3">
                  {receivingAmount} {pool!.collateralToken.symbol}
                </Typography>
              </Stack>
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
                                  poolId:
                                    window.location.pathname.split('/')[1],
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
            </Stack>
            <Box>
              <Typography variant="h6" color="gray">
                {returnAmount} LONG and SHORT tokens will be returned and burnt.
              </Typography>
            </Box>
          </Card>
        </Box>
        <Box>
          <Stack direction="column" spacing={3} maxWidth={theme.spacing(65)}>
            <Typography variant="h3" sx={{ mt: theme.spacing(-2) }}>
              Pool Status
            </Typography>
            <Stack direction="row" justifyContent="space-between">
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
                  TVL
                </Typography>
                <Typography fontSize="20px" color="white">
                  {currentPoolSize}
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="normal" color="#929292">
                  Your Pool Share
                </Typography>
                <Typography fontSize="20px" color="white">
                  {yourPoolShare}
                </Typography>
              </Box>
            </Stack>
            <Typography variant="h3">Your Balance</Typography>
            <Stack direction="row" spacing={theme.spacing(4)}>
              <Box>
                <Typography variant="h4" fontWeight="normal" color="#929292">
                  LONG Tokens
                </Typography>
                <Typography fontSize="20px" color="white" noWrap>
                  {(+longToken).toFixed(4)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" fontWeight="normal" color="#929292">
                  SHORT Tokens
                </Typography>
                <Typography fontSize="20px" color="white" noWrap>
                  {(+shortToken).toFixed(4)}
                </Typography>
              </Box>
            </Stack>
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
                  p: theme.spacing(3),
                }}
              >
                <Stack direction="row" spacing={2}>
                  <LightbulbIcon
                    style={{
                      height: theme.spacing(3),
                      width: theme.spacing(3),
                      color: '#595959',
                    }}
                  />
                  <Typography variant="h3" color="gray" textAlign="justify">
                    By removing liquidity you are giving back LONG and SHORT
                    position tokens in equal proportions to receive collateral
                    in return
                  </Typography>
                </Stack>
              </Card>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </>
  )
}
