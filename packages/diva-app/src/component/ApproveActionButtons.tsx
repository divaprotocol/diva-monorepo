import { CircularProgress, Container, Stack, useTheme } from '@mui/material'
import Button from '@mui/material/Button'
import { ethers } from 'ethers'
import { config } from '../constants'
import { formatUnits, parseEther, parseUnits } from 'ethers/lib/utils'
import { fetchPool, selectUserAddress } from '../Redux/appSlice'
import React, { useEffect } from 'react'
import { useConnectionContext } from '../hooks/useConnectionContext'
import ERC20 from '@diva/contracts/abis/erc20.json'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { useAppSelector } from '../Redux/hooks'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import { useDispatch } from 'react-redux'

type Props = {
  collateralTokenAddress: string
  pool?: any
  decimal: number
  textFieldValue: string
  transactionType: 'create' | 'liquidity'
  onTransactionSuccess: () => void
}

export const ApproveActionButtons = ({
  collateralTokenAddress,
  pool,
  decimal,
  textFieldValue,
  transactionType,
  onTransactionSuccess,
}: Props) => {
  const [approveLoading, setApproveLoading] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [approveEnabled, setApproveEnabled] = React.useState(false)
  const [actionEnabled, setActionEnabled] = React.useState(false)
  const [btnName, setBtnName] = React.useState('Add')
  const { provider } = useConnectionContext()
  const account = useAppSelector(selectUserAddress)
  const chainId = provider?.network?.chainId
  const theme = useTheme()
  const dispatch = useDispatch()
  const token = new ethers.Contract(
    collateralTokenAddress,
    ERC20,
    provider?.getSigner()
  )
  const diva = new ethers.Contract(
    config[provider?.network?.chainId].divaAddress,
    DIVA_ABI,
    provider?.getSigner()
  )
  useEffect(() => {
    if (transactionType === 'create') {
      setBtnName('Create')
    } else {
      setBtnName('Add')
    }
    if (textFieldValue !== '' && chainId) {
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
              switch (transactionType) {
                case 'create':
                  diva!
                    .createContingentPool({
                      inflection: parseEther(pool.inflection.toString()),
                      cap: parseEther(pool.cap.toString()),
                      floor: parseEther(pool.floor.toString()),
                      collateralBalanceShort: parseUnits(
                        pool.collateralBalanceShort.toString(),
                        decimal
                      ),
                      collateralBalanceLong: parseUnits(
                        pool.collateralBalanceLong.toString(),
                        decimal
                      ),
                      expiryTime: Math.trunc(pool.expiryTime.getTime() / 1000),
                      supplyPositionToken: parseEther(
                        pool.tokenSupply.toString()
                      ),
                      referenceAsset: pool.referenceAsset.toString(),
                      collateralToken: pool.collateralToken.id.toString(),
                      dataProvider: pool.dataProvider.toString(),
                      capacity: parseEther('0'),
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
                  break
                case 'liquidity':
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
                  break
              }
            }}
            style={{
              maxWidth: theme.spacing(28),
              maxHeight: theme.spacing(5),
              minWidth: theme.spacing(28),
              minHeight: theme.spacing(5),
            }}
          >
            <AddIcon />
            {btnName}
          </Button>
        )}
      </Stack>
    </div>
  )
}