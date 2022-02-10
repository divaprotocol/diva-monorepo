import { Contract, ethers } from 'ethers'
import {
  Alert,
  Card,
  Collapse,
  Container,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useErcBalance } from '../../hooks/useErcBalance'
import styled from '@emotion/styled'
import { formatEther, formatUnits, parseEther } from 'ethers/lib/utils'
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
  const [decimal, setDecimal] = React.useState(18)
  const [openAlert, setOpenAlert] = React.useState(false)
  const [impliedCollateral, setImpliedCollateral] = React.useState(0)
  const { provider } = useWallet()
  const chainId = provider?.network?.chainId
  const theme = useTheme()

  useEffect(() => {
    if (pool) {
      if (textFieldValue !== '')
        setImpliedCollateral(
          (parseFloat(formatEther(parseEther(textFieldValue))) *
            parseFloat(
              formatUnits(pool.collateralBalanceLongInitial, decimal)
            )) /
            parseFloat(formatEther(pool.supplyLongInitial)) +
            ((parseFloat(formatEther(pool.supplyShortInitial)) /
              parseFloat(formatEther(pool.supplyLongInitial))) *
              parseFloat(formatEther(parseEther(textFieldValue))) *
              parseFloat(
                formatUnits(pool.collateralBalanceShortInitial, decimal)
              )) /
              parseFloat(formatEther(pool.supplyShortInitial))
        )
      const token = new ethers.Contract(
        pool!.collateralToken,
        ERC20,
        provider.getSigner()
      )
      token.decimals().then((decimals: number) => {
        setDecimal(decimals)
      })
    }
    if (
      tokenBalanceLong &&
      parseInt(textFieldValue) > parseInt(tokenBalanceLong!)
    ) {
      setOpenAlert(true)
    } else {
      setOpenAlert(false)
    }
  }, [tokenBalanceLong, textFieldValue, chainId, pool])
  return (
    <Stack direction="column">
      <Card sx={{ borderRadius: '16px', minWidth: theme.spacing(69) }}>
        <Container sx={{ mt: theme.spacing(2) }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ mt: theme.spacing(2) }}>Long Token</Typography>
            <TextField
              inputProps={{ style: { textAlign: 'right' } }}
              value={textFieldValue}
              onChange={(e) => {
                setTextFieldValue(e.target.value)
              }}
            />
          </Stack>
          {tokenBalanceLong ? (
            <>
              <Typography variant="subtitle2" color="text.secondary">
                Your balance: {tokenBalanceLong!}
                <MaxCollateral
                  role="button"
                  onClick={() => {
                    if (tokenBalanceLong != null) {
                      setTextFieldValue(tokenBalanceLong)
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
            <Typography sx={{ mt: theme.spacing(2) }}>Short Token</Typography>
            <Typography sx={{ mt: theme.spacing(2) }}>
              {pool &&
                textFieldValue !== '' &&
                (
                  (parseFloat(formatEther(pool.supplyShortInitial)) /
                    parseFloat(formatEther(pool.supplyLongInitial))) *
                  parseFloat(formatEther(parseEther(textFieldValue)))
                ).toString()}
            </Typography>
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
                  impliedCollateral -
                  parseFloat(formatEther(pool!.redemptionFee)) *
                    impliedCollateral -
                  parseFloat(formatEther(pool!.settlementFee)) *
                    impliedCollateral
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
                  parseEther(textFieldValue)
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

      <Container sx={{ mt: theme.spacing(2), mb: theme.spacing(2) }}>
        <Stack direction="row" justifyContent="space-between">
          <Typography>Current Pool Size</Typography>
          <Typography>
            {pool &&
              parseFloat(formatUnits(pool.collateralBalanceLong, decimal)) +
                parseFloat(
                  formatUnits(pool.collateralBalanceShort, decimal)
                )}{' '}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography>Redemption Fee</Typography>
          <Typography>
            {pool &&
              textFieldValue !== '' &&
              (
                parseFloat(formatEther(pool!.redemptionFee)) * impliedCollateral
              ).toPrecision(4)}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography>Settlement Fee</Typography>
          <Typography>
            {pool &&
              textFieldValue !== '' &&
              (
                parseFloat(formatEther(pool!.settlementFee)) * impliedCollateral
              ).toPrecision(4)}
          </Typography>
        </Stack>
      </Container>
    </Stack>
  )
}
