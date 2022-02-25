import React, { FormEvent } from 'react'
import { useEffect } from 'react'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { MenuItem } from '@mui/material'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import { buylimitOrder } from '../../../Orders/BuyLimit'
import { LabelStyle, SubLabelStyle } from './UiStyles'
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
import * as qs from 'qs'
import { BigNumber } from '@0x/utils'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')

import ERC20_ABI from '../../../abi/ERC20.json'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useWallet } from '@web3-ui/hooks'
import { useAppSelector } from '../../../Redux/hooks'
import { totalDecimals } from './OrderHelper'
const web3 = new Web3(Web3.givenProvider)
const maxApproval = new BigNumber(2).pow(256).minus(1)
let accounts: any[]

export default function BuyLimit(props: {
  option: Pool
  handleDisplayOrder: () => any
  tokenAddress: string
}) {
  const responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  const wallet = useWallet()
  const chainId = wallet?.provider?.network?.chainId || 3
  const address = contractAddress.getContractAddressesForChainOrThrow(chainId)
  const exchangeProxyAddress = address.exchangeProxy
  const option = props.option
  const makerToken = props.tokenAddress
  const classes = useStyles()
  const [expiry, setExpiry] = React.useState(5)
  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [pricePerOption, setPricePerOption] = React.useState(0.0)
  const [youPay, setYouPay] = React.useState(0.0)
  const [isApproved, setIsApproved] = React.useState(false)
  const [orderBtnDisabled, setOrderBtnDisabled] = React.useState(false)
  const [approvalAmount, setApprovalAmount] = React.useState(0.0)
  const [allowance, setAllowance] = React.useState(0.0)
  const [existingOrdersAmount, setExistingOrdersAmount] = React.useState(0.0)
  const [remainingApprovalAmount, setRemainingApprovalAmount] =
    React.useState(0.0)
  const [takerAccount, setTakerAccount] = React.useState('')
  const [collateralBalance, setCollateralBalance] = React.useState(0)
  const takerToken = option.collateralToken

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

  const handleFormReset = (isApproved) => {
    setIsApproved(isApproved)
    Array.from(document.querySelectorAll('input')).forEach(
      (input) => (input.value = '')
    )
    setNumberOfOptions(parseFloat('0.0'))
    setPricePerOption(parseFloat('0.0'))
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
    const amountBigNumber = parseUnits(amount.toString())
    await takerTokenContract.methods
      .approve(exchangeProxyAddress, amountBigNumber)
      .send({ from: accounts[0] })

    const collateralAllowance = await takerTokenContract.methods
      .allowance(accounts[0], exchangeProxyAddress)
      .call()
    return collateralAllowance
  }

  const handleOrderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      if (numberOfOptions > 0) {
        const amount = Number(
          (allowance + youPay).toFixed(totalDecimals(allowance, youPay))
        )
        if (amount > collateralBalance) {
          alert('expected collateral payment greater than available balance')
        } else {
          let collateralAllowance = await approveBuyAmount(amount)
          collateralAllowance = Number(
            formatUnits(
              collateralAllowance.toString(),
              option.collateralDecimals
            )
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
            `Taker allowance for ${
              option.collateralToken + ' '
            } ${collateralAllowance} successfully set by ${takerAccount}`
          )
        }
      } else {
        alert('Please enter number of options you want to buy')
      }
    } else {
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
              'Required collateral balance exceeds approval limit, do you want to approve additioal ' +
                additionalApproval +
                ' to complete this order'
            )
          ) {
            setOrderBtnDisabled(true)
            let newAllowance = Number(
              (additionalApproval + allowance).toFixed(
                totalDecimals(additionalApproval, allowance)
              )
            )
            newAllowance = await approveBuyAmount(newAllowance)
            newAllowance = Number(
              formatUnits(newAllowance.toString(), option.collateralDecimals)
            )
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
            console.log('nothing done')
          }
        }
      } else {
        const orderData = {
          makerAccount: accounts[0],
          makerToken: option.collateralToken,
          takerToken: makerToken,
          provider: web3,
          isBuy: true,
          chainId,
          nbrOptions: numberOfOptions,
          collateralDecimals: option.collateralDecimals,
          limitPrice: pricePerOption,
          orderExpiry: expiry,
        }

        buylimitOrder(orderData)
          .then(async (response) => {
            if (response.status === 200) {
              let collateralAllowance = await takerTokenContract.methods
                .allowance(accounts[0], exchangeProxyAddress)
                .call()
              collateralAllowance = Number(
                formatUnits(
                  collateralAllowance.toString(),
                  option.collateralDecimals
                )
              )
              await new Promise((resolve) => setTimeout(resolve, 2000))
              const ordersData = await props.handleDisplayOrder()
              let totalBuyAmount = 0
              const buyOrders = ordersData.responseBuy
              buyOrders.forEach((data: any) => {
                const order = data.order
                if (takerAccount == order.maker) {
                  const orderTakerAmount = Number(
                    formatUnits(order.makerAmount, option.collateralDecimals)
                  )
                  totalBuyAmount = Number(
                    (totalBuyAmount + orderTakerAmount).toFixed(
                      totalDecimals(totalBuyAmount, orderTakerAmount)
                    )
                  )
                }
              })
              collateralAllowance = Number(
                (collateralAllowance - totalBuyAmount).toFixed(
                  totalDecimals(collateralAllowance, totalBuyAmount)
                )
              )
              setRemainingApprovalAmount(collateralAllowance)
              const isApproved = collateralAllowance <= 0 ? false : true
              handleFormReset(isApproved)
              setExistingOrdersAmount(totalBuyAmount)
            }
          })
          .catch(function (error) {
            console.error('Error' + error)
          })
      }
    }
  }

  const getTakerOrdersTotalAmount = async (taker) => {
    let existingOrderAmount = 0
    if (responseBuy.length > 0) {
      responseBuy.forEach((data: any) => {
        const order = data.order
        if (taker == order.maker) {
          existingOrderAmount += Number(
            formatUnits(order.makerAmount, option.collateralDecimals)
          )
        }
      })
    }
    return existingOrderAmount
  }

  useEffect(() => {
    const getCollateralInWallet = async () => {
      accounts = await window.ethereum.enable()
      const takerAccount = accounts[0]
      let allowance = await takerTokenContract.methods
        .allowance(takerAccount, exchangeProxyAddress)
        .call()
      allowance = Number(formatUnits(allowance, option.collateralDecimals))
      let balance = await takerTokenContract.methods
        .balanceOf(takerAccount)
        .call()
      balance = Number(
        formatUnits(balance.toString(), option.collateralDecimals)
      )
      return {
        balance: balance,
        account: takerAccount,
        approvalAmount: allowance,
      }
    }

    getCollateralInWallet().then((val) => {
      !Number.isNaN(val.balance)
        ? setCollateralBalance(Number(val.balance))
        : setCollateralBalance(0)
      setTakerAccount(val.account)
      getTakerOrdersTotalAmount(val.account).then((existingOrdersAmount) => {
        setExistingOrdersAmount(existingOrdersAmount)
        setAllowance(val.approvalAmount)
        const remainingAmount = val.approvalAmount - existingOrdersAmount
        setRemainingApprovalAmount(remainingAmount)
        setApprovalAmount(remainingAmount)
        remainingAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      })
    })
  }, [])

  return (
    <div>
      <form onSubmit={(event) => handleOrderSubmit(event)}>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>Number of Options</LabelStyle>
          </LabelStyleDiv>
          <FormInput
            type="text"
            onChange={(event) => handleNumberOfOptions(event.target.value)}
          />
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>Price per Option</LabelStyle>
          </LabelStyleDiv>
          <FormInput
            type="text"
            onChange={(event) => handlePricePerOptions(event.target.value)}
          />
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <Box>
              <LabelStyle>You Pay</LabelStyle>
              <SubLabelStyle>
                Approved Balance {remainingApprovalAmount}
              </SubLabelStyle>
            </Box>
          </LabelStyleDiv>
          <RightSideLabel>
            {youPay.toFixed(4) + ' '} {option.collateralTokenName}
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelGrayStyle>Wallet Balance</LabelGrayStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            <LabelGrayStyle>
              {collateralBalance.toFixed(4)} {option.collateralTokenName}
            </LabelGrayStyle>
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelGrayStyle>Order Expires in</LabelGrayStyle>
            <InfoIcon style={{ fontSize: 15, color: 'grey' }} />
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
              </Select>
            </FormControl>
          </LimitOrderExpiryDiv>
        </FormDiv>
        <CreateButtonWrapper />
        <Box marginLeft="30%">
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
