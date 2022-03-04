import React from 'react'
import { useEffect } from 'react'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { MenuItem } from '@mui/material'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import { sellLimitOrder } from '../../../Orders/SellLimit'
import { LabelStyle, SubLabelStyle } from './UiStyles'
import { LabelGrayStyle } from './UiStyles'
import { LabelStyleDiv } from './UiStyles'
import { FormDiv } from './UiStyles'
import { FormInput } from './UiStyles'
import { RightSideLabel } from './UiStyles'
import { CreateButtonWrapper } from './UiStyles'
import { LimitOrderExpiryDiv } from './UiStyles'
import { useStyles } from './UiStyles'
import { useAppSelector } from '../../../Redux/hooks'
import Web3 from 'web3'
import { Pool } from '../../../lib/queries'
import { formatUnits, parseEther, parseUnits } from 'ethers/lib/utils'
import { useWallet } from '@web3-ui/hooks'
import ERC20_ABI from '../../../abi/ERC20.json'
import { totalDecimals } from './OrderHelper'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
import { BigNumber } from '@0x/utils'
const web3 = new Web3(Web3.givenProvider)
let accounts: any[]

export default function SellLimit(props: {
  option: Pool
  handleDisplayOrder: () => any
  tokenAddress: string
  getMakerOrdersTotalAmount: (
    makerAccount: string,
    responseSell: any,
    makerToken: string
  ) => any
}) {
  const responseSell = useAppSelector((state) => state.tradeOption.responseSell)
  const wallet = useWallet()
  const classes = useStyles()
  const chainId = wallet?.provider?.network?.chainId || 3
  const address = contractAddress.getContractAddressesForChainOrThrow(chainId)
  const exchangeProxyAddress = address.exchangeProxy
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
  const takerToken = option.collateralToken
  const makerTokenContract = new web3.eth.Contract(ERC20_ABI as any, makerToken)
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
        if (numberOfOptions > walletBalance) {
          alert('amount entered is greater than available balance')
        } else {
          let allowance = await approveSellAmount(numberOfOptions)
          allowance = Number(formatUnits(allowance.toString(), 18))
          setRemainingApprovalAmount(allowance)
          setAllowance(allowance)
          setIsApproved(true)
          alert(
            `Total allowance` +
              allowance +
              `for ${option.referenceAsset} successfully set by`
          )
        }
      } else {
        alert('please enter positive balance for approval')
      }
    } else {
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
          takerToken: option.collateralToken,
          provider: web3,
          isBuy: false,
          nbrOptions: numberOfOptions,
          limitPrice: pricePerOption,
          collateralDecimals: option.collateralDecimals,
          orderExpiry: expiry,
        }
        sellLimitOrder(orderData)
          .then(async (response) => {
            if (response.status === 200) {
              await new Promise((resolve) => setTimeout(resolve, 4000))
              await props.handleDisplayOrder()
              handleFormReset()
            }
          })
          .catch(function (error) {
            console.error(error)
          })
      }
    }
  }

  /*const getMakerOrdersTotalAmount = async (maker) => {
    let existingOrderAmount = new BigNumber(0)
    if (responseSell.length == 0) {
      //Double check any limit orders exists
      const rSell: any = await get0xOpenOrders(
        optionTokenAddress,
        option.collateralToken
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
  }*/

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
    getOptionsInWallet().then(async (val) => {
      !Number.isNaN(val.balance)
        ? setWalletBalance(Number(val.balance))
        : setWalletBalance(0)
      setMakerAccount(val.account)
      setAllowance(val.approvalAmount)
      setRemainingApprovalAmount(val.approvalAmount)
      val.approvalAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      await props
        .getMakerOrdersTotalAmount(val.account, responseSell, makerToken)
        .then((existingOrdersAmount) => {
          setExistingOrdersAmount(existingOrdersAmount)
          const remainingAmount = Number(
            (val.approvalAmount - existingOrdersAmount).toFixed(
              totalDecimals(val.approvalAmount, existingOrdersAmount)
            )
          )
          setRemainingApprovalAmount(remainingAmount)
          remainingAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
        })
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

  return (
    <div>
      <form onSubmit={handleOrderSubmit}>
        <FormDiv>
          <LabelStyleDiv>
            <Box>
              <LabelStyle>Number of Options</LabelStyle>
              <SubLabelStyle>Remaining {remainingApprovalAmount}</SubLabelStyle>
            </Box>
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
            <LabelStyle>You Receive</LabelStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            {pricePerOption * numberOfOptions > 0
              ? (pricePerOption * numberOfOptions).toFixed(2)
              : 0.0}
            {' ' + option.collateralSymbol}
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelGrayStyle>Options in Wallet</LabelGrayStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            <LabelGrayStyle>{walletBalance.toFixed(4)}</LabelGrayStyle>
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
