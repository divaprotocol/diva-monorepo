import React, { useState } from 'react'
import { useEffect } from 'react'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { FormLabel, MenuItem, Stack } from '@mui/material'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import { sellLimitOrder } from '../../../Orders/SellLimit'
import {
  ExpectedRateInfoText,
  InfoTooltip,
  LabelStyle,
  SubLabelStyle,
} from './UiStyles'
import { LabelGrayStyle } from './UiStyles'
import { LabelStyleDiv } from './UiStyles'
import { FormDiv } from './UiStyles'
import { FormInput } from './UiStyles'
import { RightSideLabel } from './UiStyles'
import { CreateButtonWrapper } from './UiStyles'
import { LimitOrderExpiryDiv } from './UiStyles'
import { useStyles } from './UiStyles'
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks'
import Web3 from 'web3'
import { Pool } from '../../../lib/queries'
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers/lib/utils'
import { useWallet } from '@web3-ui/hooks'
import ERC20_ABI from '@diva/contracts/abis/erc20.json'
import { totalDecimals } from './OrderHelper'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { BigNumber } from '@0x/utils'
import { useParams } from 'react-router-dom'
import { calcPayoffPerToken } from '../../../Util/calcPayoffPerToken'
import { BigNumber as BigENumber } from '@ethersproject/bignumber/lib/bignumber'
import {
  setBreakEven,
  setIntrinsicValue,
  setMaxPayout,
  setMaxYield,
} from '../../../Redux/Stats'
import { getUnderlyingPrice } from '../../../lib/getUnderlyingPrice'
const web3 = new Web3(Web3.givenProvider)
let accounts: any[]

