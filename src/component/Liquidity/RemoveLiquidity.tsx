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
} from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useErcBalance } from '../../hooks/useErcBalance'
import styled from '@emotion/styled'
import { formatEther } from 'ethers/lib/utils'
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
}

export const RemoveLiquidity = ({ pool, diva }: Props) => {
  const [textFieldValue, setTextFieldValue] = useState('')
  const [longBalance, setLongBalance] = useState('')
  const [shortBalance, setShortBalance] = useState('')
  const tokenBalanceLong = useErcBalance(pool ? pool!.longToken : undefined)
  const [receiving, setReceiving] = useState('')
  const [openAlert, setOpenAlert] = React.useState(false)
  const { chainId, account } = useWeb3React()
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId!).toLowerCase()
  )
  useEffect(() => {
    if (tokenBalanceLong && textFieldValue > tokenBalanceLong!) {
      setOpenAlert(true)
    } else {
      setOpenAlert(false)
    }
    if (pool) {
      console.log(pool)
      setLongBalance(tokenBalanceLong!)
      if (textFieldValue) {
        setShortBalance(
          formatEther(
            pool.supplyShortInitial
              .div(pool.supplyLongInitial)
              .mul(ethers.utils.parseEther(textFieldValue))
          )
        )
        console.log(pool.collateralToken)
        setReceiving(
          formatEther(
            pool.collateralBalanceShortInitial
              .add(pool.collateralBalanceLongInitial)
              .mul(ethers.utils.parseEther(textFieldValue))
              .div(pool.supplyLongInitial)
              .sub(pool.settlementFee)
              .sub(pool.redemptionFee)
          )
        )
      }
    }
  }, [tokenBalanceLong, textFieldValue, pool])
  return (
    <Stack
      direction="column"
      sx={{
        mt: '2em',
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <Typography sx={{ mt: '1em' }}>Long Token</Typography>
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
            Your Balance: {longBalance}
            <MaxCollateral
              role="button"
              onClick={() => {
                if (tokenBalanceLong != null) {
                  setTextFieldValue(tokenBalanceLong)
                }
              }}
            >
              {' Max'}
            </MaxCollateral>
          </Typography>
        </>
      ) : (
        <Typography variant="subtitle2" color="text.secondary">
          Please connect your wallet
        </Typography>
      )}
      <Stack direction="row" justifyContent="space-between">
        <Typography sx={{ mt: '1em' }}>Short Token</Typography>
        <Typography sx={{ mt: '1em' }}>{shortBalance}</Typography>
      </Stack>
      <Collapse in={openAlert} sx={{ mt: '1em' }}>
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
        <Typography sx={{ mt: '1em' }}>You Receive</Typography>
        <Typography sx={{ mt: '1em' }}>{receiving}</Typography>
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
              .approve(diva?.address, ethers.utils.parseEther(textFieldValue))
              .then((tx: any) => {
                tx.wait().then(() => {
                  longToken.allowance(account, diva?.address)
                })
              })
              .then(() => {
                shortToken
                  .approve(
                    diva?.address,
                    ethers.utils.parseEther(textFieldValue)
                  )
                  .then((tx: any) => {
                    tx.wait().then(() => {
                      shortToken
                        .allowance(account, diva?.address)
                        .then(
                          diva!.removeLiquidity(
                            window.location.pathname.split('/')[1],
                            ethers.utils.parseEther(textFieldValue)
                          )
                        )
                    })
                  })
              })
          }}
          style={{
            maxWidth: '300px',
            maxHeight: '40px',
            minWidth: '300px',
            minHeight: '40px',
          }}
        >
          Remove
        </Button>
      </div>
    </Stack>
  )
}
