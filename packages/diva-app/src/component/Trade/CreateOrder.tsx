import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Add, Check, Tune } from '@mui/icons-material'
import { Box, Button, Stack, TextField, useTheme } from '@mui/material'
import { useParams } from 'react-router-dom'
import {
  approveTransaction,
  createOrder,
  fetchAllowance,
  fetchTokenInfo,
  selectAllowance,
  selectChainId,
  selectOrderView,
  selectPool,
  selectRequestStatus,
  selectTokenBalance,
  selectTokenInfo,
  selectUserAddress,
  setIsBuy,
  setIsLimit,
  setMakerAmount,
  setOrderPrice,
  setOrderView,
  setTakerAmount,
} from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { SmallButton } from '../SmallButton'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { LoadingButton } from '@mui/lab'
import { config } from '../../constants'

export default function CreateOrder() {
  const params: { poolId: string; tokenType: string } = useParams()
  const isLong = params.tokenType === 'long'
  const { provider } = useConnectionContext()
  const chainId = useAppSelector(selectChainId)
  const userAddress = useAppSelector(selectUserAddress)
  const approvalStatus = useAppSelector(
    selectRequestStatus('app/approveTransaction')
  )
  const pool = useAppSelector((state) => selectPool(state, params.poolId))
  const dispatch = useDispatch()
  const token = isLong ? pool.longToken.id : pool.shortToken.id
  const tokenInfo = useAppSelector(selectTokenInfo(token))
  const divaTokenBalance = tokenInfo?.balance
  const allowance0x = useAppSelector(
    selectAllowance(token, config[chainId].zeroXAddress)
  )

  const collateralTokenBalance = useAppSelector(
    selectTokenBalance(pool.collateralToken.id)
  )

  const url = `${params.poolId}/${params.tokenType}`
  const { price, takerAmount, makerAmount, isBuy, isLimit } = useAppSelector(
    selectOrderView(url)
  )
  const makerToken = pool.collateralToken.id
  const youPay = Number(makerAmount)

  const hasEnoughBalance =
    Number(isBuy ? collateralTokenBalance : divaTokenBalance) > youPay
  const hasEnoughAllowance = parseFloat(allowance0x) >= youPay

  const isApprovedDisabled = isNaN(youPay) || youPay <= 0 || !hasEnoughBalance
  const canOrder = hasEnoughBalance && hasEnoughAllowance // should be enabled if we have allowance and balance for the amount

  const onClickCreateOrder = useCallback(() => {
    dispatch(createOrder(url))
  }, [dispatch, url])

  const onClickApprove = useCallback(() => {
    if (!isNaN(youPay)) {
      dispatch(
        approveTransaction({
          tokenAddress: makerToken,
          allowanceAddress: config[chainId].zeroXAddress,
          amount: youPay.toString(),
          provider,
        })
      )
    }
  }, [chainId, dispatch, makerToken, provider, youPay])

  useEffect(() => {
    if (userAddress != null && provider != null) {
      dispatch(fetchTokenInfo({ provider, token }))
      dispatch(
        fetchAllowance({
          provider,
          allowanceAddress: config[chainId].zeroXAddress,
          tokenAddress: token,
        })
      )
      if (pool.collateralToken != null) {
        dispatch(fetchTokenInfo({ provider, token: pool.collateralToken.id }))
      }
    }
  }, [chainId, dispatch, pool, provider, token, userAddress])

  useEffect(() => {
    if (token != null && pool.collateralToken.id != null) {
      dispatch(
        setOrderView({
          data: {
            makerToken: isBuy ? pool.collateralToken.id : token,
            takerToken: isBuy ? token : pool.collateralToken.id,
          },
          key: url,
        })
      )
    }
  }, [token, pool.collateralToken, dispatch, isBuy, url])

  const theme = useTheme()

  return (
    <Box
      sx={{
        border: `1px solid ${theme.palette.grey[800]}`,
        borderRadius: '10px',
      }}
    >
      <Stack padding={3} paddingBottom={5} spacing={4}>
        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row" spacing={2}>
            <SmallButton
              onClick={() => {
                dispatch(setIsBuy({ orderViewKey: url, value: true }))
              }}
              active={isBuy}
            >
              Buy
            </SmallButton>
            <SmallButton
              active={!isBuy}
              onClick={() => {
                dispatch(setIsBuy({ orderViewKey: url, value: false }))
              }}
            >
              Sell
            </SmallButton>
          </Stack>
          <Stack direction="row" spacing={2}>
            <SmallButton
              active={!isLimit}
              onClick={() => {
                dispatch(setIsLimit({ orderViewKey: url, value: false }))
              }}
            >
              Fill
            </SmallButton>
            <SmallButton
              active={isLimit}
              onClick={() => {
                dispatch(setIsLimit({ orderViewKey: url, value: true }))
              }}
            >
              Create
            </SmallButton>
          </Stack>
        </Stack>
        <TextField
          value={takerAmount}
          autoComplete="true"
          onChange={(e) => {
            dispatch(
              setTakerAmount({
                orderViewKey: url,
                value: e.target.value,
              })
            )
          }}
          name="amount"
          label={`You ${isBuy ? 'buy' : 'sell'}`}
          InputProps={{
            endAdornment: (
              <Box sx={{ opacity: 0.7, fontSize: '0.8em', fontWeight: 'bold' }}>
                {isLong ? 'LONG' : 'SHORT'}
              </Box>
            ),
          }}
          helperText={
            divaTokenBalance != null &&
            `You have ${divaTokenBalance} ${
              isLong ? 'LONG' : 'SHORT'
            } tokens in your wallet`
          }
        />
        <TextField
          defaultValue={0}
          name="price"
          value={price}
          disabled={!isLimit}
          InputProps={{
            endAdornment: (
              <Box sx={{ opacity: 0.7, fontSize: '0.8em', fontWeight: 'bold' }}>
                {pool.collateralToken.symbol}
              </Box>
            ),
          }}
          onChange={(e) =>
            dispatch(
              setOrderPrice({
                orderViewKey: url,
                value: e.target.value,
              })
            )
          }
          label="Price per token"
        />
      </Stack>
      <Stack
        padding={3}
        paddingTop={5}
        spacing={4}
        sx={{
          borderTop: `1px solid ${theme.palette.grey[800]}`,
          background:
            'linear-gradient(180deg, #051827 0%, rgba(5, 24, 39, 0) 100%)',
        }}
      >
        <TextField
          label={`You ${isBuy ? 'pay' : 'get'}`}
          value={makerAmount}
          type="text"
          InputProps={{
            endAdornment: (
              <Box sx={{ opacity: 0.7, fontSize: '0.8em', fontWeight: 'bold' }}>
                {pool.collateralToken.symbol}
              </Box>
            ),
          }}
          onChange={(e) =>
            dispatch(
              setMakerAmount({
                orderViewKey: url,
                value: e.target.value,
              })
            )
          }
          helperText={
            collateralTokenBalance != null &&
            `Your have ${collateralTokenBalance} ${pool.collateralToken.symbol} in your wallet`
          }
        />
        <Stack direction="row" justifyContent="space-between">
          <LoadingButton
            size="large"
            variant="contained"
            loading={approvalStatus === 'pending'}
            disabled={isApprovedDisabled}
            onClick={onClickApprove}
            sx={
              !isApprovedDisabled
                ? {
                    background:
                      'linear-gradient(103.17deg, #3393E0 -0.15%, #0059A2 61.59%)',
                  }
                : {}
            }
          >
            <Check sx={{ marginRight: '.2em', marginLeft: '-.3em' }} />
            Approve
          </LoadingButton>
          <Button
            variant="contained"
            disabled={!canOrder}
            size="large"
            onClick={onClickCreateOrder}
          >
            <Add
              sx={{
                marginRight: '.2em',
                marginBottom: '0.05em',
                marginLeft: '-.3em',
              }}
            />
            {isLimit ? 'Create' : `Fill`} order
          </Button>
        </Stack>
        <Stack direction="row" justifyContent="end">
          <SmallButton>
            <Tune /> Advanced Settings
          </SmallButton>
        </Stack>
      </Stack>
    </Box>
  )
}
