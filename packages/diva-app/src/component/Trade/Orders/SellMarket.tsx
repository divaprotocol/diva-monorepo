import React, { useState } from 'react'
import { useEffect } from 'react'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import { sellMarketOrder } from '../../../Orders/SellMarket'
import { LabelStyle } from './UiStyles'
import { LabelStyleDiv } from './UiStyles'
import { FormDiv } from './UiStyles'
import { FormInput } from './UiStyles'
import { RightSideLabel } from './UiStyles'
import { CreateButtonWrapper } from './UiStyles'
import { ExpectedRateInfoText } from './UiStyles'
import Web3 from 'web3'
import { Pool } from '../../../lib/queries'
import { toExponentialOrNumber } from '../../../Util/utils'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-var-requires
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
  convertExponentialToDecimal,
} from './OrderHelper'
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
import { FormLabel, Stack, Tooltip } from '@mui/material'
import { useParams } from 'react-router-dom'
import { selectUserAddress } from '../../../Redux/appSlice'
import { BigNumber as BigENumber } from '@ethersproject/bignumber/lib/bignumber'
import {
  setBreakEven,
  setIntrinsicValue,
  setMaxPayout,
  setMaxYield,
} from '../../../Redux/Stats'
import { tradingFee } from '../../../constants'
import {
  calcPayoffPerToken,
  calcBreakEven,
} from '../../../Util/calcPayoffPerToken'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const web3 = new Web3(Web3.givenProvider)
const ZERO = BigENumber.from(0)
const feeMultiplier = (1 + tradingFee).toString()

