import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Add, Check, Tune } from '@mui/icons-material'
import { Box, Button, Stack, TextField, useTheme } from '@mui/material'
import { useParams } from 'react-router-dom'
import {
  approveDivaTransaction,
  fetchTokenInfo,
  selectOrderView,
  selectPool,
  selectRequestStatus,
  selectTokenBalance,
  selectTokenInfo,
  selectUserAddress,
  setOrderView,
} from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { SmallButton } from '../SmallButton'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { LoadingButton } from '@mui/lab'

export default function CreateOrder() {
  const params: { poolId: string; tokenType: string } = useParams()
  const isLong = params.tokenType === 'long'
  const { provider } = useConnectionContext()
  const userAddress = useAppSelector(selectUserAddress)
  const approvalStatus = useAppSelector(
    selectRequestStatus('app/approveDivaTransaction')
  )
  const pool = useAppSelector((state) => selectPool(state, params.poolId))
  const dispatch = useDispatch()
  const token = isLong ? pool.longToken.id : pool.shortToken.id
  const { allowance, balance } = useAppSelector(selectTokenInfo(token))
  const collateralTokenBalance = useAppSelector(
    selectTokenBalance(pool.collateralToken.id)
  )

  const url = `${params.poolId}/${params.tokenType}`
  const { price, amount } = useAppSelector(selectOrderView(url))
  const makerToken = pool.collateralToken.id

  const youPay = parseFloat(amount) * parseFloat(price)

  console.log({ token, collateralTokenBalance, amount, allowance })
  const hasEnoughBalance = collateralTokenBalance > amount
  const hasEnoughAllowance = collateralTokenBalance > allowance

  const isApprovedDisabled = isNaN(youPay) || youPay <= 0
  const isOrderButtonDisabled = hasEnoughBalance && hasEnoughAllowance // should be enabled if we have allowance and balance for the amount

  const onClickApprove = useCallback(() => {
    if (!isNaN(youPay)) {
      dispatch(
        approveDivaTransaction({
          token: makerToken,
          amount: youPay,
          provider,
        })
      )
    }
  }, [dispatch, makerToken, provider, youPay])

  useEffect(() => {
    if (userAddress != null) {
      dispatch(fetchTokenInfo({ provider, token }))
      if (pool.collateralToken != null) {
        dispatch(fetchTokenInfo({ provider, token: pool.collateralToken.id }))
      }
    }
  }, [dispatch, pool, provider, token, userAddress])

  const theme = useTheme()
  return (
    <form>
      <Box
        sx={{
          border: `1px solid ${theme.palette.grey[800]}`,
          borderRadius: '10px',
        }}
      >
        <Stack padding={3} paddingBottom={5} spacing={4}>
          <Stack direction="row" justifyContent="space-between">
            <Stack direction="row" spacing={2}>
              <SmallButton active>Buy</SmallButton>
              <SmallButton>Sell</SmallButton>
            </Stack>
            <Stack direction="row" spacing={2}>
              <SmallButton>Fill order</SmallButton>
              <SmallButton active>Create order</SmallButton>
            </Stack>
          </Stack>
          <TextField
            defaultValue={amount}
            value={amount}
            autoComplete="true"
            onChange={(e) => {
              dispatch(
                setOrderView({
                  key: url,
                  data: {
                    amount: e.target.value,
                  },
                })
              )
            }}
            name="amount"
            label="You buy"
            helperText={
              balance != null &&
              `You have ${balance} ${
                isLong ? 'long' : 'short'
              } tokens in your wallet`
            }
          />
          <TextField
            defaultValue={0}
            name="price"
            value={price}
            onChange={(e) =>
              dispatch(
                setOrderView({
                  key: url,
                  data: {
                    price: e.target.value,
                  },
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
            label="You pay"
            disabled
            value={youPay}
            type="number"
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
              disabled={isOrderButtonDisabled}
              size="large"
            >
              <Add
                sx={{
                  marginRight: '.2em',
                  marginBottom: '0.05em',
                  marginLeft: '-.3em',
                }}
              />
              Fill order
            </Button>
          </Stack>
          <Stack direction="row" justifyContent="end">
            <SmallButton>
              <Tune /> Advanced Settings
            </SmallButton>
          </Stack>
        </Stack>
      </Box>
    </form>
  )
}
