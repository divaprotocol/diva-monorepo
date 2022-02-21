import {
  Alert,
  Card,
  Collapse,
  Container,
  Divider,
  IconButton,
  Input,
  Stack,
  useTheme,
} from '@mui/material'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import React, { useEffect, useState } from 'react'
import { useErcBalance } from '../../hooks/useErcBalance'
import { Contract, ethers } from 'ethers'
import styled from '@emotion/styled'
import ERC20 from '../../abi/ERC20.json'
import { formatEther, formatUnits, parseEther } from 'ethers/lib/utils'
import { withStyles } from '@mui/styles'
import { useWeb3React } from '@web3-react/core'
import { chainIdtoName } from '../../Util/chainIdtoName'
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
  const { chainId = 3, account } = useWeb3React()
  const [textFieldValue, setTextFieldValue] = useState('')
  const theme = useTheme()
  const [openAlert, setOpenAlert] = React.useState(false)
  const [openCapacityAlert, setOpenCapacityAlert] = React.useState(false)
  const [decimal, setDecimal] = React.useState(18)
  const tokenBalance = useErcBalance(pool ? pool!.collateralToken : undefined)

  const provider = new ethers.providers.Web3Provider(
    window.ethereum,
    chainIdtoName(chainId!).toLowerCase()
  )

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
    }
    if (
      pool! &&
      formatUnits(pool!.capacity, decimal!) !== '0.0' &&
      textFieldValue !== '' &&
      parseFloat(formatEther(parseEther(textFieldValue))) +
        parseFloat(formatUnits(pool!.collateralBalanceLong, decimal!)) +
        parseFloat(formatUnits(pool!.collateralBalanceShort, decimal!)) >
        parseFloat(formatUnits(pool!.capacity, decimal!))
    ) {
      setOpenCapacityAlert(true)
    } else {
      setOpenCapacityAlert(false)
    }
    if (tokenBalance && parseInt(textFieldValue) > parseInt(tokenBalance!)) {
      setOpenAlert(true)
    } else {
      setOpenAlert(false)
    }
  }, [tokenBalance, textFieldValue, pool])
  return (
    <Stack
      direction="column"
      sx={{
        mt: theme.spacing(2),
      }}
    >
      <Card sx={{ minWidth: '100px', borderRadius: '16px' }}>
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
          <Collapse in={openCapacityAlert} sx={{ mt: theme.spacing(2) }}>
            <Alert
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setOpenCapacityAlert(false)
                  }}
                >
                  {'X'}
                </IconButton>
              }
              sx={{ mb: 2 }}
            >
              Exceeds pool capacity
            </Alert>
          </Collapse>
          <Container
            sx={{
              borderRadius: '16px',
              width: theme.spacing(60),
              height: theme.spacing(22),
              backgroundColor: 'lightgray',
              alignSelf: 'center',
            }}
          >
            <Container
              sx={{
                mt: theme.spacing(2),
                paddingTop: theme.spacing(4),
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
                <Container
                  sx={{
                    ml: theme.spacing(-2),
                    minWidth: theme.spacing(18),
                  }}
                >
                  <BlackTextTypography>
                    {pool &&
                      textFieldValue !== '' &&
                      (
                        (parseFloat(formatEther(pool.supplyLongInitial)) /
                          (parseFloat(
                            formatUnits(
                              pool.collateralBalanceLongInitial,
                              decimal
                            )
                          ) +
                            parseFloat(
                              formatUnits(
                                pool.collateralBalanceShortInitial,
                                decimal
                              )
                            ))) *
                        parseFloat(formatEther(parseEther(textFieldValue)))
                      ).toFixed(4)}
                  </BlackTextTypography>
                  <BlackTextTypography>Long Tokens</BlackTextTypography>
                </Container>
                <Container
                  sx={{
                    ml: theme.spacing(-2),
                    minWidth: theme.spacing(18),
                  }}
                >
                  <BlackTextTypography>
                    {pool &&
                      textFieldValue !== '' &&
                      (
                        (parseFloat(formatEther(pool.supplyShortInitial)) /
                          (parseFloat(
                            formatUnits(
                              pool.collateralBalanceLongInitial,
                              decimal
                            )
                          ) +
                            parseFloat(
                              formatUnits(
                                pool.collateralBalanceShortInitial,
                                decimal
                              )
                            ))) *
                        parseFloat(formatEther(parseEther(textFieldValue)))
                      ).toFixed(4)}
                  </BlackTextTypography>
                  <BlackTextTypography>Short Tokens</BlackTextTypography>
                </Container>
                <Container
                  sx={{
                    ml: theme.spacing(-2),
                    minWidth: theme.spacing(20),
                  }}
                >
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
                disabled={
                  !pool || Date.now() > 1000 * parseInt(pool.expiryDate)
                }
                onClick={() => {
                  const token = new ethers.Contract(
                    pool!.collateralToken,
                    ERC20,
                    provider.getSigner()
                  )
                  token
                    .approve(diva?.address, parseEther(textFieldValue))
                    .then((tx: any) => {
                      return tx.wait()
                    })
                    .then(() => {
                      return token.allowance(account, diva?.address)
                    })
                    .then(() => {
                      diva!.addLiquidity(
                        window.location.pathname.split('/')[1],
                        parseEther(textFieldValue)
                      )
                    })
                    .catch((err: any) => console.error(err))
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
        </Container>
      </Card>
    </Stack>
  )
}
