import { ethers } from 'ethers'
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Collapse,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'
import { useErcBalance } from '../../hooks/useErcBalance'
import styled from '@emotion/styled'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import Button from '@mui/material/Button'
import { config } from '../../constants'
import DIVA_ABI from '../../abi/DIVAABI.json'
import { fetchPool } from '../../Redux/appSlice'
import { useDispatch } from 'react-redux'
import { selectUserAddress } from '../../Redux/appSlice'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { useAppSelector } from '../../Redux/hooks'
import LightbulbIcon from '@mui/icons-material/Lightbulb'
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
  const account = useAppSelector(selectUserAddress)
  const chainId = provider?.network?.chainId
  const dispatch = useDispatch()
  const theme = useTheme()

  // TODO Move this part into the useEffect hook so that it updates the user balance on account switch
  const { balance: tokenBalanceLong } = useErcBalance(
    pool ? pool!.longToken.id : undefined,
    balanceUpdated
  )
  const { balance: tokenBalanceShort } = useErcBalance(
    pool ? pool!.shortToken.id : undefined,

    balanceUpdated
  )

  const protocolFees =
    pool &&
    textFieldValue !== '' &&
    (
      parseFloat(formatUnits(pool!.protocolFee)) * parseFloat(textFieldValue)
    ).toFixed(4)

  const settlementFees =
    pool &&
    textFieldValue !== '' &&
    (
      parseFloat(formatUnits(pool!.settlementFee)) * parseFloat(textFieldValue)
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

  // const currentPoolSize =
  //   pool &&
  //   parseFloat(formatUnits(pool.collateralBalance, decimal)).toFixed(4) +
  //     ' ' +
  //     pool.collateralToken.symbol

  const currentPoolSize = useMemo(() => {
    if (pool) {
      return (
        parseFloat(formatUnits(pool.collateralBalance, decimal)).toFixed(4) +
        ' ' +
        pool.collateralToken.symbol
      )
    }
    return null
  }, [pool, decimal])

  const yourPoolShare =
    pool &&
    Number(
      (parseFloat(formatUnits(maxCollateral.toString(), decimal)) /
        parseFloat(formatUnits(pool.collateralBalance, decimal))) *
        100
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
        const colShort = shortBalance
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
          setLongToken(textFieldValue)
          setShortToken(textFieldValue)
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
  }, [
    tokenBalanceLong,
    tokenBalanceShort,
    textFieldValue,
    chainId,
    pool,
    account,
  ])

  // Not using this function
  // async function removeLiquidityTrade() {
  //   try {
  //     setLoading(true)
  //     const diva = new ethers.Contract(
  //       config[chainId].divaAddress,
  //       DIVA_ABI,
  //       provider?.getSigner()
  //     )
  //     const tx = await diva!.removeLiquidity(
  //       window.location.pathname.split('/')[1],
  //       parseUnits(longToken, decimal)
  //     )
  //     await tx?.wait()
  //     setLoading(false)
  //   } catch (error) {
  //     setLoading(false)
  //     console.error(error)
  //   }
  // }

  const handleRemoveClick = async () => {
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

      await tx.wait()

      // Dispatch action to refetch the pool after action
      setLoading(false)
      setBalanceUpdated(false)

      // Add additional delay to ensure the contract state has been updated on-chain
      // suggestion: delay value can be dynamic based on the network
      setTimeout(() => {
        dispatch(
          fetchPool({
            graphUrl: config[chainId as number].divaSubgraph,
            poolId: pool.id,
          })
        )
      }, 6000)
    } catch (err) {
      setLoading(false)
      console.error(err)
    } finally {
      setTextFieldValue('0')
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
                You can remove up to
                <Typography variant="h4" sx={{ display: 'inline' }}>
                  &nbsp;
                  {parseFloat(formatUnits(maxCollateral, decimal)).toFixed(
                    4
                  )}{' '}
                  {pool!.collateralToken.symbol}&nbsp;
                </Typography>
                {'('}
                <MaxCollateral
                  role="button"
                  onClick={() => {
                    if (maxCollateral != 0) {
                      setTextFieldValue(formatUnits(maxCollateral, decimal))
                    }
                  }}
                >
                  {'Max'}
                </MaxCollateral>
                {')'}
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
              background: 'linear-gradient(to bottom, #051827, #121212 110%)',
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
                    onClick={() => handleRemoveClick()}
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
            {/* <Box>
              <Typography variant="h6" color="gray">
                {returnAmount} LONG and SHORT tokens will be returned and burnt.
              </Typography>
            </Box> */}
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
                <Tooltip title={pool.id}>
                  <Typography fontSize="20px" color="white">
                    {getShortenedAddress(pool.id, 6, 0)}
                  </Typography>
                </Tooltip>
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
            {/* <Typography variant="h3">Your Balance</Typography> */}
            {/* <Stack direction="row" spacing={theme.spacing(4)}>
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
            </Stack> */}
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
                    position tokens in equal proportions. The minimum of your
                    SHORT and LONG token balance determines the collateral
                    amount you can remove.
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
