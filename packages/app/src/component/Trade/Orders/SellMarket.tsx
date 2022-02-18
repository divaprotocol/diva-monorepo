import React from 'react'
import { useEffect } from 'react'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import Typography from '@mui/material/Typography'
import Slider from '@mui/material/Slider'
import Input from '@mui/material/Input'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import { LabelStyle } from './UiStyles'
import { LabelGrayStyle } from './UiStyles'
import { LabelStyleDiv } from './UiStyles'
import { FormDiv } from './UiStyles'
import { FormInput } from './UiStyles'
import { RightSideLabel } from './UiStyles'
import { FormControlDiv } from './UiStyles'
import { CreateButtonWrapper } from './UiStyles'
import { SliderDiv } from './UiStyles'
import { InfoTooltip } from './UiStyles'
import { MaxSlippageText } from './UiStyles'
import { ExpectedRateInfoText } from './UiStyles'

import Web3 from 'web3'
import * as qs from 'qs'
import { Pool } from '../../../lib/queries'
import { sellMarketOrder } from '../../../Orders/sellMarket'

import ERC20_ABI from '../../../abi/ERC20.json'
import { formatUnits, parseEther } from 'ethers/lib/utils'
import { getComparator, stableSort } from './OrderHelper'
import { useWallet } from '@web3-ui/hooks'
import { BigNumber } from 'ethers'
import _0xAddresses from '@0x/contract-addresses/addresses.json'
const web3 = new Web3(Web3.givenProvider)
let accounts: any[]

export default function SellMarket(props: {
  option: Pool
  handleDisplayOrder: () => void
  tokenAddress: string
}) {
  const wallet = useWallet()
  const chainId = wallet?.provider?.network?.chainId || 3
  const option = props.option
  const optionTokenAddress = props.tokenAddress
  const [value, setValue] = React.useState<string | number>(0)
  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [avgExpectedRate, setAvgExpectedRate] = React.useState(0.0)
  const [youReceive, setYouReceive] = React.useState(0.0)
  const [existingLimitOrders, setExistingLimitOrders] = React.useState([])
  const [isApproved, setIsApproved] = React.useState(false)
  const exchangeProxyAddress = _0xAddresses[chainId].exchangeProxy
  const maxApproval = BigNumber.from(2).pow(256).sub(1)
  const [walletBalance, setWalletBalance] = React.useState(0)
  const makerToken = option.collateralToken
  const takerToken = props.tokenAddress
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
      setYouReceive(0.0)
    }
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    accounts = await window.ethereum.enable()
    const makerAccount = accounts[0]
    if (!isApproved) {
      await takerTokenContract.methods
        .approve(exchangeProxyAddress, maxApproval)
        .send({ from: makerAccount })

      const approvedByMaker = await takerTokenContract.methods
        .allowance(makerAccount, exchangeProxyAddress)
        .call()
      alert(
        `Maker allowance for ${option.referenceAsset} successfully set by ${approvedByMaker}`
      )
      setIsApproved(true)
    } else {
      const orderData = {
        maker: makerAccount,
        provider: web3,
        isBuy: false,
        nbrOptions: numberOfOptions,
        collateralDecimals: option.collateralDecimals,
        makerToken: optionTokenAddress,
        takerToken: option.collateralToken,
        ERC20_ABI: ERC20_ABI,
        avgExpectedRate: avgExpectedRate,
        existingLimitOrders: existingLimitOrders,
      }
      sellMarketOrder(orderData, String(chainId)).then(
        (orderFillStatus: any) => {
          if (!(orderFillStatus == undefined)) {
            if (!('logs' in orderFillStatus)) {
              alert('order could not be filled')
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
                    getOptionsInWallet().then((val) => {
                      if (val != null) {
                        setWalletBalance(Number(val))
                      }
                    })
                    //reset input & you pay fields
                    Array.from(document.querySelectorAll('input')).forEach(
                      (input) => (input.value = '')
                    )
                    setNumberOfOptions(0.0)
                    setYouReceive(0.0)
                    alert('Order successfully filled')
                    //wait for a sec for 0x to update orders then handle order book display
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
            alert('order could not be filled')
          }
        }
      )
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

  const getOptionsInWallet = async () => {
    accounts = await window.ethereum.enable()
    const makerAccount = accounts[0]
    let balance = await takerTokenContract.methods
      .balanceOf(makerAccount)
      .call()
    balance = Number(formatUnits(balance.toString(), 18))
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
      const takerAmount = BigNumber.from(order.takerAmount)
      const makerAmount = BigNumber.from(order.makerAmount)
      order['expectedRate'] = makerAmount.div(takerAmount)
      order['remainingFillableTakerAmount'] =
        data.metaData.remainingFillableTakerAmount
      orders.push(order)
    })
    const sortOrder = 'desOrder'
    const orderBy = 'expectedRate'
    const sortedRecords = stableSort(orders, getComparator(sortOrder, orderBy))
    if (sortedRecords.length) {
      const bestRate = sortedRecords[0].expectedRate
      setAvgExpectedRate(Number(bestRate))
    }
    return sortedRecords
  }

  useEffect(() => {
    getOptionsInWallet().then((val) => {
      if (val != null) {
        setWalletBalance(Number(val))
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
        const takerAmount = Number(
          formatUnits(order.takerAmount.toString(), option.collateralDecimals)
        )
        const expectedRate = order.expectedRate
        if (count > 0) {
          if (count <= takerAmount) {
            const orderTotalAmount = parseEther(expectedRate.toString()).mul(
              parseEther(count.toString())
            )
            cumulativeMaker = cumulativeMaker.add(orderTotalAmount)
            cumulativeTaker = cumulativeTaker.add(parseEther(count.toString()))
            count = 0
          } else {
            cumulativeTaker = cumulativeTaker.add(
              parseEther(takerAmount.toString())
            )
            cumulativeMaker = cumulativeMaker.add(
              parseEther(order.makerAmount.toString())
            )
            count = count - takerAmount
          }
        }
      })
      cumulativeAvg = cumulativeMaker.div(cumulativeTaker)
      if (cumulativeAvg.gt(0)) {
        const avg = Number(formatUnits(cumulativeAvg))
        setAvgExpectedRate(avg)
        const youPay = avg * numberOfOptions
        setYouReceive(youPay)
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
            <LabelStyle>You Receive</LabelStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            {youReceive.toFixed(4)} {option.collateralSymbol}
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
              onChange={handleSliderChange}
              step={0.1}
              min={0}
              max={20}
              aria-labelledby="input-slider"
            />
          </SliderDiv>
          <FormControlDiv>
            <Input
              value={value}
              margin="dense"
              onChange={handleInputChange}
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
        <Box marginLeft="100px">
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
