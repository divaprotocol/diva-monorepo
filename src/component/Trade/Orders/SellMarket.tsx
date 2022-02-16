import React from 'react'
import { useEffect } from 'react'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import Typography from '@mui/material/Typography'
import Slider from '@mui/material/Slider'
import Input from '@mui/material/Input'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import { LabelStyle, SubLabelStyle } from './UiStyles'
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BigNumber } from '@0x/utils'
import { sellMarketOrder } from '../../../Orders/SellMarket'
// eslint-disable-next-line @typescript-eslint/no-var-requires

import ERC20_ABI from '../../../abi/ERC20.json'
import { formatUnits, parseEther, parseUnits } from 'ethers/lib/utils'
import { getComparator, stableSort } from './OrderHelper'
import { useWallet } from '@web3-ui/hooks'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
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
  const [approvalAmount, setApprovalAmount] = React.useState(0.0)
  const [makerAccount, setMakerAccount] = React.useState('')
  // eslint-disable-next-line prettier/prettier
  const address = contractAddress.getContractAddressesForChainOrThrow(chainId)
  const exchangeProxyAddress = address.exchangeProxy
  const maxApproval = new BigNumber(2).pow(256).minus(1)
  const [walletBalance, setWalletBalance] = React.useState(0)
  const makerToken = option.collateralToken
  const takerToken = props.tokenAddress
  const takerTokenContract = new web3.eth.Contract(ERC20_ABI as any, takerToken)

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
    if (!isApproved) {
      if (numberOfOptions > 0) {
        if (numberOfOptions > walletBalance) {
          alert('amount entered is greater than available balance')
        } else {
          const amount = parseUnits(numberOfOptions.toString())
          await takerTokenContract.methods
            .approve(exchangeProxyAddress, amount)
            .send({ from: makerAccount })

          const approvedByMaker = await takerTokenContract.methods
            .allowance(makerAccount, exchangeProxyAddress)
            .call()
          alert(
            `Maker allowance for ${option.referenceAsset} successfully set by ${approvedByMaker}`
          )
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
          //TBD discuss this case
          console.log('nothing done')
        }
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
        sellMarketOrder(orderData).then((orderFillStatus: any) => {
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
                    props.handleDisplayOrder()
                    let totalSellAmount = approvalAmount
                    totalSellAmount -= numberOfOptions
                    setApprovalAmount(totalSellAmount)
                    const isApproved = totalSellAmount <= 0 ? false : true
                    //reset fill order button to approve
                    setIsApproved(isApproved)
                    //get updated wallet balance
                    getOptionsInWallet().then((val) => {
                      if (val.balance != null) {
                        setWalletBalance(Number(val.balance))
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
        })
      }
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
    /*accounts = await window.ethereum.enable()
    const makerAccount = accounts[0]
    let balance = await takerTokenContract.methods
      .balanceOf(makerAccount)
      .call()
    balance = Number(formatUnits(balance.toString(), 18))
    return balance*/
    accounts = await window.ethereum.enable()
    const makerAccount = accounts[0]
    let allowance = await takerTokenContract.methods
      .allowance(makerAccount, exchangeProxyAddress)
      .call()
    console.log('allowance before' + allowance)
    let balance = await takerTokenContract.methods
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

  const getLimitOrders = async (maker) => {
    const orders: any = []
    let existingOrdersAmount = 0
    const params = {
      makerToken: makerToken,
      takerToken: takerToken,
    }
    const res = await fetch(
      `https://ropsten.api.0x.org/orderbook/v1/orders?${qs.stringify(params)}`
    )
    const resJSON = await res.json()
    const responseOrders: any = resJSON['records']
    responseOrders.forEach((data: any) => {
      const order = data.order
      const takerAmount = new BigNumber(order.takerAmount)
      const makerAmount = new BigNumber(order.makerAmount)
      order['expectedRate'] = makerAmount.dividedBy(takerAmount)
      order['remainingFillableTakerAmount'] =
        data.metaData.remainingFillableTakerAmount
      orders.push(order)
      if (maker == order.maker) {
        existingOrdersAmount += Number(formatUnits(order.makerAmount, 18))
        console.log('existing order amount ' + existingOrdersAmount)
      }
    })
    const sortOrder = 'desOrder'
    const orderBy = 'expectedRate'
    const sortedOrders = stableSort(orders, getComparator(sortOrder, orderBy))
    if (sortedOrders.length) {
      const bestRate = sortedOrders[0].expectedRate
      console.log('best rate ' + bestRate)
      setAvgExpectedRate(Number(bestRate))
    }
    console.log('sorted records ' + JSON.stringify(sortedOrders))
    return {
      sortedOrders: sortedOrders,
      existingOrdersAmount: existingOrdersAmount,
    }
  }

  /*useEffect(() => {
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
  }, [])*/
  useEffect(() => {
    getOptionsInWallet().then((val) => {
      !Number.isNaN(val.balance)
        ? setWalletBalance(Number(val.balance))
        : setWalletBalance(0)
      setMakerAccount(val.account)
      setAvgExpectedRate(avgExpectedRate)
      getLimitOrders(val.account).then((data) => {
        setExistingLimitOrders(data.sortedOrders)
        const remainingAmount = val.approvalAmount - data.existingOrdersAmount
        console.log('approval amount ' + val.approvalAmount)
        setApprovalAmount(remainingAmount)
        console.log('remaining approval ' + remainingAmount)
        remainingAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      })
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
        console.log('expected rate ' + expectedRate)
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
        console.log('You Pay ' + youPay)
        setYouReceive(youPay)
      }
    }
  }, [numberOfOptions])

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
