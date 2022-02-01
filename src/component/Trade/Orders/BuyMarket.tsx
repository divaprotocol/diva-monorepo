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
import { Pool } from '../../../lib/queries'
import { Network } from '../../../Util/chainIdToName'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BigNumber } from '@0x/utils'
import Web3 from 'web3'
import * as qs from 'qs'
import { formatUnits, parseEther } from 'ethers/lib/utils'
import ERC20_ABI from '../../../abi/ERC20.json'
import { getComparator, stableSort } from './OrderHelper'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
const CHAIN_ID = Network.ROPSTEN
const web3 = new Web3(Web3.givenProvider)
let accounts: any[]

export default function BuyMarket(props: {
  option: Pool
  handleDisplayOrder: () => void
  tokenAddress: string
}) {
  const option = props.option
  const [value, setValue] = React.useState<string | number>(0)
  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [avgExpectedRate, setAvgExpectedRate] = React.useState(0.0)
  const [youPay, setYouPay] = React.useState(0.0)
  const [existingLimitOrders, setExistingLimitOrders] = React.useState([])
  const [isApproved, setIsApproved] = React.useState(false)
  // eslint-disable-next-line prettier/prettier
  const address = contractAddress.getContractAddressesForChainOrThrow(CHAIN_ID)
  const exchangeProxyAddress = address.exchangeProxy
  const makerToken = props.tokenAddress
  const [collateralBalance, setCollateralBalance] = React.useState(0)
  const takerToken = option.collateralToken
  // TODO: check again why we need to use "any" here
  const takerTokenContract = new web3.eth.Contract(ERC20_ABI as any, takerToken)

  const params = {
    makerToken: makerToken,
    takerToken: takerToken,
  }
  const handleNumberOfOptions = (value: string) => {
    if (value !== '') {
      const nbrOptions = parseFloat(value)
      setNumberOfOptions(nbrOptions)
    } else {
      setYouPay(0.0)
    }
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    accounts = await window.ethereum.enable()
    const takerTokenAddress = option.collateralToken
    if (!isApproved) {
      const maxApproval = new BigNumber(2).pow(256).minus(1)

      //is ERC20_ABP correct? or should we use position token abi
      //ERC20_ABI enough to use approval
      const takerTokenContract = await new web3.eth.Contract(
        // TODO: check again why we need to use "any" here
        ERC20_ABI as any,
        takerTokenAddress
      )
      await takerTokenContract.methods
        .approve(exchangeProxyAddress, maxApproval)
        .send({ from: accounts[0] })
      const approvedByTaker = await takerTokenContract.methods
        .allowance(accounts[0], exchangeProxyAddress)
        .call()
      alert(
        `Taker allowance for ${option.collateralToken} successfully set by ${approvedByTaker}`
      )
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
        avgExpectedRate: avgExpectedRate,
        existingLimitOrders: existingLimitOrders,
      }

      buyMarketOrder(orderData).then((orderFillStatus: any) => {
        if (!(orderFillStatus === undefined)) {
          if (!('logs' in orderFillStatus)) {
            alert('Order could not be filled logs not found')
            return
          } else {
            orderFillStatus.logs.forEach(async (eventData: any) => {
              if (!('event' in eventData)) {
                return
              } else {
                if (eventData.event === 'LimitOrderFilled') {
                  //reset fill order button to approve
                  setIsApproved(false)
                  //get updated wallet balance
                  getCollateralInWallet().then((val) => {
                    if (val != null) {
                      setCollateralBalance(Number(val))
                    }
                  })
                  //reset input & you pay fields
                  Array.from(document.querySelectorAll('input')).forEach(
                    (input) => (input.value = '')
                  )
                  setNumberOfOptions(0.0)
                  setYouPay(0.0)
                  alert('Order successfully filled')
                  //wait for 4 secs for 0x to update orders then handle order book display
                  await new Promise((resolve) => setTimeout(resolve, 4000))
                  props.handleDisplayOrder()
                  return
                } else {
                  alert('Order could not be filled')
                }
              }
            })
          }
        } else {
          alert('order could not be filled response is not defined')
        }
      })
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
    balance = formatUnits(balance.toString(), option.collateralDecimals)
    return balance
  }

  const getLimitOrders = async () => {
    const orders: any = []
    const res = await fetch(
      `https://ropsten.api.0x.org/orderbook/v1/orders?${qs.stringify(params)}`
    )
    const resJSON = await res.json()
    const responseOrders: any = resJSON['records']
    responseOrders.forEach((data: any) => {
      const order = data.order
      const takerAmount = new BigNumber(order.takerAmount)
      const makerAmount = new BigNumber(order.makerAmount)
      order['expectedRate'] = takerAmount
        .dividedBy(makerAmount)
        .decimalPlaces(option.collateralDecimals)
      order['remainingFillableTakerAmount'] =
        data.metaData.remainingFillableTakerAmount
      orders.push(order)
    })

    const sortOrder = 'ascOrder'
    const orderBy = 'expectedRate'
    const sortedRecords = stableSort(orders, getComparator(sortOrder, orderBy))
    if (sortedRecords.length > 0) {
      const bestRate = sortedRecords[0].expectedRate
      const rate = Number(bestRate)
      setAvgExpectedRate(rate)
    }
    console.log('sorted order ' + JSON.stringify(sortedRecords))
    return sortedRecords
  }

  useEffect(() => {
    getCollateralInWallet().then((val) => {
      if (val != null) {
        setCollateralBalance(Number(val))
      } else {
        throw new Error(`can not read wallet balance`)
      }
    })
    setAvgExpectedRate(avgExpectedRate)
    getLimitOrders().then((orders: []) => {
      setExistingLimitOrders(orders)
    })
  }, [])

  useEffect(() => {
    if (numberOfOptions > 0 && existingLimitOrders.length > 0) {
      let count = numberOfOptions
      let cumulativeAvg = parseEther('0')
      let cumulativeTaker = parseEther('0')
      let cumulativeMaker = parseEther('0')
      existingLimitOrders.forEach((order: any) => {
        const makerAmount = Number(
          formatUnits(order.makerAmount.toString(), option.collateralDecimals)
        )
        const expectedRate = order.expectedRate
        if (count > 0) {
          if (count <= makerAmount) {
            const orderTotalAmount = parseEther(expectedRate.toString()).mul(
              parseEther(count.toString())
            )
            cumulativeTaker = cumulativeTaker.add(orderTotalAmount)
            cumulativeMaker = cumulativeMaker.add(parseEther(count.toString()))
            count = 0
          } else {
            //nbrOfOptions entered are greater than current order maker amount
            //so add entire order taker amount in cumulative taker
            cumulativeTaker = cumulativeTaker.add(parseEther(order.takerAmount))
            cumulativeMaker = cumulativeMaker.add(
              parseEther(makerAmount.toString())
            )
            count = count - makerAmount
          }
        }
      })
      cumulativeAvg = cumulativeTaker.div(cumulativeMaker)
      if (cumulativeAvg.gt(0)) {
        const avg = Number(
          formatUnits(cumulativeAvg, option.collateralDecimals)
        )
        setAvgExpectedRate(avg)
        const youPayAmount = avg * numberOfOptions
        setYouPay(youPayAmount)
      }
    }
  }, [numberOfOptions])

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
            {avgExpectedRate.toFixed(4)} {option.collateralTokenName}
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>You Pay</LabelStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            {youPay.toFixed(4)} {option.collateralSymbol}
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelGrayStyle>Wallet Balance</LabelGrayStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            <LabelGrayStyle>
              {collateralBalance.toFixed(4)} {option.collateralSymbol}
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
            disabled={existingLimitOrders.length > 0 ? false : true}
          >
            {isApproved ? 'Fill Order' : 'Approve'}
          </Button>
        </Box>
      </form>
    </div>
  )
}