export default function SellLimit(props: {
  option: Pool
  handleDisplayOrder: () => any
  tokenAddress: string
  exchangeProxy: string
  chainId: number
}) {
  let responseSell = useAppSelector((state) => state.tradeOption.responseSell)
  const wallet = useWallet()
  const classes = useStyles()
  const chainId = wallet?.provider?.network?.chainId || 3
  const exchangeProxyAddress = props.exchangeProxy
  const option = props.option
  const optionTokenAddress = props.tokenAddress
  const [expiry, setExpiry] = React.useState(5)
  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [pricePerOption, setPricePerOption] = React.useState(0.0)
  const [isApproved, setIsApproved] = React.useState(false)
  const [orderBtnDisabled, setOrderBtnDisabled] = React.useState(false)
  const [remainingApprovalAmount, setRemainingApprovalAmount] =
    React.useState(0.0)
  const [allowance, setAllowance] = React.useState(0.0)
  const [makerAccount, setMakerAccount] = React.useState('')
  const [walletBalance, setWalletBalance] = React.useState(0)
  const [existingOrdersAmount, setExistingOrdersAmount] = React.useState(0.0)
  const makerToken = optionTokenAddress
  //const takerToken = option.collateralToken
  const makerTokenContract = new web3.eth.Contract(ERC20_ABI as any, makerToken)
  const params: { tokenType: string } = useParams()
  const [usdPrice, setUsdPrice] = useState('')
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const isLong = window.location.pathname.split('/')[2] === 'long'
  const dispatch = useAppDispatch()
  const handleNumberOfOptions = (value: string) => {
    setNumberOfOptions(parseFloat(value))
  }

  const handlePricePerOptions = (value: string) => {
    setPricePerOption(parseFloat(value))
  }

  const handleFormReset = async () => {
    Array.from(document.querySelectorAll('input')).forEach(
      (input) => (input.value = '')
    )
    setNumberOfOptions(parseFloat('0.0'))
    setPricePerOption(parseFloat('0.0'))
  }

  const approveSellAmount = async (amount) => {
    const amountBigNumber = parseUnits(amount.toString())
    await makerTokenContract.methods
      .approve(exchangeProxyAddress, amountBigNumber)
      .send({ from: makerAccount })

    const allowance = await makerTokenContract.methods
      .allowance(makerAccount, exchangeProxyAddress)
      .call()
    return allowance
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
        let approvedAllowance = await approveSellAmount(amount)
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
        //Allowance for 0x exchange contract [address 0xdef1c] successfully updated to 80 DAI
        alert(
          `Allowance for 0x exchange contract ` +
            { exchangeProxyAddress } +
            ` successfully updated to ` +
            approvedAllowance +
            ` ` +
            params.tokenType
        )
      } else {
        alert('please enter positive balance for approval')
      }
    } else {
      if (walletBalance > 0) {
        const totalAmount = numberOfOptions + existingOrdersAmount
        if (numberOfOptions > remainingApprovalAmount) {
          if (totalAmount > walletBalance) {
            alert('Not sufficiant balance')
          } else {
            const additionalApproval = Number(
              (numberOfOptions - remainingApprovalAmount).toFixed(
                totalDecimals(numberOfOptions, remainingApprovalAmount)
              )
            )
            if (
              confirm(
                'options to sell exceeds approval limit, do you want to approve additional ' +
                  additionalApproval +
                  ' to complete this order?'
              )
            ) {
              setOrderBtnDisabled(true)
              let newAllowance = Number(
                (additionalApproval + allowance).toFixed(
                  totalDecimals(additionalApproval, allowance)
                )
              )
              newAllowance = await approveSellAmount(newAllowance)
              newAllowance = Number(formatUnits(newAllowance.toString(), 18))
              const remainingApproval = Number(
                (newAllowance - existingOrdersAmount).toFixed(
                  totalDecimals(newAllowance, existingOrdersAmount)
                )
              )
              setRemainingApprovalAmount(remainingApproval)
              setAllowance(newAllowance)
              setOrderBtnDisabled(false)
            } else {
              //TBD discuss this case
              setIsApproved(true)
              console.log('nothing done')
            }
          }
        } else {
          const orderData = {
            maker: makerAccount,
            makerToken: optionTokenAddress,
            takerToken: option.collateralToken.id,
            provider: web3,
            isBuy: false,
            nbrOptions: numberOfOptions,
            limitPrice: pricePerOption,
            collateralDecimals: option.collateralToken.decimals,
            orderExpiry: expiry,
            chainId: chainId,
            exchangeProxy: exchangeProxyAddress,
          }
          sellLimitOrder(orderData)
            .then(async (response) => {
              if (response.status === 200) {
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
        alert('No ' + params.tokenType.toUpperCase() + ' avaible to sell')
      }
    }
  }

  const getMakerOrdersTotalAmount = async (maker) => {
    let existingOrderAmount = new BigNumber(0)
    if (responseSell.length == 0) {
      //Double check any limit orders exists
      const rSell: any = await get0xOpenOrders(
        optionTokenAddress,
        option.collateralToken.id,
        chainId
      )
      responseSell = rSell
    }
    responseSell.forEach((data: any) => {
      const order = data.order
      if (maker == order.maker) {
        const metaData = data.metaData
        const remainingTakerAmount = new BigNumber(
          metaData.remainingFillableTakerAmount.toString()
        )
        if (remainingTakerAmount == order.makerAmount) {
          existingOrderAmount = existingOrderAmount.plus(order.makerAmount)
        } else {
          const makerAmount = new BigNumber(order.makerAmount)
          const takerAmount = new BigNumber(order.takerAmount)
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
    accounts = await window.ethereum.enable()
    const makerAccount = accounts[0]
    let allowance = await makerTokenContract.methods
      .allowance(makerAccount, exchangeProxyAddress)
      .call()
    let balance = await makerTokenContract.methods
      .balanceOf(makerAccount)
      .call()
    balance = Number(formatUnits(balance.toString(), 18))
    allowance = Number(formatUnits(allowance.toString(), 18))
    return {
      balance: balance,
      account: makerAccount,
      approvalAmount: allowance,
    }
  }

  useEffect(() => {
    getUnderlyingPrice(option.referenceAsset).then((data) => {
      if (data != null) setUsdPrice(data)
    })
    getOptionsInWallet().then((val) => {
      !Number.isNaN(val.balance)
        ? setWalletBalance(Number(val.balance))
        : setWalletBalance(0)
      setMakerAccount(val.account)
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
    if (usdPrice != '') {
      const { payoffPerLongToken, payoffPerShortToken } = calcPayoffPerToken(
        BigENumber.from(option.floor),
        BigENumber.from(option.inflection),
        BigENumber.from(option.cap),
        BigENumber.from(option.collateralBalanceLongInitial),
        BigENumber.from(option.collateralBalanceShortInitial),
        option.statusFinalReferenceValue === 'Open' &&
          parseEther(usdPrice).gt(0)
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
            ).toFixed(2)
          )
        )
      }
      if (isLong) {
        if (parseEther(String(pricePerOption)).gt(0)) {
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
            BigENumber.from(option.floor).lte(be1) &&
            be1.lte(BigENumber.from(option.inflection))
          ) {
            dispatch(setBreakEven(formatEther(be1)))
          } else if (
            BigENumber.from(option.inflection).lt(be2) &&
            be2.lte(BigENumber.from(option.cap))
          ) {
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
        if (parseEther(String(pricePerOption)).gt(0)) {
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
            BigENumber.from(option.floor).lte(be1) &&
            be1.lte(BigENumber.from(option.inflection))
          ) {
            dispatch(setBreakEven(formatEther(be1)))
          } else if (
            BigENumber.from(option.inflection).lt(be2) &&
            be2.lte(BigENumber.from(option.cap))
          ) {
            dispatch(setBreakEven(formatEther(be2)))
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
  }, [option, pricePerOption, usdPrice])

  return (
    <div>
      <form onSubmit={handleOrderSubmit}>
        <FormDiv>
          <LabelStyleDiv>
            <Stack>
              <LabelStyle>Number</LabelStyle>
              <FormLabel sx={{ color: 'Gray', fontSize: 8, paddingTop: 0.7 }}>
                Remaining allowance: {remainingApprovalAmount}
              </FormLabel>
            </Stack>
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
            <LabelStyle>You Receive</LabelStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 8, paddingTop: 0.7 }}>
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
              <FormLabel sx={{ color: 'Gray', fontSize: 8, paddingTop: 0.7 }}>
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
              <InfoTooltip
                title={<React.Fragment>{ExpectedRateInfoText}</React.Fragment>}
                sx={{ color: 'Gray', fontSize: 2 }}
              >
                <InfoIcon style={{ fontSize: 15, color: 'grey' }} />
              </InfoTooltip>
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
