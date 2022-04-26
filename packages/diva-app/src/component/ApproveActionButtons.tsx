import { CircularProgress, Container, Stack, useTheme } from '@mui/material'
import Button from '@mui/material/Button'
import { ethers } from 'ethers'
import { config } from '../constants'
import { parseUnits } from 'ethers/lib/utils'
import { fetchPool, selectUserAddress } from '../Redux/appSlice'
import React, { useEffect } from 'react'
import { useErcBalance } from '../hooks/useErcBalance'
import { useConnectionContext } from '../hooks/useConnectionContext'
import ERC20 from '@diva/contracts/abis/erc20.json'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { useAppSelector } from '../Redux/hooks'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import { useDispatch } from 'react-redux'

type Props = {
  collateralTokenAddress?: string
  pool?: any
  decimal?: number
  textFieldValue?: string
  componentName?: string
  onTransactionSuccess?: () => void
}

export const ApproveActionButtons = ({
  collateralTokenAddress,
  pool,
  decimal,
  textFieldValue,
  componentName,
  onTransactionSuccess,
}: Props) => {
  const [approveLoading, setApproveLoading] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [approveEnabled, setApproveEnabled] = React.useState(false)
  const [actionEnabled, setActionEnabled] = React.useState(false)
  const { provider } = useConnectionContext()
  const account = useAppSelector(selectUserAddress)
  const chainId = provider?.network?.chainId
  const theme = useTheme()
  const dispatch = useDispatch()
  useEffect(() => {
    if (textFieldValue !== '' && chainId) {
      const token = new ethers.Contract(
        collateralTokenAddress,
        ERC20,
        provider?.getSigner()
      )
      token.allowance(account, config[chainId]?.divaAddress).then((res) => {
        if (res.lt(parseUnits(textFieldValue, decimal))) {
          setApproveEnabled(true)
          setActionEnabled(false)
        } else {
          setActionEnabled(true)
          setApproveEnabled(false)
        }
      })
    }
  }, [textFieldValue, chainId, pool, approveLoading, actionLoading])

  switch (componentName) {
    case 'liquidity':
      return (
        <div
          style={{
            height: '100px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-evenly',
          }}
        >
          <Stack direction="row" spacing={theme.spacing(2)}>
            {approveLoading ? (
              <Container sx={{ minWidth: theme.spacing(20) }}>
                <CircularProgress />
              </Container>
            ) : (
              <Container>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                  value="Submit"
                  disabled={approveEnabled === false}
                  onClick={() => {
                    setApproveLoading(true)
                    const token = new ethers.Contract(
                      collateralTokenAddress,
                      ERC20,
                      provider.getSigner()
                    )

                    token
                      .approve(
                        config[chainId!].divaAddress,
                        parseUnits(textFieldValue, decimal)
                      )
                      .then((tx: any) => {
                        return tx.wait()
                      })
                      .then(() => {
                        setApproveLoading(false)
                        return token.allowance(
                          account,
                          config[chainId!].divaAddress
                        )
                      })
                      .catch((err: any) => {
                        setApproveLoading(false)
                        console.error(err)
                      })
                  }}
                  style={{
                    maxWidth: theme.spacing(28),
                    maxHeight: theme.spacing(5),
                    minWidth: theme.spacing(28),
                    minHeight: theme.spacing(5),
                  }}
                >
                  <CheckIcon />
                  Approve
                </Button>
              </Container>
            )}
            {actionLoading ? (
              <Container sx={{ minWidth: theme.spacing(20) }}>
                <CircularProgress />
              </Container>
            ) : (
              <Button
                variant="contained"
                color="primary"
                size="large"
                type="submit"
                value="Submit"
                disabled={
                  !pool ||
                  Date.now() > 1000 * parseInt(pool.expiryTime) ||
                  actionEnabled === false
                }
                onClick={() => {
                  setActionLoading(true)
                  const diva = new ethers.Contract(
                    config[chainId!].divaAddress,
                    DIVA_ABI,
                    provider?.getSigner()
                  )

                  diva!
                    .addLiquidity(
                      window.location.pathname.split('/')[1],
                      parseUnits(textFieldValue, decimal)
                    )
                    .then((tx) => {
                      /**
                       * dispatch action to refetch the pool after action
                       */
                      tx.wait()
                        .then(() => {
                          setActionLoading(false)
                          setTimeout(() => {
                            onTransactionSuccess()
                            dispatch(
                              fetchPool({
                                graphUrl:
                                  config[chainId as number].divaSubgraph,
                                poolId: window.location.pathname.split('/')[1],
                              })
                            )
                          }, 5000)
                        })
                        .catch((err: any) => {
                          setActionLoading(false)
                          console.error(err)
                        })
                    })
                    .catch((err: any) => {
                      setActionLoading(false)
                      console.error(err)
                    })
                }}
                style={{
                  maxWidth: theme.spacing(28),
                  maxHeight: theme.spacing(5),
                  minWidth: theme.spacing(28),
                  minHeight: theme.spacing(5),
                }}
              >
                <AddIcon />
                Add
              </Button>
            )}
          </Stack>
        </div>
      )

    case 'create':
      return (
        <div
          style={{
            paddingTop: theme.spacing(6),
            height: '100px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-evenly',
          }}
        >
          <Stack direction="row" spacing={theme.spacing(2)}>
            {approveLoading ? (
              <Container sx={{ minWidth: theme.spacing(20) }}>
                <CircularProgress />
              </Container>
            ) : (
              <Container>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  type="submit"
                  value="Submit"
                  disabled={approveEnabled === false}
                  onClick={() => {
                    setApproveLoading(true)
                    const token = new ethers.Contract(
                      collateralTokenAddress,
                      ERC20,
                      provider.getSigner()
                    )

                    token
                      .approve(
                        config[chainId!].divaAddress,
                        parseUnits(textFieldValue, decimal)
                      )
                      .then((tx: any) => {
                        return tx.wait()
                      })
                      .then(() => {
                        setApproveLoading(false)
                        return token.allowance(
                          account,
                          config[chainId!].divaAddress
                        )
                      })
                      .catch((err: any) => {
                        setApproveLoading(false)
                        console.error(err)
                      })
                  }}
                  style={{
                    maxWidth: theme.spacing(28),
                    maxHeight: theme.spacing(5),
                    minWidth: theme.spacing(28),
                    minHeight: theme.spacing(5),
                  }}
                >
                  <CheckIcon />
                  Approve
                </Button>
              </Container>
            )}
            {actionLoading ? (
              <Container sx={{ minWidth: theme.spacing(20) }}>
                <CircularProgress />
              </Container>
            ) : (
              <Button
                variant="contained"
                color="primary"
                size="large"
                type="submit"
                value="Submit"
                disabled={actionEnabled === false}
                onClick={() => {
                  setActionLoading(true)
                  const diva = new ethers.Contract(
                    config[chainId!].divaAddress,
                    DIVA_ABI,
                    provider?.getSigner()
                  )

                  diva!
                    .createContingentPool({
                      inflection: pool.inflection,
                      cap: pool.cap,
                      floor: pool.floor,
                      collateralBalanceShort: pool.collateralBalanceShort,
                      collateralBalanceLong: pool.collateralBalanceLong,
                      expiryTime: pool.expiryTime.getTime(),
                      supplyPositionToken: pool.tokenSupply,
                      referenceAsset: pool.referenceAsset,
                      collateralToken: pool.collateralToken.id,
                      dataProvider: pool.dataProvider,
                      capacity: 0,
                    })
                    .then((tx) => {
                      /**
                       * dispatch action to refetch the pool after action
                       */
                      tx.wait()
                        .then(() => {
                          setActionLoading(false)
                          setTimeout(() => {
                            onTransactionSuccess()
                            dispatch(
                              fetchPool({
                                graphUrl:
                                  config[chainId as number].divaSubgraph,
                                poolId: window.location.pathname.split('/')[1],
                              })
                            )
                          }, 5000)
                        })
                        .catch((err: any) => {
                          setActionLoading(false)
                          console.error(err)
                        })
                    })
                    .catch((err: any) => {
                      setActionLoading(false)
                      console.error(err)
                    })
                }}
                style={{
                  maxWidth: theme.spacing(28),
                  maxHeight: theme.spacing(5),
                  minWidth: theme.spacing(28),
                  minHeight: theme.spacing(5),
                }}
              >
                <AddIcon />
                Create
              </Button>
            )}
          </Stack>
        </div>
      )
    case 'trade':
      return (
        <Stack direction="row" sx={{ ml: '-9em' }}>
          {approveLoading ? (
            <Container sx={{ minWidth: theme.spacing(10) }}>
              <CircularProgress />
            </Container>
          ) : (
            <Container>
              <Button
                variant="contained"
                color="primary"
                size="large"
                type="submit"
                value="Submit"
                disabled={approveEnabled === false}
                onClick={() => {
                  setApproveLoading(true)
                  const token = new ethers.Contract(
                    collateralTokenAddress,
                    ERC20,
                    provider.getSigner()
                  )

                  token
                    .approve(
                      config[chainId!].divaAddress,
                      parseUnits(textFieldValue, decimal)
                    )
                    .then((tx: any) => {
                      return tx.wait()
                    })
                    .then(() => {
                      setApproveLoading(false)
                      return token.allowance(
                        account,
                        config[chainId!].divaAddress
                      )
                    })
                    .catch((err: any) => {
                      setApproveLoading(false)
                      console.error(err)
                    })
                }}
                style={{
                  maxWidth: theme.spacing(22),
                  maxHeight: theme.spacing(5),
                  minWidth: theme.spacing(22),
                  minHeight: theme.spacing(5),
                }}
              >
                <CheckIcon />
                Approve
              </Button>
            </Container>
          )}
          {actionLoading ? (
            <Container sx={{ minWidth: theme.spacing(20) }}>
              <CircularProgress />
            </Container>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="large"
              type="submit"
              value="Submit"
              disabled={actionEnabled === false}
              onClick={() => {
                onTransactionSuccess()
              }}
              style={{
                maxWidth: theme.spacing(22),
                maxHeight: theme.spacing(5),
                minWidth: theme.spacing(22),
                minHeight: theme.spacing(5),
              }}
            >
              <AddIcon />
              Fill Order
            </Button>
          )}
        </Stack>
      )
  }
}
