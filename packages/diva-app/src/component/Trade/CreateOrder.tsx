import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Add, Check, Tune } from '@mui/icons-material'
import { Box, Button, Stack, TextField, useTheme } from '@mui/material'
import { useParams } from 'react-router-dom'
import {
  fetchBalance,
  selectPool,
  selectTokenBalance,
} from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { SmallButton } from '../SmallButton'
import { useConnectionContext } from '../../hooks/useConnectionContext'

export default function CreateOrder() {
  const params: { poolId: string; tokenType: string } = useParams()
  const [value, setValue] = React.useState(0)
  const isLong = params.tokenType === 'long'
  const { provider } = useConnectionContext()
  const pool = useAppSelector((state) => selectPool(state, params.poolId))
  const dispatch = useDispatch()
  const token = isLong ? pool.longToken.id : pool.shortToken.id
  const tokenBalance = useAppSelector(selectTokenBalance(token))
  const collateralTokenBalance = useAppSelector(
    selectTokenBalance(pool.collateralToken.id)
  )

  useEffect(() => {
    dispatch(fetchBalance({ provider, token }))
    if (pool.collateralToken != null) {
      dispatch(fetchBalance({ provider, token: pool.collateralToken.id }))
    }
  }, [pool])

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
            <SmallButton active>Buy</SmallButton>
            <SmallButton>Sell</SmallButton>
          </Stack>
          <Stack direction="row" spacing={2}>
            <SmallButton>Fill order</SmallButton>
            <SmallButton active>Create order</SmallButton>
          </Stack>
        </Stack>
        <TextField
          defaultValue={0}
          label="You buy"
          helperText={`You have ${tokenBalance} Long tokens in your wallet`}
        />
        <TextField defaultValue={0} label="Price per token" />
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
          defaultValue={0}
          label="You pay"
          helperText={`Your wallet balance is ${collateralTokenBalance} ${pool.collateralToken.symbol}`}
        />
        <Stack direction="row" justifyContent="space-between">
          <Button
            size="large"
            variant="contained"
            sx={{
              background:
                'linear-gradient(103.17deg, #3393E0 -0.15%, #0059A2 61.59%)',
            }}
          >
            <Check sx={{ marginRight: '.2em', marginLeft: '-.3em' }} />
            Approve
          </Button>
          <Button variant="contained" disabled size="large">
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
  )
}
