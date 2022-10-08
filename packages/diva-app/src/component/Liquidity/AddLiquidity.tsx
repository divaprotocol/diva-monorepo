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
  Box,
  TextField,
} from '@mui/material'
import Typography from '@mui/material/Typography'
import React, { useEffect, useState } from 'react'
import { useErcBalance } from '../../hooks/useErcBalance'
import { BigNumber } from 'ethers'
import styled from '@emotion/styled'
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers/lib/utils'
import { selectUserAddress } from '../../Redux/appSlice'
import { useDispatch } from 'react-redux'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { useAppSelector } from '../../Redux/hooks'
import { ApproveActionButtons } from '../ApproveActionButtons'
const MaxCollateral = styled.u`
  cursor: pointer;
  &:hover {
    color: ${(props) => (props.theme as any).palette.primary.main};
  }
`

const BlackTextTypography = (props) => (
  <Typography color="#000">{props.children}</Typography>
)

type Props = {
  pool?: any
}

export const AddLiquidity = ({ pool }: Props) => {
  const [textFieldValue, setTextFieldValue] = useState('')
  const theme = useTheme()
  const [openAlert, setOpenAlert] = React.useState(false)
  const [openExpiredAlert, setOpenExpiredAlert] = React.useState(false)
  const [openCapacityAlert, setOpenCapacityAlert] = React.useState(false)
  const [decimal, setDecimal] = React.useState(18)
  const [loading, setLoading] = React.useState(false)
  const [balanceUpdated, setBalanceUpdated] = React.useState(true)
  const [approving, setApproving] = React.useState('')
  const tokenBalance = useErcBalance(
    pool ? pool!.collateralToken.id : undefined,
    balanceUpdated
  )
  useEffect(() => {
    if (pool) {
      setDecimal(pool.collateralToken.decimals)
      setOpenExpiredAlert(Date.now() > 1000 * parseInt(pool.expiryTime))
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
  }, [textFieldValue, pool, tokenBalance])
  return (
    <>
      <Stack
        direction="column"
        sx={{
          mt: theme.spacing(2),
        }}
      >
        {loading ? (
          <>
            <Box pt={2} pb={3}>
              <Alert severity="info">{approving}</Alert>
            </Box>
          </>
        ) : (
          ''
        )}
        <Collapse in={openExpiredAlert}>
          <Alert
            severity="error"
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setOpenExpiredAlert(false)
                }}
              >
                {'X'}
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            Pool expired. Addition of liquidity is no longer possible
          </Alert>
        </Collapse>
        <Card
          sx={{
            width: '430px',
            border: '1px solid #383838',
            background: theme.palette.background.default,
            borderRadius: '5px',
            borderBottom: 0,
            p: theme.spacing(2),
          }}
        >
          <TextField
            id="outlined-number"
            label="Amount to add"
            type="number"
            sx={{ width: '100%' }}
            InputLabelProps={{
              shrink: true,
            }}
            value={textFieldValue}
            onChange={(e) => {
              const amount = e.target.value
              if (!amount || amount.match(/^\d{1,}(\.\d{0,18})?$/)) {
                setTextFieldValue(amount)
              }
            }}
          />
          {/* <Input
              type="number"
              inputProps={{ style: { textAlign: 'right' } }}
              value={textFieldValue}
              onChange={(e) => {
                const amount = e.target.value
                if (!amount || amount.match(/^\d{1,}(\.\d{0,18})?$/)) {
                  setTextFieldValue(amount)
                }
              }}
            /> */}
          {tokenBalance ? (
            <>
              <Typography variant="h5" color="text.secondary">
                Your have
                <Typography variant="h4" sx={{ display: 'inline' }}>
                  &nbsp; {parseFloat(tokenBalance!).toFixed(4)}{' '}
                  {pool!.collateralToken.symbol} &nbsp;
                </Typography>
                in your wallet.{' '}
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
        </Card>
        <Card
          sx={{
            width: '430px',
            border: '1px solid #1B3448',
            paddingTop: theme.spacing(4),
            background: 'linear-gradient(to bottom, #1B3448, #051827 70%)',
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
              }}
            >
              <BlackTextTypography>
                {pool &&
                  textFieldValue !== '' &&
                  (
                    (parseFloat(formatEther(pool.supplyInitial)) /
                      (parseFloat(
                        formatUnits(pool.collateralBalanceLongInitial, decimal)
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
              }}
            >
              <BlackTextTypography>
                {pool &&
                  textFieldValue !== '' &&
                  (
                    (parseFloat(formatEther(pool.supplyInitial)) /
                      (parseFloat(
                        formatUnits(pool.collateralBalanceLongInitial, decimal)
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
              }}
            >
              <BlackTextTypography>
                {pool &&
                  textFieldValue !== '' &&
                  Number(
                    (100 * parseFloat(textFieldValue)) /
                      (parseFloat(textFieldValue) +
                        parseFloat(
                          formatUnits(
                            BigNumber.from(pool.collateralBalance),
                            decimal
                          )
                        ))
                  ).toFixed(2) + ' %'}
              </BlackTextTypography>
              <BlackTextTypography>Share of Pool</BlackTextTypography>
            </Container>
          </Stack>
          <ApproveActionButtons
            collateralTokenAddress={pool!.collateralToken.id}
            decimal={pool.collateralToken.decimals}
            textFieldValue={textFieldValue}
            transactionType={'liquidity'}
            onTransactionSuccess={() => setBalanceUpdated(!balanceUpdated)}
            alert={openExpiredAlert || openAlert}
          />
        </Card>
      </Stack>
    </>
  )
}
