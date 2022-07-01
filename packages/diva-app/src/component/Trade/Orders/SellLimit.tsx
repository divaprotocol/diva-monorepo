import React, { FormEvent, useState } from 'react'
import { useEffect } from 'react'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { FormLabel, MenuItem, Stack, Tooltip } from '@mui/material'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import { sellLimitOrder } from '../../../Orders/SellLimit'
import { ExpectedRateInfoText, LabelStyle } from './UiStyles'
import { LabelGrayStyle } from './UiStyles'
import { LabelStyleDiv } from './UiStyles'
import { FormDiv } from './UiStyles'
import { FormInput } from './UiStyles'
import { RightSideLabel } from './UiStyles'
import { CreateButtonWrapper } from './UiStyles'
import { LimitOrderExpiryDiv } from './UiStyles'
import { useStyles } from './UiStyles'
import { Pool } from '../../../lib/queries'
import Web3 from 'web3'
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import ERC20_ABI from '@diva/contracts/abis/erc20.json'
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks'
import { totalDecimals, convertExponentialToDecimal } from './OrderHelper'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
import { BigNumber } from 'ethers'
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { useParams } from 'react-router-dom'
import { selectChainId, selectUserAddress } from '../../../Redux/appSlice'
import {
  setBreakEven,
  setIntrinsicValue,
  setMaxYield,
  setMaxPayout,
} from '../../../Redux/Stats'
import {
  calcPayoffPerToken,
  calcBreakEven,
} from '../../../Util/calcPayoffPerToken'
import { setResponseSell } from '../../../Redux/TradeOption' // QUESTION: Why is this not in BuyLimit
const web3 = new Web3(Web3.givenProvider)

