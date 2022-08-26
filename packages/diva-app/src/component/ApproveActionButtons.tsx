import { CircularProgress, Container, Stack, useTheme } from '@mui/material'
import Button from '@mui/material/Button'
import { ethers } from 'ethers'
import { config } from '../constants'
import { parseEther, parseUnits } from 'ethers/lib/utils'
import { fetchPool, selectUserAddress } from '../Redux/appSlice'
import React, { useEffect, useState } from 'react'
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
  transactionType: string
  onTransactionSuccess: () => void
  alert?: boolean
}

export const ApproveActionButtons = ({
  collateralTokenAddress,
  pool,
  decimal,
  textFieldValue,
  transactionType,
  onTransactionSuccess,
  alert,
}: Props) => {
  const [approveLoading, setApproveLoading] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [approveEnabled, setApproveEnabled] = React.useState(false)
  const [actionEnabled, setActionEnabled] = React.useState(false)
  const [isPoolCreated, setIsPoolCreated] = React.useState(false)
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
  // const CREATE_POOL_TYPE = {
  //   OfferCreateContingentPool: CREATE_POOL_OFFER_STRUCT,
  // }
  const diva =
    chainId != null
      ? new ethers.Contract(
          config[chainId!].divaAddress,
          DIVA_ABI,
          provider.getSigner()
        )
      : null
  const divaDomain = {
    name: 'DIVA Protocol',
    version: '1',
    chainId,
    // verifyingContract: diva.address,
    verifyingContract: '',
  }
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    if (window.innerWidth < 768) {
      setMobile(true)
    } else {
      setMobile(false)
    }
  }, [])
  useEffect(() => {
    if (transactionType === 'createoffer') {
      setBtnName('Create')
    } else {
      setBtnName('Add')
    }
    if (textFieldValue !== '' && chainId) {
      if (parseFloat(textFieldValue) === 0) {
        setApproveEnabled(false)
        setActionEnabled(false)
      } else {
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
    }
  }, [textFieldValue, chainId, pool, approveLoading, actionLoading])
  return (
    <div
      style={{
        paddingTop: theme.spacing(6),
        height: '100px',
        width: '100%',
        display: 'flex',
        justifyContent: mobile ? 'center' : 'flex-end',
      }}
    >
      <Stack direction="row" spacing={theme.spacing(mobile ? 1 : 3)}>
        {approveLoading ? (
          <Container sx={{ minWidth: theme.spacing(mobile ? 10 : 20) }}>
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
              disabled={
                approveEnabled === false ||
                account == null ||
                textFieldValue === '' ||
                isPoolCreated === true ||
                alert === true
              }
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
                maxWidth: theme.spacing(mobile ? 16 : 26),
                maxHeight: theme.spacing(5),
                minWidth: theme.spacing(mobile ? 16 : 26),
                minHeight: theme.spacing(5),
              }}
            >
              <CheckIcon />
              Approve
            </Button>
          </Container>
        )}
        {actionLoading ? (
          <Container sx={{ minWidth: theme.spacing(mobile ? 10 : 20) }}>
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
              actionEnabled === false ||
              account == null ||
              textFieldValue === '' ||
              isPoolCreated === true ||
              alert === true
            }
            onClick={() => {
              setActionLoading(true)
              switch (transactionType) {
                case 'createpool':
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
                      capacity:
                        pool.capacity === 'Unlimited'
                          ? ethers.constants.MaxUint256
                          : parseUnits(pool.capacity.toString(), decimal),
                    })
                    .then((tx) => {
                      /**
                       * dispatch action to refetch the pool after action
                       */
                      tx.wait()
                        .then(() => {
                          setTimeout(() => {
                            setActionLoading(false)
                            setIsPoolCreated(true)
                            onTransactionSuccess()
                          }, 15000)
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
                case 'createoffer':
                  setApproveLoading(false)
                  // account.signTypedDataAsync(
                  //     divaDomain,CREATE_POOL_TYPE,
                  // )
                  onTransactionSuccess()
                  break
                case 'filloffer':
                  setApproveLoading(false)
                  onTransactionSuccess()
                  break
              }
            }}
            style={{
              maxWidth: theme.spacing(mobile ? 16 : 26),
              maxHeight: theme.spacing(5),
              minWidth: theme.spacing(mobile ? 16 : 26),
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
