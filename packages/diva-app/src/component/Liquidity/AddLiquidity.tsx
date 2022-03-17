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
  CircularProgress,
  Box,
} from '@mui/material'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import React, { useEffect, useState } from 'react'
import { useErcBalance } from '../../hooks/useErcBalance'
import { BigNumber, Contract, ethers } from 'ethers'
import styled from '@emotion/styled'
import ERC20 from '@diva/contracts/abis/erc20.json'
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers/lib/utils'
import { withStyles } from '@mui/styles'
import { useWallet } from '@web3-ui/hooks'
import { config } from '../../constants'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
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
}

export const AddLiquidity = ({ pool }: Props) => {
  const [textFieldValue, setTextFieldValue] = useState('')
  const theme = useTheme()
  const [openAlert, setOpenAlert] = useState(false)
  const [openCapacityAlert, setOpenCapacityAlert] = useState(false)
  const [decimal, setDecimal] = useState(18)
  const tokenBalance = useErcBalance(pool ? pool!.collateralToken : undefined)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState(false)
  const [approving, setApproving] = useState('')

  const {
    provider,
    connection: { userAddress: account },
  } = useWallet()
  const chainId = provider?.network?.chainId
  useEffect(() => {
    if (pool) {
      setDecimal(pool.collateralToken.decimals)
    }
    if (
      pool! &&
      formatUnits(parseEther(pool!.capacity), pool.collateralToken.decimals) !==
        '0.0' &&
      textFieldValue !== '' &&
      parseFloat(formatEther(parseEther(textFieldValue))) +
        parseFloat(
          formatUnits(
            parseEther(pool!.collateralBalance),
            pool.collateralToken.decimals
          )
        ) >
        parseFloat(
          formatUnits(parseEther(pool!.capacity), pool.collateralToken.decimals)
        )
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
      {alert ? (
        <>
          <Box pt={2} pb={3}>
            <Alert severity="info">{approving}</Alert>
          </Box>
        </>
      ) : (
        ''
      )}
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
                Your balance: {parseFloat(tokenBalance!).toFixed(4)}{' '}
                {pool!.collateralToken.symbol}{' '}
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
                        (parseFloat(formatEther(pool.supplyInitial)) /
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
                        (parseFloat(formatEther(pool.supplyInitial)) /
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
                        (Math.round(
                          (parseFloat(textFieldValue) * 100) /
                            parseFloat(
                              formatUnits(
                                parseUnits(textFieldValue, decimal).add(
                                  BigNumber.from(pool.collateralBalance)
                                ),
                                decimal
                              )
                            ) +
                            Number.EPSILON
                        ) *
                          100) /
                        100
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
              {loading ? (
                <CircularProgress />
              ) : (
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
                    setLoading(true)
                    const token = new ethers.Contract(
                      pool!.collateralToken,
                      ERC20,
                      provider.getSigner()
                    )
                    token
                      .approve(diva?.address, parseEther(textFieldValue))
                      .then((tx: any) => {
                        setApproving('Approving...')
                        setAlert(true)
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
                        setApproving('Adding Liquidity...')
                      })
                      .then((tx: any) => {
                        console.log('tx status', tx)
                      })
                      .then(setLoading(false))
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
                  ADD
                </Button>
              )}
            </div>
          </Container>
        </Container>
      </Card>
    </Stack>
  )
}
