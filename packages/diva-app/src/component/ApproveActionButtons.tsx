import { CircularProgress, Container, Stack, useTheme } from '@mui/material'
import Button from '@mui/material/Button'
import { ethers } from 'ethers'
import { config, CREATE_POOL_TYPE } from '../constants'
import {
  formatEther,
  parseEther,
  parseUnits,
  splitSignature,
} from 'ethers/lib/utils'
import { fetchPool, selectUserAddress } from '../Redux/appSlice'
import React, { useEffect, useState } from 'react'
import { useConnectionContext } from '../hooks/useConnectionContext'
import ERC20 from '@diva/contracts/abis/erc20.json'
import DIVA_ABI from '@diva/contracts/abis/diamond.json'
import { useAppSelector } from '../Redux/hooks'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import { useDispatch } from 'react-redux'
import { useCreatePoolFormik } from './CreatePool/formik'
import DIVA712ABI from '../abi/DIVA712ABI.json'

type Props = {
  collateralTokenAddress: string
  pool?: any
  decimal: number
  textFieldValue: string
  transactionType: string
  onTransactionSuccess: () => void
  alert?: boolean
  formik?: ReturnType<typeof useCreatePoolFormik>
}

export const ApproveActionButtons = ({
  collateralTokenAddress,
  pool,
  decimal,
  textFieldValue,
  transactionType,
  onTransactionSuccess,
  alert,
  formik,
}: Props) => {
  const { values } = formik
  const [approveLoading, setApproveLoading] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [approveEnabled, setApproveEnabled] = React.useState(false)
  const [actionEnabled, setActionEnabled] = React.useState(false)
  const [isPoolCreated, setIsPoolCreated] = React.useState(false)
  const [jsonToExport, setJsonToExport] = useState<any>()
  const [btnName, setBtnName] = React.useState('Add')
  const { provider } = useConnectionContext()
  const account = useAppSelector(selectUserAddress)
  const chainId = provider?.network?.chainId
  const theme = useTheme()
  const dispatch = useDispatch()
  const signer = provider?.getSigner()
  const token = new ethers.Contract(collateralTokenAddress, ERC20, signer)
  // const CREATE_POOL_TYPE = {
  //   OfferCreateContingentPool: CREATE_POOL_OFFER_STRUCT,
  // }

  const diva =
    chainId != null
      ? new ethers.Contract(config[chainId!].divaAddress, DIVA_ABI, signer)
      : null

  const eip712Diva = new ethers.Contract(
    '0xb02bbd63545654d55125F98F85F4E691f1a3E207', //Goerli
    DIVA712ABI,
    signer
  )
  const offerCreationStats = {
    maker: account,
    taker:
      values.takerAddress === 'Everyone'
        ? '0x0000000000000000000000000000000000000000'
        : values.takerAddress,
    makerCollateralAmount: parseUnits(
      values.collateralBalance,
      values.collateralToken.decimals
    ).toString(),
    takerCollateralAmount: parseUnits(
      values.collateralBalance,
      values.collateralToken.decimals
    ).toString(),
    makerDirection: true,
    offerExpiry: values.offerDuration,
    minimumTakerFillAmount: parseUnits(
      values.minTakerContribution === 'Fill or Kill'
        ? values.collateralBalance
        : values.minTakerContribution,
      values.collateralToken.decimals
    ).toString(),
    referenceAsset: values.referenceAsset,
    expiryTime: Math.floor(
      new Date(values.expiryTime).getTime() / 1000
    ).toString(),
    floor: parseEther(String(values.floor)).toString(),
    inflection: parseEther('60000').toString(),
    cap: parseEther('80000').toString(),
    gradient: parseEther('0.7').toString(),
    collateralToken: values.collateralToken.id,
    dataProvider: values.dataProvider,
    capacity:
      values.capacity === 'Unlimited'
        ? '115792089237316195423570985008687907853269984665640564039457584007913129639935'
        : values.capacity,
    salt: Date.now().toString(),
  }
  const divaDomain = {
    name: 'DIVA Protocol',
    version: '1',
    chainId,
    verifyingContract: '0xb02bbd63545654d55125F98F85F4E691f1a3E207',
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
    }
    if (transactionType === 'filloffer') {
      setBtnName('Fill')
    } else {
      setBtnName('Add')
    }
    if (textFieldValue !== '' && chainId) {
      if (parseFloat(textFieldValue) === 0) {
        setApproveEnabled(false)
        setActionEnabled(false)
      } else {
        if (transactionType === 'filloffer') {
          token
            .allowance(account, '0xb02bbd63545654d55125F98F85F4E691f1a3E207')
            .then((res) => {
              console.log('allowance', formatEther(res))
              if (res.lt(parseUnits(textFieldValue, decimal))) {
                setApproveEnabled(true)
                setActionEnabled(false)
              } else {
                setActionEnabled(true)
                setApproveEnabled(false)
              }
            })
        } else {
          token.allowance(account, config[chainId]?.divaAddress).then((res) => {
            console.log('allowance', formatEther(res))
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
                switch (transactionType) {
                  case 'createpool' || 'liquidity':
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
                    break
                  case 'filloffer':
                    setApproveLoading(true)

                    token
                      .approve(
                        '0xb02bbd63545654d55125F98F85F4E691f1a3E207',
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
                  console.log(signer)
                  signer
                    ._signTypedData(
                      divaDomain,
                      CREATE_POOL_TYPE,
                      offerCreationStats
                    )
                    .then((signedTypedData) => {
                      const { r, s, v } = splitSignature(signedTypedData)
                      const signature = {
                        v: v,
                        r: r,
                        s: s,
                      }
                      const json = {
                        ...offerCreationStats,
                        signature,
                      }

                      formik.setFieldValue('jsonToExport', json)
                      console.log('json', json)
                      onTransactionSuccess()
                    })
                    .catch((err: any) => {
                      console.log(err)
                    })
                  break
                case 'filloffer':
                  // setApproveLoading(false)
                  console.log('json', values.jsonToExport)
                  eip712Diva
                    .getOfferRelevantStateCreateContingentPool(
                      offerCreationStats,
                      values.signature
                    )
                    .then((res: any) => {
                      console.log('res', res)
                    })
                  eip712Diva
                    .fillOfferCreateContingentPool(
                      values.jsonToExport,
                      values.signature,
                      '10000000000000000000'
                    )
                    .catch((err: any) => {
                      console.log(err)
                    })
                  // .then(onTransactionSuccess())

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
