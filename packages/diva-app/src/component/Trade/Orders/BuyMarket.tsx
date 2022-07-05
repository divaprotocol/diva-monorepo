import React, { useState } from 'react'
import { useEffect } from 'react'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import { buyMarketOrder } from '../../../Orders/BuyMarket'
import { LabelStyle } from './UiStyles'
import { LabelStyleDiv } from './UiStyles'
import { FormDiv } from './UiStyles'
import { FormInput } from './UiStyles'
import { RightSideLabel } from './UiStyles'
import { CreateButtonWrapper } from './UiStyles'
import { ExpectedRateInfoText } from './UiStyles'
import ERC20_ABI from '@diva/contracts/abis/erc20.json'
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers/lib/utils'
import {
  getComparator,
  stableSort,
  totalDecimals,
  convertExponentialToDecimal,
} from './OrderHelper'
import { BigNumber } from '@0x/utils'
import Web3 from 'web3'
import { Pool } from '../../../lib/queries'
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
import { useParams } from 'react-router-dom'
import { FormLabel, Stack, Tooltip, useTheme } from '@mui/material'
import { selectUserAddress } from '../../../Redux/appSlice'
import { BigNumber as BigENumber } from 'ethers'
import { getUnderlyingPrice } from '../../../lib/getUnderlyingPrice'
import {
  setBreakEven,
  setIntrinsicValue,
  setMaxPayout,
  setMaxYield,
} from '../../../Redux/Stats'
import {
  calcPayoffPerToken,
  calcBreakEven,
} from '../../../Util/calcPayoffPerToken'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const web3 = new Web3(Web3.givenProvider)
export default function BuyMarket(props: {
  option: Pool
  handleDisplayOrder: () => any
  tokenAddress: string
  exchangeProxy: string
  chainId: number
  usdPrice: string
}) {
  const responseSell = useAppSelector((state) => state.tradeOption.responseSell)
  let responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)

  const option = props.option
  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [avgExpectedRate, setAvgExpectedRate] = React.useState(0.0)
  const [youPay, setYouPay] = React.useState(0.0)
  const [existingSellLimitOrders, setExistingSellLimitOrders] = React.useState(
    []
  )
  const [existingOrdersAmount, setExistingOrdersAmount] = React.useState(0.0)
  const [isApproved, setIsApproved] = React.useState(false)
  const [orderBtnDisabled, setOrderBtnDisabled] = React.useState(true)
  const [allowance, setAllowance] = React.useState(0.0)
  const [remainingApprovalAmount, setRemainingApprovalAmount] =
    React.useState(0.0)
  // eslint-disable-next-line prettier/prettier
  const exchangeProxy = props.exchangeProxy
  const makerToken = props.tokenAddress
  const [collateralBalance, setCollateralBalance] = React.useState(0)
  const takerToken = option.collateralToken.id
  // TODO: check again why we need to use "any" here
  const takerTokenContract =
    takerToken != null && new web3.eth.Contract(ERC20_ABI as any, takerToken)
  const params: { tokenType: string } = useParams()
  const theme = useTheme()
  const usdPrice = props.usdPrice
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const dispatch = useAppDispatch()
  const isLong = window.location.pathname.split('/')[2] === 'long'
  const handleNumberOfOptions = (value: string) => {
    if (value !== '') {
      const nbrOptions = parseFloat(value)
      setNumberOfOptions(nbrOptions)
    } else {
      setYouPay(0.0)
      setNumberOfOptions(0.0)
      setOrderBtnDisabled(true)
    }
  }

  const approveBuyAmount = async (amount) => {
    await takerTokenContract.methods
      .approve(
        exchangeProxy,
        amount
          .mul(parseUnits('1.01', option.collateralToken.decimals)) // accounting for fees that existing orders may have attached
          .div(parseUnits('1', option.collateralToken.decimals))
          .add(BigENumber.from(100000)) // Added buffer to ensure sufficient approval in case of rounding errors)
      )
      .send({ from: userAddress })

    const collateralAllowance = await takerTokenContract.methods
      .allowance(userAddress, exchangeProxy)
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
        console.log('amount: ', amount)
        let collateralAllowance = await approveBuyAmount(
          parseUnits(
            convertExponentialToDecimal(amount).toString(),
            option.collateralToken.decimals
          )
        )
        collateralAllowance = Number(
          formatUnits(
            collateralAllowance.toString(),
            option.collateralToken.decimals
          )
        )
        const remainingApproval = Number(
          (collateralAllowance - existingOrdersAmount).toFixed(
            totalDecimals(collateralAllowance, existingOrdersAmount)
          )
        )
        console.log('remainingApproval: ', remainingApproval)
        setRemainingApprovalAmount(remainingApproval)
        setAllowance(collateralAllowance)
        setIsApproved(true)
        alert(
          `Allowance for ${collateralAllowance} ${option.collateralToken.name} successfully set.`
        )
      } else {
        alert(
          `Please enter the number of ${params.tokenType.toUpperCase()} you want to buy.`
        )
      }
    } else {
      if (collateralBalance > 0) {
        console.log('collateralBalance > 0')
        if (youPay > remainingApprovalAmount) {
          if (youPay > collateralBalance) {
            alert('Insufficient balance')
          } else {
            console.log('youPay****', youPay.toString())
            console.log(
              'remainingApprovalAmount****',
              remainingApprovalAmount.toString()
            )

            const additionalApproval = Number(
              (youPay - remainingApprovalAmount).toFixed(
                totalDecimals(youPay, remainingApprovalAmount)
              )
            )
            if (
              confirm(
                'The entered amount exceeds your current remaining allowance. Click OK to increase your allowance by ' +
                  additionalApproval +
                  ' ' +
                  option.collateralToken.name +
                  '. Click Fill Order after the allowance has been updated.'
              )
            ) {
              const amount = existingOrdersAmount
              let newAllowance = Number(
                (additionalApproval + allowance).toFixed(
                  totalDecimals(additionalApproval, allowance)
                )
              )

              newAllowance = await approveBuyAmount(
                parseUnits(
                  convertExponentialToDecimal(newAllowance).toString(),
                  option.collateralToken.decimals
                )
              )
              newAllowance = Number(
                formatUnits(
                  newAllowance.toString(),
                  option.collateralToken.decimals
                )
              )

              const remainingApproval = Number(
                (newAllowance - amount).toFixed(
                  totalDecimals(newAllowance, existingOrdersAmount)
                )
              )
              console.log('remainingApproval', remainingApproval)

              setRemainingApprovalAmount(remainingApproval)
              setAllowance(newAllowance)
            } else {
              //TBD discuss this case
              console.log('nothing done')
            }
          }
        } else {
          const orderData = {
            takerAccount: userAddress,
            provider: web3,
            isBuy: true,
            nbrOptions: numberOfOptions,
            collateralDecimals: option.collateralToken.decimals,
            makerToken: makerToken,
            takerToken: option.collateralToken.id,
            ERC20_ABI: ERC20_ABI,
            avgExpectedRate: avgExpectedRate,
            existingLimitOrders: existingSellLimitOrders,
            chainId: props.chainId,
          }
          buyMarketOrder(orderData).then(async (orderFillStatus: any) => {
            let orderFilled = false
            if (!(orderFillStatus === undefined)) {
              if (!('logs' in orderFillStatus)) {
                alert('Order could not be filled.')
                return
              } else {
                orderFillStatus.logs.forEach(async (eventData: any) => {
                  if (!('event' in eventData)) {
                    return
                  } else {
                    if (eventData.event === 'LimitOrderFilled') {
                      //wait for 4 secs for 0x to update orders then handle order book display
                      await new Promise((resolve) => setTimeout(resolve, 4000))
                      await props.handleDisplayOrder()
                      //reset input & you pay fields
                      Array.from(document.querySelectorAll('input')).forEach(
                        (input) => (input.value = '')
                      )
                      setNumberOfOptions(0.0)
                      setYouPay(0.0)
                      orderFilled = true
                    } else {
                      alert('Order could not be filled.')
                    }
                  }
                })
              }
            } else {
              alert('Order could not be filled.')
              await props.handleDisplayOrder()
              //reset input & you pay fields
              Array.from(document.querySelectorAll('input')).forEach(
                (input) => (input.value = '')
              )
              setNumberOfOptions(0.0)
              setYouPay(0.0)
            }
            if (orderFilled) {
              alert('Order successfully filled.')
            }
          })
        }
      } else {
        alert('Collateral balance is zero')
      }
    }
  }

  const userAddress = useAppSelector(selectUserAddress)

  const getCollateralInWallet = async (takerAccount: string) => {
    let allowance = await takerTokenContract.methods
      .allowance(takerAccount, exchangeProxy)
      .call()
    allowance = Number(formatUnits(allowance, option.collateralToken.decimals))
    let balance = await takerTokenContract.methods
      .balanceOf(takerAccount)
      .call()
    balance = Number(
      formatUnits(balance.toString(), option.collateralToken.decimals)
    )
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
      const takerAmount = Number(
        formatUnits(order.takerAmount, option.collateralToken.decimals)
      )
      const makerAmount = Number(formatUnits(order.makerAmount))

      const remainingFillableTakerAmount =
        data.metaData.remainingFillableTakerAmount

      if (BigENumber.from(remainingFillableTakerAmount).gt(1)) {
        // > 1 to filter out dust orders
        if (totalDecimals(takerAmount, makerAmount) > 1) {
          order['expectedRate'] = (takerAmount / makerAmount).toFixed(
            totalDecimals(takerAmount, makerAmount)
          )
        } else {
          order['expectedRate'] = takerAmount / makerAmount
        }
        order['remainingFillableTakerAmount'] =
          data.metaData.remainingFillableTakerAmount
        orders.push(order)
      }
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
    }
  }

  const getTakerOrdersTotalAmount = async (taker) => {
    let existingOrdersAmount = BigENumber.from(0)
    if (responseBuy.length == 0) {
      //Double check any limit orders exists
      const rBuy: any = await get0xOpenOrders(
        option.collateralToken.id,
        makerToken,
        props.chainId
      )
      // if (rBuy.length > 0) {
      responseBuy = rBuy
      // }
      console.log(responseBuy)
    }
    responseBuy.forEach((data: any) => {
      const order = data.order
      const metaData = data.metaData
      if (order.maker == taker) {
        const remainingFillableTakerAmount = new BigNumber(
          metaData.remainingFillableTakerAmount.toString()
        )
        console.log(
          'remainingFillableTakerAmount',
          metaData.remainingFillableTakerAmount.toString()
        )
        console.log('takerAmount', order.takerAmount)
        console.log('order', order)
        if (remainingFillableTakerAmount == order.takerAmount) {
          console.log('Hi1')
          existingOrdersAmount = BigENumber.from(existingOrdersAmount).add(
            order.makerAmount
          )
        } else {
          console.log('Hi2')
          const makerAmount = new BigNumber(order.makerAmount)
          const takerAmount = new BigNumber(order.takerAmount)
          const bidAmount = makerAmount.dividedBy(takerAmount)
          const youPay = parseUnits(
            bidAmount.toString(),
            option.collateralToken.decimals
          )
            .mul(remainingFillableTakerAmount.toString())
            .div(parseUnits('1')) // .multipliedBy(remainingFillableTakerAmount)
          console.log('makerAmount', makerAmount.toString())
          console.log('takerAmount', takerAmount.toString())
          console.log('bidAmount', bidAmount.toString())
          console.log('youPay', youPay.toString())
          console.log('allowance', allowance.toString())
          existingOrdersAmount =
            BigENumber.from(existingOrdersAmount).add(youPay)
        }
      }
    })
    console.log(
      'existingOrdersAmount.toString()',
      existingOrdersAmount.toString()
    )
    return Number(
      formatUnits(
        existingOrdersAmount.toString(),
        option.collateralToken.decimals
      )
    )
  }

  useEffect(() => {
    if (userAddress != null) {
      console.log('allowance', allowance)
      console.log('remainingAllowance', remainingApprovalAmount)
      getCollateralInWallet(userAddress).then(async (val) => {
        console.log('approvalAmount', val.approvalAmount)
        !Number.isNaN(val.balance)
          ? setCollateralBalance(Number(val.balance))
          : setCollateralBalance(0)
        setAllowance(val.approvalAmount)
        setRemainingApprovalAmount(val.approvalAmount)
        val.approvalAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
        if (responseSell.length > 0) {
          const data = await getSellLimitOrders()
          setExistingSellLimitOrders(data.sortedOrders)
        }
        getTakerOrdersTotalAmount(val.account).then((amount) => {
          setExistingOrdersAmount(amount)
          console.log('val.approvalAmount', val.approvalAmount)
          console.log('ordersAmount: ', amount)
          const remainingAmount = Number(
            (val.approvalAmount - amount).toFixed(
              totalDecimals(val.approvalAmount, amount)
            )
          )
          console.log('remainingAmount in useEffect', remainingAmount)
          setRemainingApprovalAmount(remainingAmount)
          remainingAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
        })
        //}
      })
    }
  }, [responseSell, responseBuy, userAddress])

  useEffect(() => {
    if (numberOfOptions > 0 && existingSellLimitOrders.length > 0) {
      setOrderBtnDisabled(false)
      let count = numberOfOptions
      let cumulativeAvg = 0
      let cumulativeTaker = 0
      let cumulativeMaker = 0
      existingSellLimitOrders.forEach((order: any) => {
        let takerAmount = Number(
          formatUnits(order.takerAmount, option.collateralToken.decimals)
        )
        let makerAmount = Number(formatUnits(order.makerAmount))
        const remainingFillableTakerAmount = order.remainingFillableTakerAmount

        if (remainingFillableTakerAmount < takerAmount) {
          //Order partially filled
          takerAmount = remainingFillableTakerAmount
          const decimals = totalDecimals(
            remainingFillableTakerAmount,
            order.expectedRate
          )
          makerAmount =
            decimals > 1
              ? Number(
                  (remainingFillableTakerAmount / order.expectedRate).toFixed(
                    decimals
                  )
                )
              : Number(remainingFillableTakerAmount / order.expectedRate)
        }
        const expectedRate = order.expectedRate
        if (count > 0) {
          if (count <= makerAmount) {
            const orderTotalAmount = Number(expectedRate * count)
            cumulativeTaker = cumulativeTaker + orderTotalAmount
            cumulativeMaker = cumulativeMaker + count
            count = 0
          } else {
            cumulativeTaker = cumulativeTaker + takerAmount
            cumulativeMaker = cumulativeMaker + makerAmount
            count = count - makerAmount
          }
        }
      })
      if (totalDecimals(cumulativeTaker, cumulativeMaker) > 1) {
        cumulativeAvg = Number(
          (cumulativeTaker / cumulativeMaker).toFixed(
            totalDecimals(cumulativeTaker, cumulativeMaker)
          )
        )
      } else {
        cumulativeAvg = Number(cumulativeTaker / cumulativeMaker)
      }
      if (cumulativeAvg > 0) {
        setAvgExpectedRate(cumulativeAvg)
        const youPayAmount = cumulativeAvg * numberOfOptions
        setYouPay(youPayAmount)
      }
    } else {
      if (numberOfOptions == 0) {
        if (existingSellLimitOrders.length > 0) {
          setAvgExpectedRate(Number(existingSellLimitOrders[0].expectedRate))
        }
      }
      setOrderBtnDisabled(true)
    }
  }, [numberOfOptions])

  useEffect(() => {
    const { payoffPerLongToken, payoffPerShortToken } = calcPayoffPerToken(
      BigENumber.from(option.floor),
      BigENumber.from(option.inflection),
      BigENumber.from(option.cap),
      BigENumber.from(option.collateralBalanceLongInitial),
      BigENumber.from(option.collateralBalanceShortInitial),
      option.statusFinalReferenceValue === 'Open' && usdPrice != ''
        ? parseEther(usdPrice)
        : BigENumber.from(option.finalReferenceValue),
      BigENumber.from(option.supplyInitial),
      option.collateralToken.decimals
    )
    if (avgExpectedRate > 0 && !isNaN(avgExpectedRate)) {
      dispatch(
        setMaxYield(
          parseFloat(
            formatEther(
              parseEther(maxPayout)
                .mul(parseEther('1'))
                .div(
                  parseEther(
                    convertExponentialToDecimal(avgExpectedRate).toString()
                  )
                )
            )
          ).toFixed(2) + 'x'
        )
      )
    } else {
      dispatch(setMaxYield('n/a'))
    }

    let breakEven: number | string

    if (avgExpectedRate != 0) {
      breakEven = calcBreakEven(
        avgExpectedRate,
        option.floor,
        option.inflection,
        option.cap,
        option.collateralBalanceLongInitial,
        option.collateralBalanceShortInitial,
        isLong
      )
    } else {
      breakEven = 'n/a'
    }

    if (breakEven == 'n/a') {
      dispatch(setBreakEven('n/a'))
    } else {
      dispatch(setBreakEven(formatEther(breakEven)))
    }

    if (isLong) {
      if (option.statusFinalReferenceValue === 'Open' && usdPrice === '') {
        dispatch(setIntrinsicValue('n/a'))
      } else {
        dispatch(
          setIntrinsicValue(
            formatUnits(payoffPerLongToken, option.collateralToken.decimals)
          )
        )
      }
      dispatch(
        setMaxPayout(
          formatEther(
            BigENumber.from(option.collateralBalanceLongInitial)
              .add(BigENumber.from(option.collateralBalanceShortInitial))
              .mul(parseUnits('1', 18 - option.collateralToken.decimals))
              .mul(parseEther('1'))
              .div(BigENumber.from(option.supplyInitial))
          )
        )
      )
    } else {
      if (option.statusFinalReferenceValue === 'Open' && usdPrice == '') {
        dispatch(setIntrinsicValue('n/a'))
      } else {
        dispatch(
          setIntrinsicValue(
            formatUnits(payoffPerShortToken, option.collateralToken.decimals)
          )
        )
      }
      dispatch(
        setMaxPayout(
          formatEther(
            BigENumber.from(option.collateralBalanceLongInitial)
              .add(BigENumber.from(option.collateralBalanceShortInitial))
              .mul(parseUnits('1', 18 - option.collateralToken.decimals))
              .mul(parseEther('1'))
              .div(BigENumber.from(option.supplyInitial))
          )
        )
      )
    }
  }, [option, avgExpectedRate, usdPrice])

  return (
    <div>
      <form onSubmit={handleOrderSubmit}>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>Number</LabelStyle>
          </LabelStyleDiv>
          <FormLabel
            sx={{
              color: 'Gray',
              fontSize: 11,
              paddingTop: 2.5,
              paddingRight: 1.5,
            }}
          >
            {params.tokenType.toUpperCase() + ' '}
          </FormLabel>
          <FormInput
            type="text"
            onChange={(event) => handleNumberOfOptions(event.target.value)}
          />
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <Stack direction={'row'} spacing={0.5}>
              <FormLabel sx={{ color: 'White' }}>Expected Price </FormLabel>
              <Tooltip
                title={<React.Fragment>{ExpectedRateInfoText}</React.Fragment>}
                sx={{ color: 'Gray', fontSize: 2 }}
              >
                <InfoIcon style={{ fontSize: 15, color: 'grey' }} />
              </Tooltip>
            </Stack>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                {option.collateralToken.symbol + ' '}
              </FormLabel>
              <FormLabel>{avgExpectedRate.toFixed(4)}</FormLabel>
            </Stack>
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <Stack>
              <FormLabel sx={{ color: 'White' }}>You Pay</FormLabel>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                Remaining allowance:{' '}
                {remainingApprovalAmount.toString().includes('e')
                  ? remainingApprovalAmount.toExponential(2)
                  : remainingApprovalAmount.toFixed(4)}
              </FormLabel>
            </Stack>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                {option.collateralToken.symbol + ' '}
              </FormLabel>
              <FormLabel>{youPay.toFixed(4) + ' '}</FormLabel>
            </Stack>
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <FormLabel sx={{ color: 'White' }}>Wallet Balance</FormLabel>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                {option.collateralToken.symbol + ' '}
              </FormLabel>
              <FormLabel>{collateralBalance.toFixed(4)}</FormLabel>
            </Stack>
          </RightSideLabel>
        </FormDiv>
        <CreateButtonWrapper />
        <Box marginLeft="30%" marginTop="15%" marginBottom={2}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={<AddIcon />}
            type="submit"
            value="Submit"
            disabled={orderBtnDisabled}
          >
            {isApproved ? 'Fill Order' : 'Approve'}
          </Button>
        </Box>
      </form>
    </div>
  )
}
