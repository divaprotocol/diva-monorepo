import { Contract, ethers } from 'ethers'
import {
  Alert,
  Card,
  Collapse,
  Container,
  IconButton,
  Input,
  Stack,
  Typography,
  useTheme,
  CircularProgress,
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
  const [loading, setLoading] = useState(false)
  const [remove, setRemove] = useState('REMOVE')
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
        const longBalance = parseEther(tokenBalanceLong)
        const shortBalance = parseEther(tokenBalanceShort)
        const colLong = longBalance
          .mul(
            pool.collateralBalanceLongInitial.add(
              pool.collateralBalanceShortInitial
            )
          )
          .mul(parseUnits('1', 18 - decimal))

          // )
          .div(pool.supplyLongInitial)
          .mul(
            parseUnits('1', 18).sub(pool.redemptionFee).sub(pool.settlementFee)
          )
          .div(parseEther('1'))
        const colShort = shortBalance
          .mul(
            pool.collateralBalanceLongInitial.add(
              pool.collateralBalanceShortInitial
            )
          )
          .mul(parseUnits('1', 18 - decimal))
          // )
          .div(pool.supplyShortInitial)
          .mul(
            parseUnits('1', 18).sub(pool.redemptionFee).sub(pool.settlementFee)
          )
          .div(parseEther('1'))
        {
          colLong.lt(colShort)
            ? setMaxCollateral(colLong)
            : setMaxCollateral(colShort)
        }
      }
      if (textFieldValue !== '') {
        setLongToken(
          formatEther(
            parseEther(textFieldValue)
              .mul(parseEther('1'))
              .div(
                parseEther('1').sub(pool.redemptionFee).sub(pool.settlementFee)
              )
              .mul(pool.supplyLongInitial)
              .div(
                pool.collateralBalanceLongInitial
                  .add(pool.collateralBalanceShortInitial)
                  .mul(parseUnits('1', 18 - decimal))
              )
          )
        )

        setShortToken(
          formatEther(
            parseEther(textFieldValue)
              .mul(parseEther('1'))
              .div(
                parseEther('1').sub(pool.redemptionFee).sub(pool.settlementFee)
              )
              .mul(pool.supplyShortInitial)
              .div(
                pool.collateralBalanceLongInitial
                  .add(pool.collateralBalanceShortInitial)
                  .mul(parseUnits('1', 18 - decimal))
              )
          )
        )
      }
    }
    if (
      tokenBalanceLong &&
      textFieldValue !== '' &&
      maxCollateral.lt(parseUnits(textFieldValue, decimal))
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
                You can remove up to {formatEther(maxCollateral)} {symbol}
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
                disabled={!pool}
                onClick={() => {
                  setLoading(true)
                  diva!
                    .removeLiquidity(
                      window.location.pathname.split('/')[1],
                      parseEther(longToken)
                    )
                    .catch((err: any) => {
                      console.error(err)
                      setLoading(false)
                    })
                }}
                style={{
                  maxWidth: theme.spacing(38),
                  maxHeight: theme.spacing(5),
                  minWidth: theme.spacing(38),
                  minHeight: theme.spacing(5),
                }}
              >
                {remove}
              </Button>
            )}
          </div>
        </Container>
      </Card>
      <Container sx={{ mt: theme.spacing(4), mb: theme.spacing(2) }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography>Current Pool Size</Typography>
          <Typography>
            {pool &&
              (
                parseFloat(formatUnits(pool.collateralBalanceLong, decimal)) +
                parseFloat(formatUnits(pool.collateralBalanceShort, decimal))
              ).toFixed(4)}{' '}
            {symbol!}{' '}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography>Redemption Fee</Typography>
          <Typography>
            {pool &&
              textFieldValue !== '' &&
              (
                (parseFloat(formatEther(pool!.redemptionFee)) *
                  parseFloat(
                    formatUnits(parseUnits(textFieldValue, decimal), decimal)
                  )) /
                (1.0 -
                  parseFloat(formatEther(pool.redemptionFee)) -
                  parseFloat(formatEther(pool.settlementFee)))
              ).toFixed(4)}{' '}
            {symbol!}{' '}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography>Settlement Fee</Typography>
          <Typography>
            {pool &&
              textFieldValue !== '' &&
              (
                (parseFloat(formatEther(pool!.settlementFee)) *
                  parseFloat(
                    formatUnits(parseUnits(textFieldValue, decimal), decimal)
                  )) /
                (1.0 -
                  parseFloat(formatEther(pool.redemptionFee)) -
                  parseFloat(formatEther(pool.settlementFee)))
              ).toFixed(4)}{' '}
            {symbol!}{' '}
          </Typography>
        </Stack>
      </Container>
    </Container>
  )
}
