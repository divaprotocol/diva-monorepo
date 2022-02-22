import { Contract, ethers } from 'ethers'
import {
  Alert,
  Card,
  Box,
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
import ERC20 from '../../abi/ERC20.json'
import Button from '@mui/material/Button'
import { useWallet } from '@web3-ui/hooks'

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
  diva?: Contract
  symbol?: string
}

export const RemoveLiquidity = ({ pool, diva, symbol }: Props) => {
  const [textFieldValue, setTextFieldValue] = useState('')
  const tokenBalanceLong = useErcBalance(pool ? pool!.longToken : undefined)
  const tokenBalanceShort = useErcBalance(pool ? pool!.shortToken : undefined)
  const [longToken, setLongToken] = React.useState('')
  const [shortToken, setShortToken] = React.useState('')
  const [decimal, setDecimal] = React.useState(18)
  const [openAlert, setOpenAlert] = React.useState(false)
  const [maxCollateral, setMaxCollateral] = React.useState<any>(0)
  const { provider } = useWallet()
  const chainId = provider?.network?.chainId

  const theme = useTheme()

  useEffect(() => {
    if (pool) {
      const token = new ethers.Contract(
        pool!.collateralToken,
        ERC20,
        provider.getSigner()
      )
      token.decimals().then((decimals: number) => {
        setDecimal(decimals)
      })
      if (tokenBalanceLong && tokenBalanceShort && decimal) {
        const colLong =
          ((parseFloat(tokenBalanceLong) *
            (parseFloat(
              formatUnits(pool.collateralBalanceLongInitial, decimal)
            ) +
              parseFloat(formatUnits(pool.collateralBalanceShortInitial)))) /
            parseFloat(formatEther(pool.supplyLongInitial))) *
          (1.0 -
            parseFloat(formatEther(pool.settlementFee)) -
            parseFloat(formatEther(pool.redemptionFee)))
        const colShort =
          ((parseFloat(tokenBalanceShort) *
            (parseFloat(
              formatUnits(pool.collateralBalanceLongInitial, decimal)
            ) +
              parseFloat(formatUnits(pool.collateralBalanceShortInitial)))) /
            parseFloat(formatEther(pool.supplyShortInitial))) *
          (1.0 -
            parseFloat(formatEther(pool.settlementFee)) -
            parseFloat(formatEther(pool.redemptionFee)))
        {
          colLong < colShort
            ? setMaxCollateral(colLong)
            : setMaxCollateral(colShort)
        }
      }
      if (textFieldValue !== '') {
        setLongToken(
          (
            ((parseFloat(
              formatUnits(parseUnits(textFieldValue, decimal), decimal)
            ) /
              (1.0 -
                parseFloat(formatEther(pool.redemptionFee)) -
                parseFloat(formatEther(pool.settlementFee)))) *
              parseFloat(formatEther(pool.supplyLongInitial))) /
            (parseFloat(formatUnits(pool.collateralBalanceLongInitial)) +
              parseFloat(formatUnits(pool.collateralBalanceShortInitial)))
          ).toString()
        )

        setShortToken(
          (
            ((parseFloat(
              formatUnits(parseUnits(textFieldValue, decimal), decimal)
            ) /
              (1.0 -
                parseFloat(formatEther(pool.redemptionFee)) -
                parseFloat(formatEther(pool.settlementFee)))) *
              parseFloat(formatEther(pool.supplyShortInitial))) /
            (parseFloat(formatUnits(pool.collateralBalanceLongInitial)) +
              parseFloat(formatUnits(pool.collateralBalanceShortInitial)))
          ).toString()
        )
      }
    }
    if (
      tokenBalanceLong &&
      textFieldValue !== '' &&
      parseFloat(formatUnits(parseUnits(textFieldValue, decimal), decimal)) >
        maxCollateral!
    ) {
      setOpenAlert(true)
    } else {
      setOpenAlert(false)
    }
  }, [tokenBalanceLong, tokenBalanceShort, textFieldValue, chainId, pool])
  return (
    <Container
      sx={{
        mt: theme.spacing(2),
      }}
    >
      <Card sx={{ borderRadius: '16px' }}>
        <Container sx={{ mt: theme.spacing(2) }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ mt: theme.spacing(2) }}>Amount</Typography>
            <Input
              type="number"
              inputProps={{ style: { textAlign: 'right' } }}
              value={textFieldValue}
              onChange={(e) => {
                const amount = e.target.value
                if (!amount || amount.match(/^\d{1,}(\.\d{0,18})?$/)) {
                  setTextFieldValue(amount)
                }
              }}
            />
          </Stack>
          {tokenBalanceLong ? (
            <>
              <Typography variant="subtitle2" color="text.secondary">
                You can remove up to {maxCollateral} {symbol}
                <MaxCollateral
                  role="button"
                  onClick={() => {
                    if (maxCollateral != 0) {
                      setTextFieldValue(maxCollateral.toString())
                    }
                  }}
                >
                  {' (Max)'}
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
            <Typography sx={{ mt: theme.spacing(2) }}>{longToken}</Typography>
          </Stack>
          {tokenBalanceLong ? (
            <>
              <Typography variant="subtitle2" color="text.secondary">
                Your balance: {tokenBalanceLong}
              </Typography>
            </>
          ) : (
            <Typography variant="subtitle2" color="text.secondary">
              Please connect your wallet
            </Typography>
          )}
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ mt: theme.spacing(2) }}>Short Token</Typography>
            <Typography sx={{ mt: theme.spacing(2) }}>{shortToken}</Typography>
          </Stack>
          {tokenBalanceShort ? (
            <>
              <Typography variant="subtitle2" color="text.secondary">
                Your balance: {tokenBalanceShort}
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
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ mt: theme.spacing(2) }}>
              You Receive (after fees)
            </Typography>
            <Typography sx={{ mt: theme.spacing(2) }}>
              {pool &&
                textFieldValue !== '' &&
                (
                  parseFloat(
                    formatUnits(parseUnits(textFieldValue, decimal), decimal)
                  ) -
                  parseFloat(formatEther(pool!.redemptionFee)) *
                    parseFloat(
                      formatUnits(parseUnits(textFieldValue, decimal), decimal)
                    ) -
                  parseFloat(formatEther(pool!.settlementFee)) *
                    parseFloat(
                      formatUnits(parseUnits(textFieldValue, decimal), decimal)
                    )
                )
                  .toPrecision(4)
                  .toString() +
                  ' ' +
                  symbol}
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
            <Button
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              value="Submit"
              disabled={!pool}
              onClick={() => {
                diva!.removeLiquidity(
                  window.location.pathname.split('/')[1],
                  parseEther(longToken)
                )
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
          </div>
        </Container>
      </Card>
      <Container sx={{ mt: theme.spacing(4), mb: theme.spacing(2) }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography>Current Pool Size</Typography>
          <Typography>
            {pool &&
              parseFloat(formatUnits(pool.collateralBalanceLong, decimal)) +
                parseFloat(
                  formatUnits(pool.collateralBalanceShort, decimal)
                )}{' '}
            {symbol!}{' '}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography>Redemption Fee</Typography>
          <Typography>
            {pool &&
              textFieldValue !== '' &&
              (
                parseFloat(formatEther(pool!.redemptionFee)) *
                parseFloat(
                  formatUnits(parseUnits(textFieldValue, decimal), decimal)
                )
              ).toPrecision(4)}{' '}
            {symbol!}{' '}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography>Settlement Fee</Typography>
          <Typography>
            {pool &&
              textFieldValue !== '' &&
              (
                parseFloat(formatEther(pool!.settlementFee)) *
                parseFloat(
                  formatUnits(parseUnits(textFieldValue, decimal), decimal)
                )
              ).toPrecision(4)}{' '}
            {symbol!}{' '}
          </Typography>
        </Stack>
      </Container>
    </Container>
  )
}
