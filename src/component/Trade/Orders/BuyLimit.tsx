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
import { Pool } from '../../../lib/queries'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ERC20 = require('../abi/ERC20.json')
const ERC20_ABI = ERC20.abi
const web3 = new Web3(Web3.givenProvider)
let accounts

export default function BuyLimit(props: {
  option: Pool
  handleDisplayOrder: () => void
  tokenAddress: string
}) {
  const classes = useStyles()
  const option = props.option
  const [expiry, setExpiry] = React.useState(5)
  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [pricePerOption, setPricePerOption] = React.useState(0.0)
  const [collateralBalance, setCollateralBalance] = React.useState(0)
  const takerToken = option.collateralToken
  const takerTokenContract = new web3.eth.Contract(ERC20_ABI, takerToken)

  const handleNumberOfOptions = (value: string) => {
    setNumberOfOptions(parseFloat(value))
  }

  const handlePricePerOptions = (value: string) => {
    setPricePerOption(parseFloat(value))
  }

  const handleExpirySelection = (event: SelectChangeEvent<number>) => {
    event.preventDefault()
    setExpiry(
      typeof event.target.value === 'string'
        ? parseInt(event.target.value)
        : event.target.value
    )
  }

  const handleOrderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    accounts = await window.ethereum.enable()
    const orderData = {
      maker: accounts[0],
      makerToken: option.collateralToken,
      takerToken: props.tokenAddress,
      provider: web3,
      isBuy: true,
      nbrOptions: numberOfOptions,
      limitPrice: pricePerOption,
      collateralDecimals: option.collateralDecimals,
      orderExpiry: expiry,
    }

    buylimitOrder(orderData)
      .then(function (response) {
        console.log('Response ' + response)
        props.handleDisplayOrder()
      })
      .catch(function (error) {
        console.log('Error' + error)
      })
  }

  const getCollateralInWallet = async () => {
    accounts = await window.ethereum.enable()
    const takerAccount = accounts[0]
    let balance = await takerTokenContract.methods
      .balanceOf(takerAccount)
      .call()
    balance = balance / 10 ** option.collateralDecimals
    return balance
  }

  useEffect(() => {
    getCollateralInWallet().then((val) => {
      console.log(JSON.stringify(val))
      if (val != null) {
        setCollateralBalance(Number(val))
      } else {
        throw new Error(`can not read wallet balance`)
      }
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
            <LabelStyle>You Pay</LabelStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            {pricePerOption * numberOfOptions} {option.collateralTokenName}
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelGrayStyle>Wallet Balance</LabelGrayStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            <LabelGrayStyle>
              {collateralBalance} {option.collateralTokenName}
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
          >
            Fill order
          </Button>
        </Box>
      </form>
    </div>
  )
}
