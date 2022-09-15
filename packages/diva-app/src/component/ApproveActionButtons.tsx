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
async function _checkConditions(
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
      message: 'Offer is invalid because takerCollateralAmount is zero',
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
      message: 'Actually fillable amount is smaller than takerFillAmount',
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
    userAddress != offerCreateContingentPool.taker
  ) {
    return {
      message: 'Offer is reserved for a different address',
      success: false,
    }
  }

  // Confirm that takerFillAmount >= minimumTakerFillAmount **on first fill**. Minimum is not relevant on second fill (i.e. when takerFilledAmount > 0)
  if (
    relevantStateParams.offerInfo.takerFilledAmount == 0 &&
    takerFillAmount.lt(offerCreateContingentPool.minimumTakerFillAmount)
  ) {
    return {
      message: 'TakerFillAmount is smaller than minimumTakerFillAmount',
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
  const { values } = formik
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
  // const CREATE_POOL_TYPE = {
  //   OfferCreateContingentPool: CREATE_POOL_OFFER_STRUCT,
  // }

  const diva =
    chainId != null
      ? new ethers.Contract(config[chainId!].divaAddress, DIVA_ABI, signer)
      : null

  const divaNew = new ethers.Contract(
    config[chainId!].divaAddressNew, //Goerli
    DIVA712ABI,
    signer
  )

  const offerCreationStats = {
    maker: ethers.utils.getAddress(account),
    taker: ethers.utils.getAddress(values.takerAddress),
    makerCollateralAmount: parseUnits(
      values.yourShare.toString(),
      values.collateralToken.decimals
    ).toString(),
    takerCollateralAmount: parseUnits(
      values.takerShare.toString(),
      values.collateralToken.decimals
    ).toString(),
    makerDirection: values.offerDirection === 'Long',
    offerExpiry: values.offerDuration,
    minimumTakerFillAmount: parseUnits(
      values.minTakerContribution === 'Fill Or Kill'
        ? values.takerShare.toString()
        : values.minTakerContribution,
      values.collateralToken.decimals
    ).toString(),
    referenceAsset: values.referenceAsset,
    expiryTime: Math.floor(
      new Date(values.expiryTime).getTime() / 1000
    ).toString(),
    floor: parseEther(String(values.floor)).toString(),
    inflection: parseEther(String(values.inflection)).toString(),
    cap: parseEther(String(values.cap)).toString(),
    gradient: parseEther(String(values.gradient)).toString(),
    collateralToken: values.collateralToken.id,
    dataProvider: values.dataProvider,
    capacity:
      values.capacity === 'Unlimited'
        ? ethers.constants.MaxUint256.toString()
        : parseUnits(
            String(values.capacity),
            values.collateralToken.decimals
          ).toString(),
    salt: Date.now().toString(),
  }

  const divaDomain = {
    name: 'DIVA Protocol',
    version: '1',
    chainId,
    verifyingContract: config[chainId!].divaAddressNew,
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
            .allowance(account, config[chainId!].divaAddressNew)
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
                          config[chainId!].divaAddressNew,
                          parseUnits(textFieldValue, decimal)
                        )
                        .then((tx: any) => {
                          return tx.wait()
                        })
                        .then(() => {
                          setApproveLoading(false)
                          return token.allowance(
                            account,
                            config[chainId!].divaAddressNew
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
                        expiryTime: Math.trunc(
                          pool.expiryTime.getTime() / 1000
                        ),
                        supplyPositionToken: parseEther(
                          pool.tokenSupply.toString()
                        ),
                        referenceAsset: pool.referenceAsset.toString(),
                        collateralToken: pool.collateralToken.id.toString(),
                        dataProvider: pool.dataProvider.toString(),
                        capacity:
                          pool.capacity === 'Unlimited'
                            ? ethers.constants.MaxUint256.toString()
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
                    setApproveLoading(false)
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
                    console.log('json', values.collateralBalance)
                    _checkConditions(
                      divaNew,
                      divaDomain,
                      values.jsonToExport, // offerCreationStats,
                      CREATE_POOL_TYPE,
                      values.signature,
                      account,
                      parseEther(values.collateralBalance)
                    ).then((res) => {
                      if (res.success) {
                        divaNew
                          .fillOfferCreateContingentPool(
                            values.jsonToExport,
                            values.signature,
                            parseEther(values.collateralBalance)
                          )
                          .then((tx) => {
                            tx.wait().then((receipt) => {
                              const typedOfferHash = receipt.events.find(
                                (x: any) => x.event === 'OfferFilled'
                              ).args.typedOfferHash
                              divaNew
                                .getPoolIdByTypedOfferHash(typedOfferHash)
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
        {errorMessage !== 'All good' && (
          <Container sx={{ ml: theme.spacing(34) }}>
            <Alert severity="error">{errorMessage}</Alert>
          </Container>
        )}
      </Stack>
    </div>
  )
}
