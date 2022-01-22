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
import { LabelStyle } from './UiStyles'
import { LabelGrayStyle } from './UiStyles'
import { LabelStyleDiv } from './UiStyles'
import { FormDiv } from './UiStyles'
import { FormInput } from './UiStyles'
import { RightSideLabel } from './UiStyles'
import { CreateButtonWrapper } from './UiStyles'
import { LimitOrderExpiryDiv } from './UiStyles'
import { useStyles } from './UiStyles'
import { Network } from '../../../Util/chainIdToName'
import Web3 from 'web3'
import { BigNumber } from '@0x/utils'
import { Pool } from '../../../lib/queries'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ERC20_ABI = require('../../../abi/ERC20.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
const CHAIN_ID = Network.ROPSTEN
const address = contractAddress.getContractAddressesForChainOrThrow(CHAIN_ID)
const exchangeProxyAddress = address.exchangeProxy
const maxApproval = new BigNumber(2).pow(256).minus(1)
const web3 = new Web3(Web3.givenProvider)
let accounts: any[]

export default function SellLimit(props: {
  option: Pool
  handleDisplayOrder: () => void
  tokenAddress: string
}) {
  const option = props.option
  const optionTokenAddress = props.tokenAddress
  const classes = useStyles()
  const [expiry, setExpiry] = React.useState(5)
  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [pricePerOption, setPricePerOption] = React.useState(0.0)
  const [isApproved, setIsApproved] = React.useState(false)
  const [walletBalance, setWalletBalance] = React.useState(0)
  const makerToken = optionTokenAddress
  const makerTokenContract = new web3.eth.Contract(ERC20_ABI, makerToken)
  const handleNumberOfOptions = (value: string) => {
    setNumberOfOptions(parseFloat(value))
  }

  const handlePricePerOptions = (value: string) => {
    setPricePerOption(parseFloat(value))
  }

  const handleFormReset = () => {
    Array.from(document.querySelectorAll('input')).forEach(
      (input) => (input.value = '')
    )
    setIsApproved(false)
    setNumberOfOptions(parseFloat('0.0'))
    setPricePerOption(parseFloat('0.0'))
  }

  const getOptionsInWallet = async () => {
    accounts = await window.ethereum.enable()
    const makerAccount = accounts[0]
    let balance = await makerTokenContract.methods
      .balanceOf(makerAccount)
      .call()
    balance = balance / 10 ** option.collateralDecimals
    return balance
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    accounts = await window.ethereum.enable()
    const makerAccount = accounts[0]
    if (!isApproved) {
      await makerTokenContract.methods
        .approve(exchangeProxyAddress, maxApproval)
        .send({ from: makerAccount })

      await makerTokenContract.methods
        .allowance(makerAccount, exchangeProxyAddress)
        .call()
      setIsApproved(true)
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
        .then(function (response) {
          props.handleDisplayOrder()
          handleFormReset()
        })
        .catch(function (error) {
          console.error('Error' + error)
        })
    }
  }

  const handleExpirySelection = (event: SelectChangeEvent<number>) => {
    event.preventDefault()
    setExpiry(
      typeof event.target.value === 'string'
        ? parseInt(event.target.value)
        : event.target.value
    )
  }

  useEffect(() => {
    getOptionsInWallet().then((val) => {
      if (!Number.isNaN(val)) {
        setWalletBalance(Number(val))
      } else {
        setWalletBalance(0)
      }
    })
  }, [])

  return (
    <div>
      <form onSubmit={handleOrderSubmit}>
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
