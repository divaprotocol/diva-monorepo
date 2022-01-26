import {
  Alert,
  Collapse,
  Container,
  Divider,
  IconButton,
  Stack,
  TextField,
  useTheme,
} from '@mui/material'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import React, { useEffect, useState } from 'react'
import { useErcBalance } from '../../hooks/useErcBalance'
import { BigNumber, Contract, ethers } from 'ethers'
import styled from '@emotion/styled'
import ERC20 from '../../abi/ERC20.json'
import { chainIdtoName } from '../../Util/chainIdToName'
import { useWeb3React } from '@web3-react/core'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { withStyles } from '@mui/styles'
const MaxCollateral = styled.u`
  cursor: pointer;
  &:hover {
    color: ${(props) => (props.theme as any).palette.primary.main};
  }
`
const BlackTextTypography = withStyles({
  root: {
    color: '#000000',
  },
})(Typography)

type Props = {
  pool?: any
  diva?: Contract
  symbol?: string
}

export const AddLiquidity = ({ pool, diva, symbol }: Props) => {
  const { chainId, account } = useWeb3React()
  const [textFieldValue, setTextFieldValue] = useState('')
  const theme = useTheme()
  const [openAlert, setOpenAlert] = React.useState(false)
  const tokenBalance = useErcBalance(pool ? pool!.collateralToken : undefined)
  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId!).toLowerCase()
  )

  useEffect(() => {
    if (tokenBalance && parseInt(textFieldValue) > parseInt(tokenBalance!)) {
      setOpenAlert(true)
    } else {
      setOpenAlert(false)
    }
  }, [tokenBalance, textFieldValue])
  return (
    <Stack
      direction="column"
      sx={{
        mt: theme.spacing(2),
      }}
    >
      <Stack direction="row" justifyContent="space-between">
        <Typography sx={{ mt: theme.spacing(2) }}>Amount</Typography>
        <TextField
          value={textFieldValue}
          onChange={(e) => {
            setTextFieldValue(e.target.value)
          }}
        />
      </Stack>
      {tokenBalance ? (
        <>
          <Typography variant="subtitle2" color="text.secondary">
            Your balance: {parseFloat(tokenBalance!).toFixed(4)} {symbol!}{' '}
            <MaxCollateral
              role="button"
              onClick={() => {
                if (tokenBalance != null) {
                  setTextFieldValue(tokenBalance)
                }
              }}
            >
              (Max)
            </MaxCollateral>
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
      <Container
        sx={{
          mt: theme.spacing(2),
          borderRadius: '16px',
          width: theme.spacing(56),
          height: theme.spacing(25),
          backgroundColor: 'lightgray',
          alignSelf: 'center',
        }}
      >
        <Container
          sx={{
            mt: theme.spacing(4),
            paddingRight: theme.spacing(5),
            backgroundColor: 'lightgray',
          }}
        >
          <BlackTextTypography>You Receive</BlackTextTypography>
          <Divider
            variant={'fullWidth'}
            sx={{
              background: 'black',
              mt: theme.spacing(2),
              mb: theme.spacing(2),
            }}
          />
          <Stack direction="row">
            <Container sx={{ minWidth: theme.spacing(12) }}>
              <BlackTextTypography>
                {pool &&
                  textFieldValue !== '' &&
                  (
                    (parseFloat(formatEther(pool.supplyLongInitial)) /
                      (parseFloat(
                        formatEther(pool.collateralBalanceLongInitial)
                      ) +
                        parseFloat(
                          formatEther(pool.collateralBalanceShortInitial)
                        ))) *
                    parseFloat(formatEther(parseEther(textFieldValue)))
                  ).toFixed(4)}
              </BlackTextTypography>
              <BlackTextTypography>Long Tokens</BlackTextTypography>
            </Container>
            <Container sx={{ minWidth: '100px' }}>
              <BlackTextTypography>
                {pool &&
                  textFieldValue !== '' &&
                  (
                    (parseFloat(formatEther(pool.supplyShortInitial)) /
                      (parseFloat(
                        formatEther(pool.collateralBalanceLongInitial)
                      ) +
                        parseFloat(
                          formatEther(pool.collateralBalanceShortInitial)
                        ))) *
                    parseFloat(formatEther(parseEther(textFieldValue)))
                  ).toFixed(4)}
              </BlackTextTypography>
              <BlackTextTypography>Short Tokens</BlackTextTypography>
            </Container>
            <Container sx={{ minWidth: '100px' }}>
              <BlackTextTypography>
                {pool &&
                  textFieldValue !== '' &&
                  (
                    Math.round(
                      ((parseFloat(textFieldValue) * 100) /
                        parseFloat(
                          formatEther(
                            parseEther(textFieldValue).add(
                              pool.collateralBalanceLong.add(
                                pool.collateralBalanceShort
                              )
                            )
                          )
                        ) +
                        Number.EPSILON) *
                        100
                    ) / 100
                  ).toString() + ' %'}
              </BlackTextTypography>
              <BlackTextTypography>Share of Pool</BlackTextTypography>
            </Container>
          </Stack>
        </Container>
      </Container>
      <Container
        sx={{
          mt: '2em',
        }}
      >
        <div
          style={{
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
            disabled={!pool || Date.now() > 1000 * parseInt(pool.expiryDate)}
            onClick={() => {
              const token = new ethers.Contract(
                pool!.collateralToken,
                ERC20,
                provider.getSigner()
              )
              token
                .approve(diva?.address, parseEther(textFieldValue))
                .then((tx: any) => {
                  tx.wait().then(() => {
                    token.allowance(account, diva?.address).then((tx: any) => {
                      diva!.addLiquidity(
                        window.location.pathname.split('/')[1],
                        parseEther(textFieldValue)
                      )
                    })
                  })
                })
            }}
            style={{
              maxWidth: theme.spacing(38),
              maxHeight: theme.spacing(5),
              minWidth: theme.spacing(38),
              minHeight: theme.spacing(5),
            }}
          >
            Add
          </Button>
        </div>
      </Container>
    </Stack>
  )
}
