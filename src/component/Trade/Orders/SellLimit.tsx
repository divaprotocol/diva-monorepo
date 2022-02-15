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
import * as qs from 'qs'
import Web3 from 'web3'
import { BigNumber } from '@0x/utils'
import { Pool } from '../../../lib/queries'
import { formatUnits, parseEther, parseUnits } from 'ethers/lib/utils'
import { NETWORKS, useWallet } from '@web3-ui/hooks'
import ERC20_ABI from '../../../abi/ERC20.json'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
const web3 = new Web3(Web3.givenProvider)
let accounts: any[]

export default function SellLimit(props: {
  option: Pool
  handleDisplayOrder: () => void
  tokenAddress: string
}) {
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
  const [approvalAmount, setApprovalAmount] = React.useState(0.0)
  const [makerAccount, setMakerAccount] = React.useState('')
  const [walletBalance, setWalletBalance] = React.useState(0)
  const [remainingAmount, setRemainingAmount] = React.useState(0.0)
  const makerToken = optionTokenAddress
  const takerToken = option.collateralToken
  const makerTokenContract = new web3.eth.Contract(ERC20_ABI as any, makerToken)
  const handleNumberOfOptions = (value: string) => {
    setNumberOfOptions(parseFloat(value))
  }

  const handlePricePerOptions = (value: string) => {
    setPricePerOption(parseFloat(value))
  }

  const handleFormReset = async (isApproved) => {
    setIsApproved(isApproved)
    Array.from(document.querySelectorAll('input')).forEach(
      (input) => (input.value = '')
    )
    setNumberOfOptions(parseFloat('0.0'))
    setPricePerOption(parseFloat('0.0'))
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      if (numberOfOptions > 0) {
        if (numberOfOptions > walletBalance) {
          alert('amount entered is greater than available balance')
        } else {
          const amount = parseUnits(numberOfOptions.toString())
          await makerTokenContract.methods
            .approve(exchangeProxyAddress, amount)
            .send({ from: makerAccount })

          let allowance = await makerTokenContract.methods
            .allowance(makerAccount, exchangeProxyAddress)
            .call()
          allowance = Number(formatUnits(allowance.toString(), 18))
          setApprovalAmount(allowance)
          setIsApproved(true)
        }
      } else {
        alert('please enter positive balance for approval')
      }
    } else {
      if (numberOfOptions > approvalAmount) {
        if (
          confirm(
            'options to sell exceeds approval limit, approve more options '
          )
        ) {
          setIsApproved(false)
        } else {
          console.log('nothing done')
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
              props.handleDisplayOrder()
              let totalSellAmount = approvalAmount
              totalSellAmount -= numberOfOptions
              setApprovalAmount(totalSellAmount)
              const isApproved = totalSellAmount <= 0 ? false : true
              handleFormReset(isApproved)
            }
          })
          .catch(function (error) {
            console.error(error)
          })
      }
    }
  }

  const getLimitOrders = async (maker) => {
    let existingOrderAmount = 0
    const params = {
      makerToken: makerToken,
      takerToken: takerToken,
    }
    const res = await fetch(
      `https://ropsten.api.0x.org/orderbook/v1/orders?${qs.stringify(params)}`
    )
    const resJSON = await res.json()
    const responseOrders: any = resJSON['records']
    console.log('response orders ' + JSON.stringify(responseOrders))
    responseOrders.forEach((data: any) => {
      const order = data.order
      if (maker == order.maker) {
        existingOrderAmount += Number(formatUnits(order.makerAmount, 18))
        console.log('existing order amount ' + existingOrderAmount)
      }
    })
    return existingOrderAmount
  }

  const getOptionsInWallet = async () => {
    accounts = await window.ethereum.enable()
    const makerAccount = accounts[0]
    let allowance = await makerTokenContract.methods
      .allowance(makerAccount, exchangeProxyAddress)
      .call()
    console.log('allowance before' + allowance)
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
    getOptionsInWallet().then((val) => {
      !Number.isNaN(val.balance)
        ? setWalletBalance(Number(val.balance))
        : setWalletBalance(0)
      setMakerAccount(val.account)
      setApprovalAmount(val.approvalAmount)
      getLimitOrders(val.account).then((existingOrdersAmount) => {
        const remainingAmount = val.approvalAmount - existingOrdersAmount
        setApprovalAmount(remainingAmount)
        remainingAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      })
    })
  }, [])

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
              <SubLabelStyle>Approved Balance {approvalAmount}</SubLabelStyle>
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
          >
            {isApproved ? 'Create Order' : 'Approve'}
          </Button>
        </Box>
      </form>
    </div>
  )
}
