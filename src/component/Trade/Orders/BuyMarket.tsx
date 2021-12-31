import React from 'react'
import { useEffect } from 'react'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import Typography from '@mui/material/Typography'
import Slider from '@mui/material/Slider'
import Input from '@mui/material/Input'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import { buyMarketOrder } from '../../../Orders/BuyMarket'
import { LabelGrayStyle } from './UiStyles'
import { LabelStyle } from './UiStyles'
import { LabelStyleDiv } from './UiStyles'
import { FormDiv } from './UiStyles'
import { FormInput } from './UiStyles'
import { RightSideLabel } from './UiStyles'
import { FormControlDiv } from './UiStyles'
import { CreateButtonWrapper } from './UiStyles'
import { SliderDiv } from './UiStyles'
import { InfoTooltip } from './UiStyles'
import { ExpectedRateInfoText } from './UiStyles'
import { MaxSlippageText } from './UiStyles'
import { Network } from '../../../Util/chainIdToName'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BigNumber } from '@0x/utils'
import Web3 from 'web3'
import { Pool } from '../../../lib/queries'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ERC20 = require('../abi/ERC20.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
const ERC20_ABI = ERC20.abi
const CHAIN_ID = Network.ROPSTEN
const web3 = new Web3(Web3.givenProvider)
let accounts: any[]

export default function BuyMarket(props: {
  option: Pool
  tokenAddress: string
}) {
  const option = props.option
  const [value, setValue] = React.useState<string | number>(0)
  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [pricePerOption, _setPricePerOption] = React.useState(0)
  const [isApproved, setIsApproved] = React.useState(false)
  // eslint-disable-next-line prettier/prettier

  const address = contractAddress.getContractAddressesForChainOrThrow(CHAIN_ID)
  const exchangeProxyAddress = address.exchangeProxy
  const makerToken = props.tokenAddress
  const maxApproval = new BigNumber(2).pow(256).minus(1)

  const [collateralBalance, setCollateralBalance] = React.useState(0)
  const takerToken = option.collateralToken
  const takerTokenContract = new web3.eth.Contract(ERC20_ABI, takerToken)

  const handleNumberOfOptions = (value: string) => {
    setNumberOfOptions(parseFloat(value))
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    accounts = await window.ethereum.enable()
    const takerTokenAddress = option.collateralToken
    if (!isApproved) {
      //is ERC20_ABP correct? or should we use position token abi
      //ERC20_ABI enough to use approval
      const takerTokenContract = await new web3.eth.Contract(
        ERC20_ABI,
        takerTokenAddress
      )
      await takerTokenContract.methods
        .approve(exchangeProxyAddress, maxApproval)
        .send({ from: accounts[0] })
      const approvedByTaker = await takerTokenContract.methods
        .allowance(accounts[0], exchangeProxyAddress)
        .call()
      console.log('Approved by taker: ' + (await approvedByTaker.toString()))
      alert(`Maker allowance for ${option.collateralToken} successfully set`)
      setIsApproved(true)
    } else {
      const orderData = {
        takerAccount: accounts[0],
        provider: web3,
        isBuy: true,
        nbrOptions: numberOfOptions,
        collateralDecimals: option.collateralDecimals,
        makerToken: makerToken,
        takerToken: option.collateralToken,
        ERC20_ABI: ERC20_ABI,
      }

      buyMarketOrder(orderData)
    }
  }

  const handleSliderChange = (_event: any, newValue: any) => {
    setValue(newValue)
  }

  const handleInputChange = (
    event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const value = event.target.value.toString()
    setValue(value === '' ? '' : Number(value))
  }

  const handleBlur = () => {
    if (value < 0) {
      setValue(0)
    } else if (value >= 20) {
      setValue(20)
    }
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
          <InfoTooltip
            title={<React.Fragment>{ExpectedRateInfoText}</React.Fragment>}
          >
            <LabelStyleDiv>
              <LabelStyle>Expected Rate </LabelStyle>
              <InfoIcon style={{ fontSize: 15, color: 'grey' }} />
            </LabelStyleDiv>
          </InfoTooltip>
          <RightSideLabel>
            {pricePerOption} {option.collateralTokenName}
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>You Pay</LabelStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            {pricePerOption} {option.collateralTokenName}
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
          <SliderDiv>
            <Typography id="input-slider" gutterBottom>
              <LabelGrayStyle>Max slippage %</LabelGrayStyle>
              <InfoTooltip
                title={<React.Fragment>{MaxSlippageText}</React.Fragment>}
              >
                <InfoIcon style={{ fontSize: 15, color: 'grey' }} />
              </InfoTooltip>
            </Typography>

            <Slider
              value={typeof value === 'number' ? value : 0}
              step={0.1}
              min={0}
              max={20}
              onChange={handleSliderChange}
              aria-labelledby="input-slider"
            />
          </SliderDiv>
          <FormControlDiv>
            <Input
              value={value}
              margin="dense"
              onChange={(event) => handleInputChange(event)}
              onBlur={handleBlur}
              inputProps={{
                step: 0.1,
                min: 0.0,
                max: 20,
                type: 'number',
                'aria-labelledby': 'input-slider',
              }}
            />
          </FormControlDiv>
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
            {isApproved ? 'Fill Order' : 'Approve'}
          </Button>
        </Box>
      </form>
    </div>
  )
}
