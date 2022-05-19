import React, { FormEvent, useState } from 'react'
import { useEffect } from 'react'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { FormLabel, MenuItem, Stack, Tooltip, useTheme } from '@mui/material'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import { buylimitOrder } from '../../../Orders/BuyLimit'
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
import { BigNumber } from '@0x/utils'
// eslint-disable-next-line @typescript-eslint/no-var-requires
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers/lib/utils'
import ERC20_ABI from '@diva/contracts/abis/erc20.json'
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks'
import { totalDecimals } from './OrderHelper'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
import { useParams } from 'react-router-dom'
import { selectChainId, selectUserAddress } from '../../../Redux/appSlice'
import { BigNumber as BigENumber } from '@ethersproject/bignumber/lib/bignumber'
import {
  setBreakEven,
  setMaxYield,
  setIntrinsicValue,
  setMaxPayout,
} from '../../../Redux/Stats'
import { getUnderlyingPrice } from '../../../lib/getUnderlyingPrice'
import { calcPayoffPerToken } from '../../../Util/calcPayoffPerToken'
const web3 = new Web3(Web3.givenProvider)

export default function BuyLimit(props: {
  option: Pool
  handleDisplayOrder: () => any
  tokenAddress: string
  exchangeProxy: string
  chainId: number
  usdPrice: string
}) {
  let responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  const chainId = useAppSelector(selectChainId)
  const userAdress = useAppSelector(selectUserAddress)

  const exchangeProxyAddress = props.exchangeProxy
  const option = props.option
  const makerToken = props.tokenAddress
  const classes = useStyles()
  const [expiry, setExpiry] = React.useState(5)
  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [pricePerOption, setPricePerOption] = React.useState(0.0)
  const [youPay, setYouPay] = React.useState(0.0)
  const [isApproved, setIsApproved] = React.useState(false)
  const [orderBtnDisabled, setOrderBtnDisabled] = React.useState(false)
  const [allowance, setAllowance] = React.useState(0.0)
  const [existingOrdersAmount, setExistingOrdersAmount] = React.useState(0.0)
  const [remainingApprovalAmount, setRemainingApprovalAmount] =
    React.useState(0.0)
  const [collateralBalance, setCollateralBalance] = React.useState(0)
  const takerToken = option.collateralToken.id
  const params: { tokenType: string } = useParams()
  const theme = useTheme()
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const usdPrice = props.usdPrice

  const dispatch = useAppDispatch()

  const isLong = window.location.pathname.split('/')[2] === 'long'
  // TODO: Check why any is required
  const takerTokenContract = new web3.eth.Contract(ERC20_ABI as any, takerToken)

  const handleNumberOfOptions = (value: string) => {
    setNumberOfOptions(parseFloat(value))
    const youPay = pricePerOption > 0 ? pricePerOption * parseFloat(value) : 0
    setYouPay(youPay)
  }

  const handlePricePerOptions = (value: string) => {
    setPricePerOption(parseFloat(value))
    const youPay = numberOfOptions > 0 ? numberOfOptions * parseFloat(value) : 0
    setYouPay(youPay)
  }

  const handleFormReset = async () => {
    Array.from(document.querySelectorAll('input')).forEach(
      (input) => (input.value = '')
    )
    setNumberOfOptions(parseFloat('0.0'))
    setPricePerOption(parseFloat('0.0'))
    setYouPay(parseFloat('0.0'))
    let allowance = await takerTokenContract.methods
      .allowance(userAdress, exchangeProxyAddress)
      .call()
    allowance = Number(formatUnits(allowance))
    const remainingApproval = Number(
      (allowance - existingOrdersAmount).toFixed(
        totalDecimals(allowance, existingOrdersAmount)
      )
    )
    setRemainingApprovalAmount(remainingApproval)
  }

  const handleExpirySelection = (event: SelectChangeEvent<number>) => {
    event.preventDefault()
    setExpiry(
      typeof event.target.value === 'string'
        ? parseInt(event.target.value)
        : event.target.value
    )
  }

  const approveBuyAmount = async (amount) => {
    try {
      const amountBigNumber = parseUnits(amount.toString())
      const approveResponse = await takerTokenContract.methods
        .approve(exchangeProxyAddress, amountBigNumber)
        .send({ from: userAdress })

      if ('events' in approveResponse) {
        return approveResponse.events.Approval.returnValues.value
      } else {
        //in case the approve call does not or delay emit events, read the allowance again
        await new Promise((resolve) => setTimeout(resolve, 4000))
        const approvedAllowance = await takerTokenContract.methods
          .allowance(userAdress, exchangeProxyAddress)
          .call()
        return approvedAllowance
      }
    } catch (error) {
      console.error('error ' + JSON.stringify(error))
      return 'undefined'
    }
  }

  const handleOrderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      if (numberOfOptions > 0) {
        const amount = Number(
          (allowance + youPay).toFixed(totalDecimals(allowance, youPay))
        )
        let collateralAllowance = await approveBuyAmount(amount)
        if (collateralAllowance == 'undefined') {
          alert('Metamask could not finish approval please check gas limit')
        } else {
          collateralAllowance = Number(
            formatUnits(collateralAllowance.toString())
          )
          const remainingApproval = Number(
            (collateralAllowance - existingOrdersAmount).toFixed(
              totalDecimals(collateralAllowance, existingOrdersAmount)
            )
          )
          setRemainingApprovalAmount(remainingApproval)
          setAllowance(collateralAllowance)
          setIsApproved(true)
          alert(
            `Approved allowance of ${youPay}  ${option.collateralToken.symbol}`
          )
        }
      } else {
        alert('Please enter number of options you want to buy')
      }
    } else {
      if (collateralBalance > 0) {
        const totalAmount = youPay + existingOrdersAmount
        if (youPay > remainingApprovalAmount) {
          if (totalAmount > collateralBalance) {
            alert('Not sufficient balance')
          } else {
            const additionalApproval = Number(
              (youPay - remainingApprovalAmount).toFixed(
                totalDecimals(youPay, remainingApprovalAmount)
              )
            )
            if (
              confirm(
                'Required collateral balance exceeds approved limit. Do you want to approve additional ' +
                  additionalApproval +
                  ' ' +
                  option.collateralToken.name +
                  ' to complete this order?'
              )
            ) {
              setOrderBtnDisabled(true)
              let newAllowance = Number(
                (additionalApproval + allowance).toFixed(
                  totalDecimals(additionalApproval, allowance)
                )
              )
              const approvedAllowance = await approveBuyAmount(newAllowance)
              if (approvedAllowance == 'undefined') {
                alert('Metamask could not finish approval.')
                setOrderBtnDisabled(false)
              } else {
                newAllowance = approvedAllowance
                newAllowance = Number(formatUnits(newAllowance.toString()))
                const remainingApproval = Number(
                  (newAllowance - existingOrdersAmount).toFixed(
                    totalDecimals(newAllowance, existingOrdersAmount)
                  )
                )
                setRemainingApprovalAmount(remainingApproval)
                setAllowance(newAllowance)
                setOrderBtnDisabled(false)
                alert(
                  'Additional ' +
                    additionalApproval +
                    ' ' +
                    option.collateralToken.symbol +
                    ' approved please proceed with order'
                )
              }
            } else {
              //TBD discuss this case
              console.log('nothing done')
            }
          }
        } else {
          const orderData = {
            makerAccount: userAdress,
            makerToken: option.collateralToken.id,
            takerToken: makerToken,
            provider: web3,
            isBuy: true,
            chainId,
            nbrOptions: numberOfOptions,
            collateralDecimals: option.collateralToken.decimals,
            limitPrice: pricePerOption,
            orderExpiry: expiry,
            exchangeProxy: exchangeProxyAddress,
          }

          buylimitOrder(orderData)
            .then(async (response) => {
              if (response.status === 200) {
                await new Promise((resolve) => setTimeout(resolve, 2000))
                await props.handleDisplayOrder()
                handleFormReset()
              }
            })
            .catch(function (error) {
              console.error('Error' + error)
            })
        }
      } else {
        alert('No collateral avaible to Buy ' + params.tokenType.toUpperCase())
      }
    }
  }

  const getTakerOrdersTotalAmount = async (taker) => {
    let existingOrdersAmount = new BigNumber(0)
    if (responseBuy.length == 0) {
      //Double check any limit orders exists
      const rBuy = await get0xOpenOrders(
        option.collateralToken.id,
        makerToken,
        chainId
      )
      if (rBuy.length > 0) {
        responseBuy = rBuy
      }
    }
    responseBuy.forEach((data: any) => {
      const order = data.order
      const metaData = data.metaData
      if (taker == order.maker) {
        const remainingFillableTakerAmount = new BigNumber(
          metaData.remainingFillableTakerAmount.toString()
        )
        if (remainingFillableTakerAmount < order.takerAmount) {
          const makerAmount = new BigNumber(order.makerAmount)
          const takerAmount = new BigNumber(order.takerAmount)
          const bidAmount = makerAmount.dividedBy(takerAmount)
          const youPay = bidAmount.multipliedBy(remainingFillableTakerAmount)
          existingOrdersAmount = existingOrdersAmount.plus(youPay)
        } else {
          existingOrdersAmount = existingOrdersAmount.plus(order.makerAmount)
        }
      }
    })
    return Number(
      formatUnits(
        existingOrdersAmount.toString(),
        option.collateralToken.decimals
      )
    )
  }

  const userAddress = useAppSelector(selectUserAddress)
  useEffect(() => {
    const getCollateralInWallet = async () => {
      let allowance = await takerTokenContract.methods
        .allowance(userAdress, exchangeProxyAddress)
        .call()
      allowance = Number(formatUnits(allowance))
      let balance = await takerTokenContract.methods
        .balanceOf(userAdress)
        .call()
      balance = Number(
        formatUnits(balance.toString(), option.collateralToken.decimals)
      )
      return {
        balance: balance,
        account: userAdress,
        approvalAmount: allowance,
      }
    }

    getCollateralInWallet().then((val) => {
      !Number.isNaN(val.balance)
        ? setCollateralBalance(Number(val.balance))
        : setCollateralBalance(0)
      setAllowance(val.approvalAmount)
      setRemainingApprovalAmount(val.approvalAmount)
      val.approvalAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      getTakerOrdersTotalAmount(val.account).then((existingOrdersAmount) => {
        const remainingAmount = Number(
          (val.approvalAmount - existingOrdersAmount).toFixed(
            totalDecimals(val.approvalAmount, existingOrdersAmount)
          )
        )
        setRemainingApprovalAmount(remainingAmount)
        remainingAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
        setExistingOrdersAmount(existingOrdersAmount)
      })
    })
  }, [responseBuy])

  useEffect(() => {
    if (usdPrice != '') {
      const { payoffPerLongToken, payoffPerShortToken } = calcPayoffPerToken(
        BigENumber.from(option.floor),
        BigENumber.from(option.inflection),
        BigENumber.from(option.cap),
        BigENumber.from(option.collateralBalanceLongInitial),
        BigENumber.from(option.collateralBalanceShortInitial),
        option.statusFinalReferenceValue === 'Open' && usdPrice != ''
          ? parseEther(usdPrice)
          : BigENumber.from(option.finalReferenceValue),
        BigENumber.from(option.supplyInitial),
        option.collateralToken.decimals
      )
      if (pricePerOption > 0) {
        dispatch(
          setMaxYield(
            parseFloat(
              formatEther(
                parseEther(maxPayout)
                  .mul(parseEther('1'))
                  .div(parseEther(String(pricePerOption)))
              )
            ).toFixed(2) + 'x'
          )
        )
      } else {
        dispatch(setMaxYield('n/a'))
      }
      if (isLong) {
        if (!isNaN(pricePerOption)) {
          const be1 = parseEther(String(pricePerOption))
            .mul(
              BigENumber.from(option.inflection).sub(
                BigENumber.from(option.floor)
              )
            )
            .mul(BigENumber.from(option.supplyInitial))
            .div(
              BigENumber.from(option.collateralBalanceLongInitial).mul(
                parseUnits('1', 18 - option.collateralToken.decimals)
              )
            )
            .div(parseEther('1'))
            .add(BigENumber.from(option.floor))

          const be2 = parseEther(String(pricePerOption))
            .mul(BigENumber.from(option.supplyInitial))
            .div(parseEther('1'))
            .sub(
              BigENumber.from(option.collateralBalanceLongInitial).mul(
                parseUnits('1', 18 - option.collateralToken.decimals)
              )
            )
            .mul(
              BigENumber.from(option.cap).sub(
                BigENumber.from(option.inflection)
              )
            )
            .div(
              BigENumber.from(option.collateralBalanceShortInitial).mul(
                parseUnits('1', 18 - option.collateralToken.decimals)
              )
            )
            .add(BigENumber.from(option.inflection))
          if (
            parseEther(String(pricePerOption)).gte(
              BigENumber.from(option.collateralBalanceLongInitial)
                .mul(parseUnits('1', option.collateralToken.decimals))
                .div(
                  BigENumber.from(option.collateralBalanceLongInitial).add(
                    BigENumber.from(option.collateralBalanceShortInitial)
                  )
                )
            )
          ) {
            dispatch(setBreakEven(formatEther(be1)))
          } else {
            dispatch(setBreakEven(formatEther(be2)))
          }
        }
        if (
          option.statusFinalReferenceValue === 'Open' &&
          parseFloat(usdPrice) == 0
        ) {
          dispatch(setIntrinsicValue('n/a'))
        } else {
          dispatch(setIntrinsicValue(formatEther(payoffPerLongToken)))
        }
        dispatch(
          setMaxPayout(
            formatEther(
              BigENumber.from(option.collateralBalanceLongInitial)
                .add(BigENumber.from(option.collateralBalanceShortInitial))
                .mul(parseUnits('1', 18 - option.collateralToken.decimals))
                .mul(parseEther('1'))
                .div(BigENumber.from(option.supplyInitial))
            )
          )
        )
      } else {
        if (!isNaN(pricePerOption)) {
          const be1 = parseEther(String(pricePerOption))
            .mul(BigENumber.from(option.supplyInitial))
            .div(parseEther('1'))
            .sub(
              BigENumber.from(option.collateralBalanceShortInitial).mul(
                parseUnits('1', 18 - option.collateralToken.decimals)
              )
            )
            .mul(
              BigENumber.from(option.inflection).sub(
                BigENumber.from(option.floor)
              )
            )
            .div(
              BigENumber.from(option.collateralBalanceLongInitial).mul(
                parseUnits('1', 18 - option.collateralToken.decimals)
              )
            )
            .sub(BigENumber.from(option.inflection))
            .mul(BigENumber.from('-1'))

          const be2 = parseEther(String(pricePerOption))
            .mul(BigENumber.from(option.supplyInitial))
            .div(
              BigENumber.from(option.collateralBalanceShortInitial).mul(
                parseUnits('1', 18 - option.collateralToken.decimals)
              )
            )
            .mul(
              BigENumber.from(option.cap).sub(
                BigENumber.from(option.inflection)
              )
            )
            .div(parseEther('1'))
            .sub(BigENumber.from(option.cap))
            .mul(BigENumber.from('-1'))
          if (
            parseEther(String(pricePerOption)).gte(
              BigENumber.from(option.collateralBalanceLongInitial)
                .mul(parseUnits('1', option.collateralToken.decimals))
                .div(
                  BigENumber.from(option.collateralBalanceLongInitial).add(
                    BigENumber.from(option.collateralBalanceShortInitial)
                  )
                )
            )
          ) {
            dispatch(setBreakEven(formatEther(be2)))
          } else {
            dispatch(setBreakEven(formatEther(be1)))
          }
        }
        if (
          option.statusFinalReferenceValue === 'Open' &&
          parseFloat(usdPrice) == 0
        ) {
          dispatch(setIntrinsicValue('n/a'))
        } else {
          dispatch(setIntrinsicValue(formatEther(payoffPerShortToken)))
        }
        dispatch(
          setMaxPayout(
            formatEther(
              BigENumber.from(option.collateralBalanceLongInitial)
                .add(BigENumber.from(option.collateralBalanceShortInitial))
                .mul(parseUnits('1', 18 - option.collateralToken.decimals))
                .mul(parseEther('1'))
                .div(BigENumber.from(option.supplyInitial))
            )
          )
        )
      }
    }
  }, [option, pricePerOption, usdPrice, existingOrdersAmount])

  return (
    <div>
      <form onSubmit={(event) => handleOrderSubmit(event)}>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>Number</LabelStyle>
          </LabelStyleDiv>
          <FormLabel
            sx={{
              color: 'Gray',
              fontSize: 8,
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
              fontSize: 8,
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
            <Stack>
              <LabelStyle>You Pay </LabelStyle>
              <FormLabel sx={{ color: 'Gray', fontSize: 8, paddingTop: 0.7 }}>
                Remaining allowance: {remainingApprovalAmount}
              </FormLabel>
            </Stack>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 8, paddingTop: 0.6 }}>
                {option.collateralToken.symbol}
              </FormLabel>
              <FormLabel>{youPay.toFixed(4) + ' '}</FormLabel>
            </Stack>
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelGrayStyle>Wallet Balance</LabelGrayStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 8, paddingTop: 0.7 }}>
                {option.collateralToken.symbol}
              </FormLabel>
              <FormLabel>{collateralBalance.toFixed(4)}</FormLabel>
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
                onChange={(event) => handleExpirySelection(event)}
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