export default function SellMarket(props: {
  option: Pool
  handleDisplayOrder: () => any
  tokenAddress: string
  exchangeProxy: string
  chainId: number
  usdPrice: string
}) {
  const responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  let responseSell = useAppSelector((state) => state.tradeOption.responseSell)

  const option = props.option
  const exchangeProxy = props.exchangeProxy
  const makerToken = option.collateralToken.id
  const takerToken = props.tokenAddress
  // TODO: check again why we need to use "any" here
  const takerTokenContract =
    takerToken != null && new web3.eth.Contract(ERC20_ABI as any, takerToken)
  const usdPrice = props.usdPrice
  const decimals = option.collateralToken.decimals

  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [avgExpectedRate, setAvgExpectedRate] = React.useState(ZERO)
  const [youReceive, setYouReceive] = React.useState(ZERO)
  const [existingBuyLimitOrders, setExistingBuyLimitOrders] = React.useState([])
  const [
    existingSellLimitOrdersAmountUser,
    setExistingSellLimitOrdersAmountUser,
  ] = React.useState(ZERO)
  const [isApproved, setIsApproved] = React.useState(false)
  const [orderBtnDisabled, setOrderBtnDisabled] = React.useState(true)
  const [allowance, setAllowance] = React.useState(ZERO)
  const [remainingApprovalAmount, setRemainingApprovalAmount] =
    React.useState(ZERO)
  // eslint-disable-next-line prettier/prettier
  const [optionBalance, setOptionBalance] = React.useState(ZERO) // QUESTION: Why differently implemented in BuyMarket.tsx?

  const params: { tokenType: string } = useParams()
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const dispatch = useAppDispatch()
  const isLong = window.location.pathname.split('/')[2] === 'long'

  const handleNumberOfOptions = (value: string) => {
    if (value !== '') {
      const nbrOptions = parseFloat(value)
      setNumberOfOptions(nbrOptions)
    } else {
      setYouReceive(ZERO)
      setNumberOfOptions(0.0)
      setOrderBtnDisabled(true)
    }
  }

  const approveSellAmount = async (amount) => {
    await takerTokenContract.methods
      .approve(exchangeProxy, amount)
      .send({ from: userAddress })

    // set allowance for position token (18 decimals)
    const allowance = await takerTokenContract.methods
      .allowance(userAddress, exchangeProxy)
      .call()
    console.log('allowance', allowance)

    return allowance
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      // Amount is not yet approved ...

      if (numberOfOptions > 0) {
        // Calculate required allowance amount for position token incl. 1% fee (expressed as an integer with 18 decimals)
        const amount = allowance
          .add(parseUnits(convertExponentialToDecimal(numberOfOptions)))
          .mul(parseUnits(feeMultiplier)) // Adding 1% fee as position token acts as taker token in SELL MARKET which also requires approval
          .div(parseUnits('1'))
          .add(BigENumber.from(10)) // Adding a buffer of 10 to make sure that there will be always sufficient approval

        // NOTE: decimals will need adjustment to decimals when we switch to contracts version 1.0.0
        const approvedAllowance = await approveSellAmount(amount)

        const remainingApproval = approvedAllowance.sub(
          existingSellLimitOrdersAmountUser
        )

        setRemainingApprovalAmount(remainingApproval)
        setAllowance(allowance)
        setIsApproved(true)
        alert(
          'Allowance for ' +
            approvedAllowance +
            ` ${params.tokenType.toUpperCase()} successfully set.`
        )
      } else {
        alert('Please enter a positive amount for approval.')
      }
    } else {
      // Amount is already approved ...

      if (optionBalance.gt(0)) {
        // User owns position tokens ...

        // Convert numberOfOptions into an integer of type BigNumber with 18 decimals to be used in integer math
        const numberOfOptionsBN = parseUnits(numberOfOptions.toString())

        // Get total amount of position tokens that the user wants to sell (incl. the user's Sell Limit orders)
        const totalAmount = numberOfOptionsBN.add(
          existingSellLimitOrdersAmountUser
        )

        if (numberOfOptionsBN.gt(remainingApprovalAmount)) {
          if (totalAmount.gt(optionBalance)) {
            // QUESTION: Why is this inside this if block and not earlier?
            alert('Insufficient balance')
          } else {
            const additionalApproval = numberOfOptionsBN.sub(
              remainingApprovalAmount
            )
            if (
              confirm(
                'The entered amount exceeds your current remaining allowance. Click OK to increase your allowance by ' +
                  toExponentialOrNumber(
                    Number(formatUnits(additionalApproval))
                  ) +
                  ' ' +
                  params.tokenType.toUpperCase() +
                  ' tokens. Click Fill Order after the allowance has been updated.'
              )
            ) {
              let newAllowance = additionalApproval
                .add(allowance)
                .add(BigENumber.from(10)) // Buffer to make sure there is always sufficient approval

              newAllowance = await approveSellAmount(newAllowance)

              setRemainingApprovalAmount(newAllowance) // QUESTION: why same as in setAllowance?
              setAllowance(newAllowance)
            } else {
              //TBD discuss this case
              setIsApproved(true) // QUESTION: not in line with BuyMarket -> Check with Harsh
              console.log('nothing done')
            }
          }
        } else {
          const orderData = {
            taker: userAddress,
            provider: web3,
            isBuy: false,
            nbrOptions: numberOfOptions, // Number of position tokens the user wants to sell
            collateralDecimals: decimals,
            makerToken: makerToken,
            takerToken: takerToken,
            ERC20_ABI: ERC20_ABI,
            avgExpectedRate: avgExpectedRate,
            existingLimitOrders: existingBuyLimitOrders,
            chainId: props.chainId,
          }
          sellMarketOrder(orderData).then(async (orderFillStatus: any) => {
            let orderFilled = false
            if (!(orderFillStatus == undefined)) {
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
                      setYouReceive(0.0)
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
              setYouReceive(0.0)
            }
            if (orderFilled) {
              alert('Order successfully filled.')
            }
          })
        }
      } else {
        alert(
          'No ' + params.tokenType.toUpperCase() + ' tokens available to sell.'
        )
      }
    }
  }

  const userAddress = useAppSelector(selectUserAddress)

  const getOptionsInWallet = async (takerAccount: string) => {
    let allowance = await takerTokenContract.methods
      .allowance(takerAccount, exchangeProxy)
      .call()
    let balance = await takerTokenContract.methods
      .balanceOf(takerAccount)
      .call()
    balance = Number(formatUnits(balance.toString(), 18))
    allowance = Number(formatUnits(allowance.toString(), 18))
    return {
      balance: balance,
      account: takerAccount,
      approvalAmount: allowance,
    }
  }

  const getBuyLimitOrders = async () => {
    const orders: any = []
    responseBuy.forEach((data: any) => {
      const order = JSON.parse(JSON.stringify(data.order))
      const makerAmount = Number(formatUnits(order.makerAmount, decimals))
      const takerAmount = Number(formatUnits(order.takerAmount))

      const remainingFillableTakerAmount =
        data.metaData.remainingFillableTakerAmount

      if (BigENumber.from(remainingFillableTakerAmount).gt(1)) {
        // > 1 to filter out dust orders
        if (totalDecimals(makerAmount, takerAmount) > 1) {
          order['expectedRate'] = (makerAmount / takerAmount).toFixed(
            totalDecimals(makerAmount, takerAmount)
          )
        } else {
          order['expectedRate'] = makerAmount / takerAmount
        }
        order['remainingFillableTakerAmount'] = remainingFillableTakerAmount
        orders.push(order)
      }
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

  // Check how many existing sell limit orders the user has outstanding in the orderbook.
  // Note that in Sell Limit, the makerToken is the position token which is the relevant token for approval in Sell Market.
  // As remainingFillableMakerAmount is not directly available, it has to be backed out from remainingFillableTakerAmount, takerAmount and makerAmount
  const getMakerOrdersTotalAmount = async (maker) => {
    let existingOrderAmount = BigENumber.from(0)
    if (responseSell.length == 0) {
      //Double check the any limit orders exists
      const rSell: any = await get0xOpenOrders(
        takerToken,
        makerToken,
        props.chainId
      )
      responseSell = rSell
    }
    responseSell.forEach((data: any) => {
      const order = data.order

      if (maker == order.maker) {
        const metaData = data.metaData
        const remainingFillableTakerAmount = BigENumber.from(
          metaData.remainingFillableTakerAmount
        )
        const takerAmount = BigENumber.from(order.takerAmount) // collateral token
        const makerAmount = BigENumber.from(order.makerAmount) // position token

        if (remainingFillableTakerAmount.lt(makerAmount)) {
          // const makerAmount = new BigNumber(makerAmount)
          // const takerAmount = new BigNumber(takerAmount)
          // const askAmount = takerAmount.div(makerAmount)
          // const quantity = remainingFillableTakerAmount.div(askAmount)

          // Note: the resulting remainingFillableMakerAmount has 18 decimals
          // Scaling factors cancel out, hence it's straightforward calcs in that case
          const remainingFillableMakerAmount = remainingFillableTakerAmount
            .mul(makerAmount)
            .div(takerAmount)
          existingOrderAmount = existingOrderAmount.add(
            remainingFillableMakerAmount
          )
        } else {
          existingOrderAmount = existingOrderAmount.add(makerAmount)
        }
      }
    })
    return Number(formatUnits(existingOrderAmount.toString(), 18))
  }

  useEffect(() => {
    getOptionsInWallet(userAddress).then((val) => {
      !isNaN(val.balance) ? setOptionBalance(val.balance) : setOptionBalance(0)
      setAllowance(val.approvalAmount)
      setRemainingApprovalAmount(val.approvalAmount)
      val.approvalAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      if (responseBuy.length > 0) {
        getBuyLimitOrders().then((orders) => {
          setExistingBuyLimitOrders(orders)
        })
      }
      getMakerOrdersTotalAmount(val.account).then((amount) => {
        setExistingSellLimitOrdersAmountUser(amount)
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
      setOrderBtnDisabled(false)
      let count = numberOfOptions
      let cumulativeAvg = 0
      let cumulativeTaker = 0
      let cumulativeMaker = 0
      existingBuyLimitOrders.forEach((order: any) => {
        let makerAmount = Number(formatUnits(order.makerAmount, decimals))
        let takerAmount = Number(formatUnits(order.takerAmount))
        const remainingFillableTakerAmount = order.remainingFillableTakerAmount

        if (remainingFillableTakerAmount < takerAmount) {
          takerAmount = remainingFillableTakerAmount
          makerAmount = remainingFillableTakerAmount * order.expectedRate
        }
        const expectedRate = order.expectedRate
        if (count > 0) {
          if (count <= takerAmount) {
            const orderTotalAmount = Number(expectedRate * count)
            cumulativeMaker = cumulativeMaker + orderTotalAmount
            cumulativeTaker = cumulativeTaker + count
            count = 0
          } else {
            cumulativeTaker = cumulativeTaker + takerAmount
            cumulativeMaker = cumulativeMaker + makerAmount
            count = count - takerAmount
          }
        }
      })
      if (totalDecimals(cumulativeMaker, cumulativeTaker) > 1) {
        cumulativeAvg = Number(
          (cumulativeMaker / cumulativeTaker).toFixed(
            totalDecimals(cumulativeMaker, cumulativeTaker)
          )
        )
      } else {
        cumulativeAvg = Number(cumulativeMaker / cumulativeTaker)
      }
      if (cumulativeAvg > 0) {
        const avg = cumulativeAvg
        setAvgExpectedRate(avg)
        const youReceive = avg * numberOfOptions
        setYouReceive(youReceive)
      }
    } else {
      if (numberOfOptions == 0) {
        if (existingBuyLimitOrders.length > 0) {
          setAvgExpectedRate(Number(existingBuyLimitOrders[0].expectedRate))
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
      decimals
    )
    if (avgExpectedRate > 0) {
      dispatch(
        setMaxYield(
          parseFloat(
            formatEther(
              parseEther(maxPayout)
                .mul(parseEther('1'))
                .div(parseEther(convertExponentialToDecimal(avgExpectedRate)))
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
        dispatch(setIntrinsicValue(formatUnits(payoffPerLongToken, decimals)))
      }
      dispatch(
        setMaxPayout(
          formatEther(
            BigENumber.from(option.collateralBalanceLongInitial)
              .add(BigENumber.from(option.collateralBalanceShortInitial))
              .mul(parseUnits('1', 18 - decimals))
              .mul(parseEther('1'))
              .div(BigENumber.from(option.supplyInitial))
          )
        )
      )
    } else {
      if (option.statusFinalReferenceValue === 'Open' && usdPrice == '') {
        dispatch(setIntrinsicValue('n/a'))
      } else {
        dispatch(setIntrinsicValue(formatUnits(payoffPerShortToken, decimals)))
      }
      dispatch(
        setMaxPayout(
          formatEther(
            BigENumber.from(option.collateralBalanceLongInitial)
              .add(BigENumber.from(option.collateralBalanceShortInitial))
              .mul(parseUnits('1', 18 - decimals))
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
            <Stack>
              <LabelStyle>Number </LabelStyle>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                Remaining allowance:{' '}
                {toExponentialOrNumber(
                  Number(formatUnits(remainingApprovalAmount))
                )}
              </FormLabel>
            </Stack>
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
              <LabelStyle>Expected Price </LabelStyle>
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
            <LabelStyle>You Receive</LabelStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                {option.collateralToken.symbol + ' '}
              </FormLabel>
              <FormLabel>
                {toExponentialOrNumber(
                  Number(formatUnits(youReceive, decimals))
                )}
              </FormLabel>
            </Stack>
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>Wallet Balance</LabelStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                {params.tokenType.toUpperCase() + ' '}
              </FormLabel>
              <FormLabel>{toExponentialOrNumber(optionBalance)}</FormLabel>
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
