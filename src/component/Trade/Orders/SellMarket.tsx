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
import { Pool } from '../../../lib/queries'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BigNumber } from '@0x/utils'
import { sellMarketOrder } from '../../../Orders/SellMarket'
// eslint-disable-next-line @typescript-eslint/no-var-requires
import ERC20_ABI from '../../../abi/ERC20.json'
import { formatUnits, parseEther, parseUnits } from 'ethers/lib/utils'
import { getComparator, stableSort, totalDecimals } from './OrderHelper'
import { useWallet } from '@web3-ui/hooks'
import { useAppSelector } from '../../../Redux/hooks'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const contractAddress = require('@0x/contract-addresses')
const web3 = new Web3(Web3.givenProvider)
let accounts: any[]

export default function SellMarket(props: {
  option: Pool
  handleDisplayOrder: () => any
  tokenAddress: string
}) {
  const responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  let responseSell = useAppSelector((state) => state.tradeOption.responseSell)
  const wallet = useWallet()
  const chainId = wallet?.provider?.network?.chainId || 3
  const option = props.option
  const optionTokenAddress = props.tokenAddress
  const [value, setValue] = React.useState<string | number>(0)
  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [avgExpectedRate, setAvgExpectedRate] = React.useState(0.0)
  const [youReceive, setYouReceive] = React.useState(0.0)
  const [existingBuyLimitOrders, setExistingBuyLimitOrders] = React.useState([])
  const [isApproved, setIsApproved] = React.useState(false)
  const [approvalAmount, setApprovalAmount] = React.useState(0.0)
  const [remainingApprovalAmount, setRemainingApprovalAmount] =
    React.useState(0.0)
  const [existingOrdersAmount, setExistingOrdersAmount] = React.useState(0.0)
  const [allowance, setAllowance] = React.useState(0.0)
  const [makerAccount, setMakerAccount] = React.useState('')
  // eslint-disable-next-line prettier/prettier
  const address = contractAddress.getContractAddressesForChainOrThrow(chainId)
  const exchangeProxyAddress = address.exchangeProxy
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

  const approveSellAmount = async (amount) => {
    const amountBigNumber = parseUnits(amount.toString())
    await takerTokenContract.methods
      .approve(exchangeProxyAddress, amountBigNumber)
      .send({ from: makerAccount })

    const allowance = await takerTokenContract.methods
      .allowance(makerAccount, exchangeProxyAddress)
      .call()
    return allowance
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      if (numberOfOptions > 0) {
        const amount = Number(
          (allowance + numberOfOptions).toFixed(
            totalDecimals(allowance, numberOfOptions)
          )
        )
        if (amount > walletBalance) {
          alert('amount entered is greater than available balance')
        } else {
          let allowance = await approveSellAmount(numberOfOptions)
          allowance = Number(formatUnits(allowance.toString(), 18))
          setRemainingApprovalAmount(allowance)
          setAllowance(allowance)
          setIsApproved(true)
          alert(
            'Total allowance' +
              allowance +
              `for ${option.referenceAsset} successfully set`
          )
        }
      } else {
        alert('please enter positive balance for approval')
      }
    } else {
      if (numberOfOptions > remainingApprovalAmount) {
        if (numberOfOptions > walletBalance) {
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
            let newAllowance = Number(
              (additionalApproval + allowance).toFixed(
                totalDecimals(additionalApproval, allowance)
              )
            )
            newAllowance = await approveSellAmount(newAllowance)
            newAllowance = Number(formatUnits(newAllowance.toString(), 18))
            setRemainingApprovalAmount(newAllowance)
            setAllowance(newAllowance)
          } else {
            //TBD discuss this case
            setIsApproved(true)
            console.log('nothing done')
          }
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
          existingLimitOrders: existingBuyLimitOrders,
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
                    let allowance = await takerTokenContract.methods
                      .allowance(makerAccount, exchangeProxyAddress)
                      .call()
                    allowance = Number(formatUnits(allowance.toString(), 18))
                    //wait for 4 secs for 0x to update orders then handle order book display
                    await new Promise((resolve) => setTimeout(resolve, 4000))
                    await props.handleDisplayOrder()
                    //reset input & you pay fields
                    Array.from(document.querySelectorAll('input')).forEach(
                      (input) => (input.value = '')
                    )
                    setNumberOfOptions(0.0)
                    setYouReceive(0.0)
                    alert('Order successfully filled')
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

  const getOptionsInWallet = async () => {
    accounts = await window.ethereum.enable()
    const makerAccount = accounts[0]
    let allowance = await takerTokenContract.methods
      .allowance(makerAccount, exchangeProxyAddress)
      .call()
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

  const getBuyLimitOrders = async (maker) => {
    const orders: any = []
    responseBuy.forEach((data: any) => {
      const order = JSON.parse(JSON.stringify(data.order))
      const takerAmount = new BigNumber(order.takerAmount)
      const makerAmount = new BigNumber(order.makerAmount)
      order['expectedRate'] = makerAmount.dividedBy(takerAmount)
      order['remainingFillableTakerAmount'] =
        data.metaData.remainingFillableTakerAmount
      orders.push(order)
    })
    const sortOrder = 'desOrder'
    const orderBy = 'expectedRate'
    const sortedOrders = stableSort(orders, getComparator(sortOrder, orderBy))
    if (sortedOrders.length) {
      const bestRate = sortedOrders[0].expectedRate
      setAvgExpectedRate(Number(bestRate))
    }

    return sortedOrders
  }

  const getMakerOrdersTotalAmount = async (maker) => {
    let existingOrderAmount = new BigNumber('0')
    if (responseSell.length == 0) {
      //Double check the any limit orders exists
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
    return Number(formatUnits(existingOrderAmount.toString(), 18))
  }

  useEffect(() => {
    getOptionsInWallet().then((val) => {
      !Number.isNaN(val.balance)
        ? setWalletBalance(Number(val.balance))
        : setWalletBalance(0)
      setMakerAccount(val.account)
      setAllowance(val.approvalAmount)
      setApprovalAmount(val.approvalAmount)
      setRemainingApprovalAmount(val.approvalAmount)
      val.approvalAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      if (responseBuy.length > 0) {
        getBuyLimitOrders(val.account).then((orders) => {
          setExistingBuyLimitOrders(orders)
        })
      }
      getMakerOrdersTotalAmount(val.account).then((amount) => {
        const remainingAmount = Number(
          (val.approvalAmount - amount).toFixed(
            totalDecimals(val.approvalAmount, amount)
          )
        )
        setRemainingApprovalAmount(remainingAmount)
        remainingAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      })
    })
  }, [responseBuy, responseSell])

  useEffect(() => {
    if (numberOfOptions > 0 && existingBuyLimitOrders.length > 0) {
      let count = numberOfOptions
      let cumulativeAvg = parseEther('0')
      let cumulativeTaker = parseEther('0')
      let cumulativeMaker = parseEther('0')
      existingBuyLimitOrders.forEach((order: any) => {
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
        const youReceive = avg * numberOfOptions
        setYouReceive(youReceive)
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
            disabled={existingBuyLimitOrders.length > 0 ? false : true}
          >
            {isApproved ? 'Fill Order' : 'Approve'}
          </Button>
        </Box>
      </form>
    </div>
  )
}
