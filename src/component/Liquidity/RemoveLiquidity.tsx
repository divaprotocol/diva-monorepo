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
import { formatEther, parseEther } from 'ethers/lib/utils'
import { useCoinIcon } from '../../hooks/useCoinIcon'
import ERC20 from '../../abi/ERC20.json'
import Button from '@mui/material/Button'
import { chainIdtoName } from '../../Util/chainIdToName'
import { useWeb3React } from '@web3-react/core'

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
  const [longBalance, setLongBalance] = useState('')
  const [shortBalance, setShortBalance] = useState('')
  const tokenBalanceLong = useErcBalance(pool ? pool!.longToken : undefined)
  const tokenBalanceShort = useErcBalance(pool ? pool!.shortToken : undefined)
  const [receiving, setReceiving] = useState('')
  const [openAlert, setOpenAlert] = React.useState(false)
  const { chainId, account } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId!).toLowerCase()
  )
  const theme = useTheme()
  useEffect(() => {
    if (pool) {
      setLongBalance(tokenBalanceLong!)
      if (textFieldValue) {
        // setShortBalance(
        //   formatEther(
        //     pool.supplyShortInitial
        //       .div(pool.supplyLongInitial)
        //       .mul(parseEther(textFieldValue))
        //   )
        // )
        setShortBalance(
          (
            (parseFloat(formatEther(pool.supplyShortInitial)) /
              parseFloat(formatEther(pool.supplyLongInitial))) *
            parseFloat(formatEther(parseEther(textFieldValue)))
          ).toString()
        )
        setReceiving(
          formatEther(
            parseEther(textFieldValue)
              .mul(pool.collateralBalanceLongInitial)
              .div(pool.supplyLongInitial)
              .add(
                pool.supplyShortInitial
                  .div(pool.supplyLongInitial)
                  .mul(parseEther(textFieldValue))
              )
              .mul(pool.collateralBalanceShortInitial)
              .div(pool.supplyShortInitial)
          )
        )
      }
    }
    if (
      tokenBalanceLong &&
      parseInt(textFieldValue) > parseInt(tokenBalanceLong!)
    ) {
      console.log(textFieldValue > tokenBalanceLong)
      console.log(tokenBalanceLong)
      console.log(pool!.longToken)
      setOpenAlert(true)
    } else {
      setOpenAlert(false)
    }
  }, [tokenBalanceLong, textFieldValue, pool])
  return (
    <Stack
      direction="column"
      sx={{
        mt: theme.spacing(4),
      }}
    >
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
            Your balance: {longBalance}
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
        <Typography sx={{ mt: theme.spacing(2) }}>{shortBalance}</Typography>
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
        <Typography sx={{ mt: theme.spacing(2) }}>You Receive</Typography>
        <Typography sx={{ mt: theme.spacing(2) }}>
          {receiving + ' ' + symbol}
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
            const longToken = new ethers.Contract(
              pool!.longToken,
              ERC20,
              provider.getSigner()
            )
            const shortToken = new ethers.Contract(
              pool!.longToken,
              ERC20,
              provider.getSigner()
            )

            longToken
              .approve(diva?.address, parseEther(textFieldValue))
              .then((tx: any) => {
                // tx.wait().then(() => {
                //   longToken.allowance(account, diva?.address)
                // })
                return tx.wait()
              })
              .then(() => {
                return longToken.allowance(account, diva?.address)
              })
              .then(() => {
                return shortToken.approve(
                  diva?.address,
                  parseEther(textFieldValue)
                )
              })
              .then((tx: any) => {
                return tx.wait()
              })
              .then(() => {
                return shortToken.allowance(account, diva?.address)
              })
              .then(
                diva!.removeLiquidity(
                  window.location.pathname.split('/')[1],
                  parseEther(textFieldValue)
                )
              )
              .catch((err: any) => console.error(err))
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
    </Stack>
  )
}