export default function SellLimit(props: {
  option: Pool
  handleDisplayOrder: () => any
  tokenAddress: string
  exchangeProxy: string
  chainId: number
  usdPrice: string
}) {
  let responseSell = useAppSelector((state) => state.tradeOption.responseSell)

  const userAddress = useAppSelector(selectUserAddress)

  const option = props.option
  const exchangeProxyAddress = props.exchangeProxy
  const makerToken = props.tokenAddress
  const takerToken = option.collateralToken.id
  const makerTokenContract = new web3.eth.Contract(ERC20_ABI as any, makerToken)
  const usdPrice = props.usdPrice
  const decimals = option.collateralToken.decimals
  const positionTokenUnit = parseUnits('1')
  const collateralTokenUnit = parseUnits('1', decimals)

  const classes = useStyles()

  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [pricePerOption, setPricePerOption] = React.useState(0.0)
  const [expiry, setExpiry] = React.useState(5)
  const [existingOrdersAmount, setExistingOrdersAmount] = React.useState(0.0)

  const [isApproved, setIsApproved] = React.useState(false)
  const [orderBtnDisabled, setOrderBtnDisabled] = React.useState(true)
  const [remainingApprovalAmount, setRemainingApprovalAmount] =
    React.useState(0.0)
  const [allowance, setAllowance] = React.useState(0.0)
  const [walletBalance, setWalletBalance] = React.useState(0)

  const params: { tokenType: string } = useParams()
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const isLong = window.location.pathname.split('/')[2] === 'long'
  const dispatch = useAppDispatch()
  const handleNumberOfOptions = (value: string) => {
    if (value !== '') {
      const nbrOptions = parseFloat(value)
      if (!isNaN(nbrOptions) && nbrOptions > 0) {
        setNumberOfOptions(nbrOptions)
        if (isApproved === false) {
          setOrderBtnDisabled(false)
        } else {
          if (pricePerOption > 0) {
            setOrderBtnDisabled(false)
          }
        }
      } else {
        if (orderBtnDisabled == false) {
          setOrderBtnDisabled(true)
        }
      }
    } else {
      setNumberOfOptions(0.0)
      setOrderBtnDisabled(true)
    }
  }

  const handlePricePerOptions = (value: string) => {
    if (value !== '') {
      const pricePerOption = parseFloat(value)
      if (!isNaN(pricePerOption) && pricePerOption > 0) {
        setPricePerOption(pricePerOption)
        if (numberOfOptions > 0) setOrderBtnDisabled(false)
      } else {
        //in case invalid/empty value pricePer option
        setPricePerOption(0.0)
        //disable btn if approval is positive & number of options entered
        if (isApproved == true) {
          if (numberOfOptions > 0) {
            setOrderBtnDisabled(true)
          }
        }
      }
    } else {
      setPricePerOption(0.0)
      if (isApproved == true) {
        if (numberOfOptions > 0) {
          setOrderBtnDisabled(true)
        }
      }
    }
  }

  const handleFormReset = async () => {
    Array.from(document.querySelectorAll('input')).forEach(
      (input) => (input.value = '')
    )
    setNumberOfOptions(parseFloat('0.0'))
    setPricePerOption(parseFloat('0.0'))
    setOrderBtnDisabled(true)
    let approvedAllowance = await makerTokenContract.methods
      .allowance(userAddress, exchangeProxyAddress)
      .call()
    approvedAllowance = Number(formatUnits(approvedAllowance.toString(), 18)) // NOTE: decimals need adjustment when we switch to smart contracts version 1.0.0
    const remainingAmount = Number(
      (approvedAllowance - existingOrdersAmount).toFixed(
        totalDecimals(approvedAllowance, existingOrdersAmount)
      )
    )
    setRemainingApprovalAmount(remainingAmount)
  }

  const approveSellAmount = async (amount) => {
    try {
      const approveResponse = await makerTokenContract.methods
        .approve(exchangeProxyAddress, amount)
        .send({ from: userAddress })
      if ('events' in approveResponse) {
        return approveResponse.events.Approval.returnValues.value
      } else {
        //in case the approve call does not or delay emit events read the allowance again
        await new Promise((resolve) => setTimeout(resolve, 4000))
        const approvedAllowance = await makerTokenContract.methods
          .allowance(userAddress, exchangeProxyAddress)
          .call()
        return approvedAllowance
      }
    } catch (error) {
      console.error('error ' + JSON.stringify(error))
      return 'undefined'
    }
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      if (numberOfOptions > 0) {
        const amount = Number(
          (allowance + numberOfOptions).toFixed(
            totalDecimals(allowance, numberOfOptions)
          )
        )
        // NOTE: decimals will need adjustment to decimals when we switch to contracts version 1.0.0
        let approvedAllowance = await approveSellAmount(
          parseUnits(convertExponentialToDecimal(amount), 18)
        )
        if (approvedAllowance == 'undefined') {
          alert('Metamask could not finish approval.')
        } else {
          approvedAllowance = Number(
            formatUnits(approvedAllowance.toString(), 18)
          )
          const remainingApproval = Number(
            (approvedAllowance - existingOrdersAmount).toFixed(
              totalDecimals(approvedAllowance, existingOrdersAmount)
            )
          )
          setRemainingApprovalAmount(remainingApproval)
          setAllowance(approvedAllowance)
          setIsApproved(true)
          if (pricePerOption <= 0) {
            setOrderBtnDisabled(true)
          }
          alert(
            `Allowance for ` +
              approvedAllowance +
              ` ` +
              params.tokenType.toUpperCase() +
              ` successfully set.`
          )
        }
      } else {
        alert('Please enter a positive amount for approval.')
      }
    } else {
      if (walletBalance > 0) {
        const totalAmount = numberOfOptions + existingOrdersAmount
        if (numberOfOptions > remainingApprovalAmount) {
          if (totalAmount > walletBalance) {
            alert('Not sufficient balance')
          } else {
            const additionalApproval = Number(
              (numberOfOptions - remainingApprovalAmount).toFixed(
                totalDecimals(numberOfOptions, remainingApprovalAmount)
              )
            )
            if (
              confirm(
                'Required collateral balance exceeds approved limit. Do you want to approve an additional ' +
                  +additionalApproval +
                  ' ' +
                  params.tokenType.toUpperCase() +
                  ' to complete this order?'
              )
            ) {
              let newAllowance = Number(
                (additionalApproval + allowance).toFixed(
                  totalDecimals(additionalApproval, allowance)
                )
              )
              const approvedAllowance = await approveSellAmount(
                parseUnits(convertExponentialToDecimal(newAllowance), 18)
              )

              if (approvedAllowance == 'undefined') {
                alert('Metamask could not finish approval.')
              } else {
                newAllowance = approvedAllowance
                newAllowance = Number(formatUnits(newAllowance.toString(), 18))
                const remainingApproval = Number(
                  (newAllowance - existingOrdersAmount).toFixed(
                    totalDecimals(newAllowance, existingOrdersAmount)
                  )
                )
                setRemainingApprovalAmount(remainingApproval)
                setAllowance(newAllowance)
                alert(
                  'Additional ' +
                    additionalApproval +
                    ' ' +
                    params.tokenType.toUpperCase() +
                    ' approved. Please proceed with the order.'
                )
              }
            } else {
              //TBD discuss this case
              setIsApproved(true)
              console.log('nothing done')
            }
          }
        } else {
          const orderData = {
            maker: userAddress,
            provider: web3,
            isBuy: false,
            nbrOptions: numberOfOptions,
            collateralDecimals: decimals,
            makerToken: makerToken,
            takerToken: takerToken,
            limitPrice: pricePerOption,
            orderExpiry: expiry,
            chainId: props.chainId,
            exchangeProxy: exchangeProxyAddress,
          }
          sellLimitOrder(orderData)
            .then(async (response) => {
              if (response?.status === 200) {
                //need to invalidate cache order response since orderbook is updated
                dispatch(setResponseSell([]))
                await new Promise((resolve) => setTimeout(resolve, 2000))
                await props.handleDisplayOrder()
                handleFormReset()
              }
            })
            .catch(function (error) {
              console.error(error)
            })
        }
      } else {
        alert('No ' + params.tokenType.toUpperCase() + ' available to sell.')
      }
    }
  }

  const getMakerOrdersTotalAmount = async (maker) => {
    let existingOrderAmount = BigNumber.from(0)
    if (responseSell.length == 0) {
      //Double check any limit orders exists
      const rSell: any = await get0xOpenOrders(makerToken, taker, props.chainId)
      responseSell = rSell
    }

    responseSell?.forEach((data: any) => {
      const order = data.order
      if (maker == order.maker) {
        const metaData = data.metaData
        const remainingTakerAmount = BigNumber.from(
          metaData.remainingFillableTakerAmount.toString()
        )
        if (remainingTakerAmount == order.makerAmount) {
          existingOrderAmount = existingOrderAmount.plus(order.makerAmount)
        } else {
          const makerAmount = BigNumber.from(order.makerAmount)
          const takerAmount = BigNumber.from(order.takerAmount)
          const askAmount = takerAmount.dividedBy(makerAmount)
          const quantity = remainingTakerAmount.dividedBy(askAmount)
          existingOrderAmount = existingOrderAmount.plus(quantity)
        }
      }
    })
    //return existingOrderAmount
    return Number(formatUnits(existingOrderAmount.toString(), 18))
  }

  const getOptionsInWallet = async () => {
    let allowance = await makerTokenContract.methods
      .allowance(userAddress, exchangeProxyAddress)
      .call()
    let balance = await makerTokenContract.methods.balanceOf(userAddress).call()
    balance = Number(formatUnits(balance.toString(), 18))
    allowance = Number(formatUnits(allowance.toString(), 18))
    return {
      balance: balance,
      account: userAddress,
      approvalAmount: allowance,
    }
  }

  useEffect(() => {
    getOptionsInWallet().then((val) => {
      !Number.isNaN(val.balance)
        ? setWalletBalance(Number(val.balance))
        : setWalletBalance(0)
      setAllowance(val.approvalAmount)
      setRemainingApprovalAmount(val.approvalAmount)
      val.approvalAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      getMakerOrdersTotalAmount(val.account).then((existingOrdersAmount) => {
        setExistingOrdersAmount(existingOrdersAmount)
        const remainingAmount = Number(
          (val.approvalAmount - existingOrdersAmount).toFixed(
            totalDecimals(val.approvalAmount, existingOrdersAmount)
          )
        )
        setRemainingApprovalAmount(remainingAmount)
        remainingAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      })
      //}
    })
  }, [responseSell])

  const handleExpirySelection = (event: SelectChangeEvent<number>) => {
    event.preventDefault()
    setExpiry(
      typeof event.target.value === 'string'
        ? parseInt(event.target.value)
        : event.target.value
    )
  }

  useEffect(() => {
    const { payoffPerLongToken, payoffPerShortToken } = calcPayoffPerToken(
      BigNumber.from(option.floor),
      BigNumber.from(option.inflection),
      BigNumber.from(option.cap),
      BigNumber.from(option.collateralBalanceLongInitial),
      BigNumber.from(option.collateralBalanceShortInitial),
      option.statusFinalReferenceValue === 'Open' && usdPrice != ''
        ? parseUnits(usdPrice)
        : BigNumber.from(option.finalReferenceValue),
      BigNumber.from(option.supplyInitial),
      decimals
    )
    if (pricePerOption > 0) {
      dispatch(
        setMaxYield(
          parseFloat(
            formatUnits(
              parseUnits(maxPayout)
                .mul(parseUnits('1'))
                .div(parseUnits(convertExponentialToDecimal(pricePerOption)))
            )
          ).toFixed(2) + 'x'
        )
      )
    } else {
      dispatch(setMaxYield('n/a'))
    }

    let breakEven: number | string

    if (pricePerOption != 0) {
      breakEven = calcBreakEven(
        pricePerOption,
        option.floor,
        option.inflection,
        option.cap,
        option.collateralBalanceLongInitial,
        option.collateralBalanceShortInitial,
        isLong
      )
    } else {
      breakEven = 'n/a'
    }

    if (breakEven == 'n/a') {
      dispatch(setBreakEven('n/a'))
    } else {
      dispatch(setBreakEven(formatUnits(breakEven)))
    }

    if (isLong) {
      if (option.statusFinalReferenceValue === 'Open' && usdPrice === '') {
        dispatch(setIntrinsicValue('n/a'))
      } else {
        dispatch(setIntrinsicValue(formatUnits(payoffPerLongToken, decimals)))
      }
      dispatch(
        setMaxPayout(
          formatUnits(
            BigNumber.from(option.collateralBalanceLongInitial)
              .add(BigNumber.from(option.collateralBalanceShortInitial))
              .mul(parseUnits('1', 18 - decimals))
              .mul(parseUnits('1'))
              .div(BigNumber.from(option.supplyInitial))
          )
        )
      )
    } else {
      if (option.statusFinalReferenceValue === 'Open' && usdPrice == '') {
        dispatch(setIntrinsicValue('n/a'))
      } else {
        dispatch(setIntrinsicValue(formatUnits(payoffPerShortToken, decimals)))
      }
      dispatch(
        setMaxPayout(
          formatUnits(
            BigNumber.from(option.collateralBalanceLongInitial)
              .add(BigNumber.from(option.collateralBalanceShortInitial))
              .mul(parseUnits('1', 18 - decimals))
              .mul(parseUnits('1'))
              .div(BigNumber.from(option.supplyInitial))
          )
        )
      )
    }
  }, [option, pricePerOption, usdPrice, existingOrdersAmount])

  return (
    <div>
      <form onSubmit={handleOrderSubmit}>
        <FormDiv>
          <LabelStyleDiv>
            <Stack>
              <LabelStyle>Number</LabelStyle>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                Remaining allowance:{' '}
                {remainingApprovalAmount.toString().includes('e')
                  ? remainingApprovalAmount.toExponential(2)
                  : remainingApprovalAmount.toFixed(4)}
              </FormLabel>
            </Stack>
          </LabelStyleDiv>
          <FormLabel
            sx={{
              color: 'Gray',
              fontSize: 11,
              paddingTop: 2.5,
              paddingRight: 1.5,
            }}
          >
            {params.tokenType.toUpperCase() + ' '}
          </FormLabel>
          <FormInput
            type="text"
            onChange={(event) => handleNumberOfOptions(event.target.value)}
          />
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>Price</LabelStyle>
          </LabelStyleDiv>
          <FormLabel
            sx={{
              color: 'Gray',
              fontSize: 11,
              paddingTop: 2.5,
              paddingRight: 1.5,
            }}
          >
            {params.tokenType.toUpperCase() + ' '}
          </FormLabel>
          <FormInput
            type="text"
            onChange={(event) => handlePricePerOptions(event.target.value)}
          />
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>You Receive</LabelStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                {option.collateralToken.symbol + ' '}
              </FormLabel>
              <FormLabel>
                {pricePerOption * numberOfOptions > 0
                  ? (pricePerOption * numberOfOptions).toFixed(4)
                  : (0).toFixed(4)}
              </FormLabel>
            </Stack>
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelGrayStyle>Wallet Balance</LabelGrayStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                {params.tokenType.toUpperCase() + ' '}
              </FormLabel>
              <FormLabel>{walletBalance.toFixed(4)}</FormLabel>
            </Stack>
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <Stack direction={'row'} spacing={0.5}>
              <FormLabel sx={{ color: 'White' }}>Order Expires in</FormLabel>
              <Tooltip
                title={<React.Fragment>{ExpectedRateInfoText}</React.Fragment>}
                sx={{ color: 'Gray', fontSize: 2 }}
              >
                <InfoIcon style={{ fontSize: 15, color: 'grey' }} />
              </Tooltip>
            </Stack>
          </LabelStyleDiv>
          <LimitOrderExpiryDiv>
            <FormControl className={classes.formControl}>
              <Select
                value={expiry}
                onChange={handleExpirySelection}
                displayEmpty
                className={classes.selectEmpty}
                inputProps={{ 'aria-label': 'Without label' }}
              >
                <MenuItem value={5}>
                  <LabelGrayStyle>5 Minutes</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={10}>
                  <LabelGrayStyle>10 Minutes</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={20}>
                  <LabelGrayStyle>20 Minutes</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={30}>
                  <LabelGrayStyle>30 Minutes</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={60}>
                  <LabelGrayStyle>1 Hour</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={60 * 4}>
                  <LabelGrayStyle>4 Hours</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={60 * 12}>
                  <LabelGrayStyle>12 Hours</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={60 * 24}>
                  <LabelGrayStyle>1 Day</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={60 * 24 * 7}>
                  <LabelGrayStyle>7 Days</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={60 * 24 * 14}>
                  <LabelGrayStyle>14 Days</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={60 * 24 * 30}>
                  <LabelGrayStyle>1 Month</LabelGrayStyle>
                </MenuItem>
              </Select>
            </FormControl>
          </LimitOrderExpiryDiv>
        </FormDiv>
        <CreateButtonWrapper />
        <Box marginLeft={isApproved ? 13 : 16} marginBottom={2}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<AddIcon />}
            type="submit"
            value="Submit"
            disabled={orderBtnDisabled}
          >
            {isApproved ? 'Create Order' : 'Approve'}
          </Button>
        </Box>
      </form>
    </div>
  )
}
