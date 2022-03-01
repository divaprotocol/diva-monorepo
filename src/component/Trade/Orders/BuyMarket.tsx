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
import { LabelGrayStyle, SubLabelStyle } from './UiStyles'
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
import { formatUnits, parseEther, parseUnits } from 'ethers/lib/utils'
import ERC20_ABI from '../../../abi/ERC20.json'
import { getComparator, stableSort, totalDecimals } from './OrderHelper'
import { BigNumber } from '@0x/utils'
import Web3 from 'web3'
import { Pool } from '../../../lib/queries'
import { NETWORKS } from '@web3-ui/hooks'
import { useAppSelector } from '../../../Redux/hooks'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
const CHAIN_ID = NETWORKS.ropsten
const web3 = new Web3(Web3.givenProvider)
let accounts: any[]

export default function BuyMarket(props: {
  option: Pool
  handleDisplayOrder: () => any
  tokenAddress: string
}) {
  const responseSell = useAppSelector((state) => state.tradeOption.responseSell)
  let responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  const option = props.option
  const [value, setValue] = React.useState<string | number>(0)
  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [avgExpectedRate, setAvgExpectedRate] = React.useState(0.0)
  const [youPay, setYouPay] = React.useState(0.0)
  const [existingSellLimitOrders, setExistingSellLimitOrders] = React.useState(
    []
  )
  const [isApproved, setIsApproved] = React.useState(false)
  const [approvalAmount, setApprovalAmount] = React.useState(0.0)
  const [existingOrdersAmount, setExistingOrdersAmount] = React.useState(0.0)
  const [allowance, setAllowance] = React.useState(0.0)
  const [remainingApprovalAmount, setRemainingApprovalAmount] =
    React.useState(0.0)
  const [takerAccount, setTakerAccount] = React.useState('')
  // eslint-disable-next-line prettier/prettier
  const address = contractAddress.getContractAddressesForChainOrThrow(CHAIN_ID)
  const exchangeProxyAddress = address.exchangeProxy
  const makerToken = props.tokenAddress
  const [collateralBalance, setCollateralBalance] = React.useState(0)
  const takerToken = option.collateralToken
  // TODO: check again why we need to use "any" here
  const takerTokenContract = new web3.eth.Contract(ERC20_ABI as any, takerToken)

  const handleNumberOfOptions = (value: string) => {
    if (value !== '') {
      const nbrOptions = parseFloat(value)
      setNumberOfOptions(nbrOptions)
    } else {
      setYouPay(0.0)
    }
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

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
          setRemainingApprovalAmount(collateralAllowance)
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
          } else {
            //TBD discuss this case
            console.log('nothing done')
          }
        }
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
          existingLimitOrders: existingSellLimitOrders,
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
                    let collateralAllowance = await takerTokenContract.methods
                      .allowance(accounts[0], exchangeProxyAddress)
                      .call()
                    collateralAllowance = Number(
                      formatUnits(
                        collateralAllowance.toString(),
                        option.collateralDecimals
                      )
                    )
                    //wait for 4 secs for 0x to update orders then handle order book display
                    await new Promise((resolve) => setTimeout(resolve, 4000))
                    await props.handleDisplayOrder()
                    //reset input & you pay fields
                    Array.from(document.querySelectorAll('input')).forEach(
                      (input) => (input.value = '')
                    )
                    setNumberOfOptions(0.0)
                    setYouPay(0.0)
                    alert('Order successfully filled')
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
  }

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
    balance = Number(formatUnits(balance.toString(), option.collateralDecimals))
    return {
      balance: balance,
      account: takerAccount,
      approvalAmount: allowance,
    }
  }

  const getSellLimitOrders = async () => {
    const orders: any = []
    responseSell.forEach((data: any) => {
      const order = JSON.parse(JSON.stringify(data.order))
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
    const sortedOrders = stableSort(orders, getComparator(sortOrder, orderBy))
    if (sortedOrders.length > 0) {
      const bestRate = sortedOrders[0].expectedRate
      const rate = Number(bestRate)
      setAvgExpectedRate(rate)
    }
    return {
      sortedOrders: sortedOrders,
      existingOrdersAmount: existingOrdersAmount,
    }
  }

  const getTakerOrdersTotalAmount = async (taker) => {
    let existingOrdersAmount = new BigNumber(0)
    if (responseBuy.length == 0) {
      //Double check any limit orders exists
      const rBuy = await get0xOpenOrders(option.collateralToken, makerToken)
      if (rBuy.length > 0) {
        responseBuy = rBuy
      }
    }
    responseBuy.forEach((data: any) => {
      const order = data.order
      const metaData = data.metaData
      if (taker == order.maker) {
        const remainingFillableTakerAmount = new BigNumber(
          metaData.remainingFillableTakerAmount.toString()
        )
        if (remainingFillableTakerAmount < order.takerAmount) {
          const makerAmount = new BigNumber(order.makerAmount)
          const takerAmount = new BigNumber(order.takerAmount)
          const bidAmount = makerAmount.dividedBy(takerAmount)
          const youPay = bidAmount.multipliedBy(remainingFillableTakerAmount)
          existingOrdersAmount = existingOrdersAmount.plus(youPay)
        } else {
          existingOrdersAmount = existingOrdersAmount.plus(order.makerAmount)
        }
      }
    })
    return Number(
      formatUnits(existingOrdersAmount.toString(), option.collateralDecimals)
    )
  }

  useEffect(() => {
    getCollateralInWallet().then((val) => {
      !Number.isNaN(val.balance)
        ? setCollateralBalance(Number(val.balance))
        : setCollateralBalance(0)
      setTakerAccount(val.account)
      setAllowance(val.approvalAmount)
      setApprovalAmount(val.approvalAmount)
      setRemainingApprovalAmount(val.approvalAmount)
      val.approvalAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      if (responseSell.length > 0) {
        getSellLimitOrders().then((data) => {
          setExistingSellLimitOrders(data.sortedOrders)
        })
      }
      getTakerOrdersTotalAmount(val.account).then((amount) => {
        const remainingAmount = Number(
          (val.approvalAmount - amount).toFixed(
            totalDecimals(val.approvalAmount, amount)
          )
        )
        setRemainingApprovalAmount(remainingAmount)
        remainingAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      })
      //}
    })
  }, [responseSell, responseBuy])

  useEffect(() => {
    if (numberOfOptions > 0 && existingSellLimitOrders.length > 0) {
      let count = numberOfOptions
      let cumulativeAvg = parseEther('0')
      let cumulativeTaker = parseEther('0')
      let cumulativeMaker = parseEther('0')
      existingSellLimitOrders.forEach((order: any) => {
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
            <Box>
              <LabelStyle>You Pay</LabelStyle>
              <SubLabelStyle>
                remaining Balance {remainingApprovalAmount}
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
            disabled={existingSellLimitOrders.length > 0 ? false : true}
          >
            {isApproved ? 'Fill Order' : 'Approve'}
          </Button>
        </Box>
      </form>
    </div>
  )
}
