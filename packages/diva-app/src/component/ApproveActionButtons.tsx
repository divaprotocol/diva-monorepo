import {
  Alert,
  CircularProgress,
  Container,
  Stack,
  useTheme,
} from '@mui/material'
import Button from '@mui/material/Button'
import { BigNumber, ethers } from 'ethers'
import { config, CREATE_POOL_TYPE } from '../constants'
import { parseUnits, splitSignature } from 'ethers/lib/utils'
import { fetchPool, selectUserAddress } from '../Redux/appSlice'
import React, { useEffect, useState } from 'react'
import { useConnectionContext } from '../hooks/useConnectionContext'
import ERC20 from '../abi/ERC20ABI.json'
import DIVA_ABI from '../abi/DIVAABI.json'
import { useAppSelector } from '../Redux/hooks'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import { useDispatch } from 'react-redux'
import { useCreatePoolFormik } from './CreatePool/formik'
import axios from 'axios'

type Props = {
  collateralTokenAddress: string
  pool?: any
  decimal: number
  textFieldValue: string
  transactionType: string
  onTransactionSuccess: () => void
  alert?: boolean
  formik?: any
}
export async function _checkConditions(
  diva: ethers.Contract,
  divaDomain: {
    name: string
    version: string
    chainId: number
    verifyingContract: string
  },
  offerCreateContingentPool: any,
  type: Record<string, { type: string; name: string }[]>,
  signature: any,
  userAddress: string,
  takerFillAmount: BigNumber
): Promise<{ message: string; success: boolean }> {
  // Get information about the state of the create contingent pool offer
  const relevantStateParams =
    await diva.getOfferRelevantStateCreateContingentPool(
      offerCreateContingentPool,
      signature
    )

  // Confirm that the offer is fillable
  // 0: INVALID, 1: CANCELLED, 2: FILLED, 3: EXPIRED, 4: FILLABLE
  if (relevantStateParams.offerInfo.status === 0) {
    return {
      message: 'Offer is invalid because taker collateral amount is zero',
      success: false,
    }
  }

  if (relevantStateParams.offerInfo.status === 1) {
    return {
      message: 'Offer was cancelled',
      success: false,
    }
  }

  if (relevantStateParams.offerInfo.status === 2) {
    return {
      message: 'Offer is already filled',
      success: false,
    }
  }

  if (relevantStateParams.offerInfo.status === 3) {
    return {
      message: 'Offer is already expired',
      success: false,
    }
  }

  // Confirm that the contingent pool parameters are valid
  if (!relevantStateParams.isValidInputParamsCreateContingentPool) {
    return {
      message: 'Invalid create contingent pool parameters',
      success: false,
    }
  }

  // Check actual fillable amount. The checks above provide more information on why
  // actualTakerFillableAmount is smaller than takerCollateralAmount - takerFilledAmount.
  if (relevantStateParams.actualTakerFillableAmount.lt(takerFillAmount)) {
    return {
      message: 'Entered amount exceeds remaining amount',
      success: false,
    }
  }

  // Confirm that signature matches the offer
  const recoveredAddress = ethers.utils.verifyTypedData(
    divaDomain,
    type,
    offerCreateContingentPool,
    signature
  )
  if (
    recoveredAddress.toLowerCase() !=
    offerCreateContingentPool.maker.toLowerCase()
  ) {
    return {
      message: 'Invalid signature',
      success: false,
    }
  }

  // Check that taker is allowed to fill the offer (relevant if taker specified in the offer is not the zero address)
  if (
    offerCreateContingentPool.taker != ethers.constants.AddressZero &&
    userAddress.toLowerCase() != offerCreateContingentPool.taker.toLowerCase()
  ) {
    return {
      message: 'Offer is reserved for a different account',
      success: false,
    }
  }

  // Confirm that takerFillAmount >= minimumTakerFillAmount **on first fill**. Minimum is not relevant on second fill (i.e. when takerFilledAmount > 0)
  if (
    relevantStateParams.offerInfo.takerFilledAmount == 0 &&
    takerFillAmount.lt(offerCreateContingentPool.minimumTakerFillAmount)
  ) {
    return {
      message: 'Amount is smaller than the required minimum',
      success: false,
    }
  }

  return { message: 'All good', success: true }
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
  const [approveLoading, setApproveLoading] = React.useState(false)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [approveEnabled, setApproveEnabled] = React.useState(false)
  const [actionEnabled, setActionEnabled] = React.useState(false)
  const [isPoolCreated, setIsPoolCreated] = React.useState(false)
  const [errorMessage, setErrorMessage] = useState<string>('All good')
  const [btnName, setBtnName] = React.useState('Add')
  const { provider } = useConnectionContext()
  const account = useAppSelector(selectUserAddress)
  const chainId = provider?.network?.chainId
  const theme = useTheme()
  const dispatch = useDispatch()
  const signer = provider?.getSigner()
  const token = new ethers.Contract(collateralTokenAddress, ERC20, signer)

  const diva =
    chainId != null
      ? new ethers.Contract(config[chainId]?.divaAddress, DIVA_ABI, signer)
      : null

  const divaDomain =
    chainId != null
      ? {
          name: 'DIVA Protocol',
          version: '1',
          chainId,
          verifyingContract: config[chainId!].divaAddress,
        }
      : null
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    if (
      diva != undefined &&
      divaDomain != undefined &&
      formik.values != undefined &&
      account != null
    ) {
      _checkConditions(
        diva,
        divaDomain,
        formik.values.jsonToExport, // offerCreationStats,
        CREATE_POOL_TYPE,
        formik.values.signature,
        account,
        parseUnits(formik.values.yourShare.toString(), decimal)
      ).then((res) => {
        if (!res.success) {
          setErrorMessage(res.message)
        } else {
          setErrorMessage('All good')
        }
      })
    }
  }, [formik.values, account, diva, divaDomain])
  useEffect(() => {
    if (window.innerWidth < 768) {
      setMobile(true)
    } else {
      setMobile(false)
    }
  }, [])
  useEffect(() => {
    if (transactionType === 'filloffer') {
      setBtnName('Fill')
    } else if (transactionType === 'liquidity') {
      setBtnName('Add')
    } else {
      setBtnName('Create')
    }
    if (textFieldValue !== '' && chainId) {
      if (parseFloat(textFieldValue) === 0) {
        setApproveEnabled(false)
        setActionEnabled(false)
      } else {
        if (
          transactionType === 'filloffer' &&
          formik.values.jsonToExport != '{}'
        ) {
          if (
            account.toLowerCase() ===
            formik.values.jsonToExport.maker.toLowerCase()
          ) {
            token
              .allowance(account, config[chainId!].divaAddress)
              .then((res) => {
                if (
                  res.lt(
                    parseUnits(String(formik.values.yourShare), decimal).add(
                      parseUnits(
                        (
                          (formik.values.yourShare * formik.values.makerShare) /
                          (Number(
                            formik.values.jsonToExport.takerCollateralAmount
                          ) /
                            10 ** decimal)
                        ).toFixed(decimal),
                        decimal
                      )
                    )
                  )
                ) {
                  setApproveEnabled(true)
                  setActionEnabled(false)
                } else {
                  setActionEnabled(true)
                  setApproveEnabled(false)
                }
              })
          } else {
            token
              .allowance(account, config[chainId!].divaAddress)
              .then((res) => {
                if (
                  res.lt(parseUnits(String(formik.values.yourShare), decimal))
                ) {
                  setApproveEnabled(true)
                  setActionEnabled(false)
                } else {
                  setActionEnabled(true)
                  setApproveEnabled(false)
                }
              })
          }
        } else {
          if (transactionType === 'createoffer') {
            token
              .allowance(account, config[chainId]?.divaAddress)
              .then((res) => {
                if (
                  res.lt(parseUnits(String(formik.values.yourShare), decimal))
                ) {
                  setApproveEnabled(true)
                  setActionEnabled(false)
                } else {
                  setActionEnabled(true)
                  setApproveEnabled(false)
                }
              })
          } else if (transactionType === 'createpool') {
            token
              .allowance(account, config[chainId]?.divaAddress)
              .then((res) => {
                if (res.lt(parseUnits(textFieldValue, decimal))) {
                  setApproveEnabled(true)
                  setActionEnabled(false)
                } else {
                  setActionEnabled(true)
                  setApproveEnabled(false)
                }
              })
          } else {
            token
              .allowance(account, config[chainId]?.divaAddress)
              .then((res) => {
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
    }
  }, [
    formik?.values.yourShare,
    formik?.values.jsonToExport,
    textFieldValue,
    chainId,
    pool,
    approveLoading,
    actionLoading,
  ])
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
      <Stack>
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
                    case 'liquidity':
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
                    case 'createpool':
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
                    case 'createoffer':
                      setApproveLoading(true)

                      token
                        .approve(
                          config[chainId!].divaAddress,
                          parseUnits(String(formik.values.yourShare), decimal)
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
                          config[chainId!].divaAddress,
                          account.toLowerCase() ===
                            formik.values.jsonToExport.maker.toLowerCase()
                            ? parseUnits(
                                String(formik.values.yourShare),
                                decimal
                              ).add(
                                parseUnits(
                                  String(
                                    (formik.values.yourShare *
                                      formik.values.makerShare) /
                                      (Number(
                                        formik.values.jsonToExport
                                          .takerCollateralAmount
                                      ) /
                                        10 ** decimal)
                                  ),
                                  decimal
                                )
                              )
                            : parseUnits(
                                String(formik.values.yourShare),
                                decimal
                              )
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
                alert === true ||
                errorMessage !== 'All good'
              }
              onClick={() => {
                setActionLoading(true)
                switch (transactionType) {
                  case 'createpool':
                    diva!
                      .createContingentPool({
                        referenceAsset: pool.referenceAsset.toString(),
                        expiryTime: Math.trunc(
                          pool.expiryTime.getTime() / 1000
                        ),
                        floor: parseUnits(pool.floor.toString()),
                        inflection: parseUnits(pool.inflection.toString()),
                        cap: parseUnits(pool.cap.toString()),
                        gradient: parseUnits(pool.gradient.toString(), decimal),
                        collateralAmount: parseUnits(
                          pool.collateralBalance.toString(),
                          decimal
                        ),
                        collateralToken: pool.collateralToken.id.toString(),
                        dataProvider: pool.dataProvider.toString(),
                        capacity:
                          pool.capacity === 'Unlimited'
                            ? ethers.constants.MaxUint256.toString()
                            : parseUnits(pool.capacity.toString(), decimal),
                        longRecipient: ethers.utils.getAddress(
                          pool.longRecipient
                        ),
                        shortRecipient: ethers.utils.getAddress(
                          pool.shortRecipient
                        ),
                        permissionedERC721Token: ethers.constants.AddressZero,
                      })
                      .then((tx) => {
                        /**
                         * dispatch action to refetch the pool after action
                         */
                        tx.wait()
                          .then((receipt) => {
                            formik.setFieldValue(
                              'poolId',
                              receipt.events.find(
                                (x: any) => x.event === 'PoolIssued'
                              ).args.poolId
                            )
                            setActionLoading(false)
                            setIsPoolCreated(true)
                            onTransactionSuccess()
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
                        parseUnits(textFieldValue, decimal),
                        account,
                        account
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
                                  poolId:
                                    window.location.pathname.split('/')[1],
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
                    // eslint-disable-next-line no-case-declarations
                    const now = Date.now().toString()
                    // eslint-disable-next-line no-case-declarations
                    const createOfferStats = {
                      maker:
                        account != null && ethers.utils.getAddress(account),
                      taker: ethers.utils.getAddress(
                        formik.values.takerAddress
                      ),
                      makerCollateralAmount: parseUnits(
                        formik.values.yourShare.toString(),
                        formik.values.collateralToken.decimals
                      ).toString(),
                      takerCollateralAmount: parseUnits(
                        formik.values.takerShare.toString(),
                        formik.values.collateralToken.decimals
                      ).toString(),
                      makerDirection: formik.values.offerDirection === 'Long',
                      offerExpiry: formik.values.offerDuration,
                      minimumTakerFillAmount: parseUnits(
                        formik.values.minTakerContribution.toString() ===
                          formik.values.takerShare.toString()
                          ? formik.values.takerShare.toString()
                          : formik.values.minTakerContribution.toString(),
                        formik.values.collateralToken.decimals
                      ).toString(),
                      referenceAsset: formik.values.referenceAsset,
                      expiryTime: Math.floor(
                        new Date(formik.values.expiryTime).getTime() / 1000
                      ).toString(),
                      floor: parseUnits(String(formik.values.floor)).toString(),
                      inflection: parseUnits(
                        String(formik.values.inflection)
                      ).toString(),
                      cap: parseUnits(String(formik.values.cap)).toString(),
                      gradient: parseUnits(
                        String(formik.values.gradient),
                        decimal
                      ).toString(),
                      collateralToken: formik.values.collateralToken.id,
                      dataProvider: formik.values.dataProvider,
                      capacity:
                        formik.values.capacity === 'Unlimited'
                          ? ethers.constants.MaxUint256.toString()
                          : parseUnits(
                              String(formik.values.capacity),
                              formik.values.collateralToken.decimals
                            ).toString(),
                      permissionedERC721Token: ethers.constants.AddressZero,
                      salt: now,
                    }
                    setApproveLoading(false)
                    signer
                      ._signTypedData(
                        divaDomain,
                        CREATE_POOL_TYPE,
                        createOfferStats
                      )
                      .then((signedTypedData) => {
                        const { r, s, v } = splitSignature(signedTypedData)
                        const signature = {
                          v: v,
                          r: r,
                          s: s,
                        }
                        const json = {
                          ...createOfferStats,
                          signature,
                        }
                        diva
                          .getOfferRelevantStateCreateContingentPool(
                            createOfferStats,
                            signature
                          )
                          .then((res: any) => {
                            const offerHash = res.offerInfo.typedOfferHash
                            const jsonToExport = {
                              ...json,
                              offerHash,
                              chainId,
                              verifyingContract: config[chainId!].divaAddress,
                            }
                            formik.setFieldValue('jsonToExport', jsonToExport)
                            axios
                              .post(
                                config[chainId!].offer +
                                  'create_contingent_pool',
                                jsonToExport
                              )
                              .then((res) => {
                                formik.setFieldValue('offerHash', res.data)
                                onTransactionSuccess()
                              })
                          })
                      })
                      .catch((err: any) => {
                        console.log(err)
                      })
                    break
                  case 'filloffer':
                    _checkConditions(
                      diva,
                      divaDomain,
                      formik.values.jsonToExport, // offerCreationStats,
                      CREATE_POOL_TYPE,
                      formik.values.signature,
                      account,
                      parseUnits(formik.values.yourShare.toString(), decimal)
                    ).then((res) => {
                      if (res.success) {
                        diva
                          .fillOfferCreateContingentPool(
                            formik.values.jsonToExport,
                            formik.values.signature,
                            parseUnits(
                              formik.values.yourShare.toString(),
                              decimal
                            )
                          )
                          .then((tx) => {
                            tx.wait().then((receipt) => {
                              const typedOfferHash = receipt.events.find(
                                (x: any) => x.event === 'OfferFilled'
                              ).args.typedOfferHash
                              diva
                                .getPoolIdByTypedCreateOfferHash(typedOfferHash)
                                .then((poolId: any) => {
                                  formik.setFieldValue('poolId', poolId)
                                })
                              onTransactionSuccess()
                            })
                          })
                          .catch((err: any) => {
                            setActionLoading(false)
                            console.log(err)
                          })
                      } else {
                        setActionLoading(false)
                        setErrorMessage(res.message)
                        console.warn(res.message)
                      }
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
              <AddIcon />
              {btnName}
            </Button>
          )}
        </Stack>
        {errorMessage !== 'All good' && transactionType != 'filloffer' && (
          <Container sx={{ ml: theme.spacing(34) }}>
            <Alert severity="error">{errorMessage}</Alert>
          </Container>
        )}
      </Stack>
    </div>
  )
}
