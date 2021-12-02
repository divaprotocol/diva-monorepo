import React from 'react'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { MenuItem } from '@mui/material'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import InfoIcon from '@mui/icons-material/InfoOutlined'
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
import Web3 from 'web3'
import { BigNumber } from '@0x/utils'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ERC20 = require('../abi/ERC20.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
const ERC20_ABI = ERC20.abi
const CHAIN_ID = 3
const address = contractAddress.getContractAddressesForChainOrThrow(CHAIN_ID)
const exchangeProxyAddress = address.exchangeProxy
const maxApproval = new BigNumber(2).pow(256).minus(1)
const web3 = new Web3(Web3.givenProvider)
let accounts: any[]

export default function SellLimit(props: {
  option: any
  handleDisplayOrder: () => void
}) {
  const classes = useStyles()
  const option = props.option
  const [expiry, setExpiry] = React.useState(5)
  const [numberOfOptions, setNumberOfOptions] = React.useState(5)
  const [pricePerOption, setPricePerOption] = React.useState(0)
  const [isApproved, setIsApproved] = React.useState(false)
  const makerToken = option.TokenAddress
  const handleNumberOfOptions = (value: string) => {
    setNumberOfOptions(parseInt(value))
  }

  const handlePricePerOptions = (value: string) => {
    setPricePerOption(parseInt(value))
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      const makerTokenContract = new web3.eth.Contract(ERC20_ABI, makerToken)
      await makerTokenContract.methods
        .approve(exchangeProxyAddress, maxApproval)
        .send({ from: accounts[0] })

      const approvedByMaker = await makerTokenContract.methods
        .allowance(accounts[0], exchangeProxyAddress)
        .call()
      console.log('Approved by maker: ' + (await approvedByMaker.toString()))
      setIsApproved(true)
    }
    accounts = await window.ethereum.enable()
    const orderData = {
      maker: accounts[0],
      makerToken: option.TokenAddress,
      takerToken: option.CollateralToken,
      provider: web3,
      isBuy: false,
      nbrOptions: numberOfOptions,
      limitPrice: pricePerOption,
      collateralDecimals: option.DecimalsCollateralToken,
      orderExpiry: expiry,
    }

    sellLimitOrder(orderData)
      .then(function (response) {
        console.log('Response ' + response)
        props.handleDisplayOrder()
      })
      .catch(function (error) {
        console.log('Error' + error)
      })
  }

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
            <LabelStyle>Number of Options</LabelStyle>
          </LabelStyleDiv>
          <FormInput
            type="text"
            value={numberOfOptions}
            onChange={(event) => handleNumberOfOptions(event.target.value)}
          />
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>Price per Option</LabelStyle>
          </LabelStyleDiv>
          <FormInput
            type="text"
            value={pricePerOption}
            onChange={(event) => handlePricePerOptions(event.target.value)}
          />
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>You Receive</LabelStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            {pricePerOption * numberOfOptions} {option.CollateralTokenName}
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelGrayStyle>Options in Wallet</LabelGrayStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            <LabelGrayStyle>{0}</LabelGrayStyle>
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
      </form>
    </div>
  )
}
