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
  CollateralToken,
  PositionToken,
} from '../../../../../diva-subgraph/generated/schema'
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
  const positionTokenUnit = parseUnits('1')
  const collateralTokenUnit = parseUnits('1', decimals)

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
  const [remainingAllowance, setRemainingAllowance] = React.useState(ZERO)
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

  const approve = async (amount) => {
    await takerTokenContract.methods
      .approve(exchangeProxy, amount)
      .send({ from: userAddress })

    // Set allowance for position token (18 decimals)
    const optionAllowance = await takerTokenContract.methods
      .allowance(userAddress, exchangeProxy)
      .call()
    console.log('allowance', optionAllowance)

    return optionAllowance
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      // Approved amount is 0 ...

      if (numberOfOptions > 0) {
        // Calculate required allowance amount for position token incl. 1% fee (expressed as an integer with 18 decimals)
        const amountToApprove = allowance
          .add(parseUnits(convertExponentialToDecimal(numberOfOptions)))
          .mul(parseUnits(feeMultiplier)) // Adding 1% fee as position token acts as taker token in SELL MARKET which also requires approval
          .div(parseUnits('1'))
          .add(BigENumber.from(10)) // Adding a buffer of 10 to make sure that there will be always sufficient approval
        // Set allowance
        const optionAllowance = await approve(amountToApprove)

        const remainingAllowance = optionAllowance.sub(
          existingSellLimitOrdersAmountUser
        )

        setRemainingAllowance(remainingAllowance)
        setAllowance(optionAllowance)
        setIsApproved(true)
        alert(
          'Allowance for ' +
            toExponentialOrNumber(Number(formatUnits(optionAllowance))) +
            ` ${params.tokenType.toUpperCase()} tokens successfully set.`
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

        if (numberOfOptionsBN.gt(remainingAllowance)) {
          // Entered position token amount exceeds remaining allowance ...

          // Get total amount of position tokens that the user wants to sell (incl. the user's Sell Limit orders)
          const totalSellAmount = numberOfOptionsBN.add(
            existingSellLimitOrdersAmountUser
          )

          if (totalSellAmount.gt(optionBalance)) {
            // User has not enough position tokens to sell ...

            alert('Insufficient position token balance')
          } else {
            // Calculate additional allowance required to executed the Sell Market order
            const additionalAllowance =
              numberOfOptionsBN.sub(remainingAllowance)
            if (
              confirm(
                'The entered amount exceeds your current remaining allowance. Click OK to increase your allowance by ' +
                  toExponentialOrNumber(
                    Number(formatUnits(additionalAllowance))
                  ) +
                  ' ' +
                  params.tokenType.toUpperCase() +
                  ' tokens. Click Fill Order after the allowance has been updated.'
              )
            ) {
              let newAllowance = additionalAllowance
                .add(allowance)
                .add(BigENumber.from(10)) // Buffer to make sure there is always sufficient approval

              newAllowance = await approve(newAllowance)

              const remainingAllowance = newAllowance.sub(
                existingSellLimitOrdersAmountUser
              )

              setRemainingAllowance(remainingAllowance) // QUESTION: why same as in setAllowance?
              setAllowance(newAllowance)
            } else {
              setIsApproved(true) // QUESTION: not in line with BuyMarket -> Check with Harsh
              console.log('Additional approval rejected by user.')
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
      balance: BigENumber.from(balance),
      account: takerAccount,
      allowance: BigENumber.from(allowance),
    }
  }

  const getBuyLimitOrders = async () => {
    const orders: any = []
    responseBuy.forEach((data: any) => {
      const order = JSON.parse(JSON.stringify(data.order))
      const takerAmount = BigENumber.from(order.takerAmount) // position token (18 decimals)
      const makerAmount = BigENumber.from(order.makerAmount) // collateral token (<= 18 decimals)

      const remainingFillableTakerAmount =
        data.metaData.remainingFillableTakerAmount

      if (BigENumber.from(remainingFillableTakerAmount).gt(0)) {
        order['expectedRate'] = makerAmount
          .mul(parseUnits('1'))
          .div(takerAmount) // result has collateral token decimals
        console.log('expectedRate', order['expectedRate'].toString())
        order['remainingFillableTakerAmount'] = remainingFillableTakerAmount
        orders.push(order)
      }
    })

    const sortOrder = 'desOrder'
    const orderBy = 'expectedRate'
    const sortedOrders = stableSort(orders, getComparator(sortOrder, orderBy))
    if (sortedOrders.length > 0) {
      const bestRate = sortedOrders[0].expectedRate
      // TODO: Test whether bestRate is correct when multiple orders in the orderbook
      setAvgExpectedRate(bestRate)
    }
    return sortedOrders
  }

  // Check how many existing Sell Limit orders the user has outstanding in the orderbook.
  // Note that in Sell Limit, the makerToken is the position token which is the relevant token for approval in Sell Market.
  // As remainingFillableMakerAmount is not directly available, it has to be backed out from remainingFillableTakerAmount, takerAmount and makerAmount
  const getMakerOrdersTotalAmount = async (maker) => {
    let existingOrderAmount = ZERO
    if (responseSell.length == 0) {
      // Double check the any limit orders exists
      const rSell: any = await get0xOpenOrders(
        takerToken,
        makerToken,
        props.chainId
      )
      responseSell = rSell
    }
    responseSell.forEach((data: any) => {
      const order = data.order

      if (order.maker == maker) {
        const metaData = data.metaData
        const remainingFillableTakerAmount = BigENumber.from(
          metaData.remainingFillableTakerAmount
        )
        const takerAmount = BigENumber.from(order.takerAmount) // collateral token
        const makerAmount = BigENumber.from(order.makerAmount) // position token

        if (remainingFillableTakerAmount.lt(takerAmount)) {
          // As remainingFillableMakerAmount is not directly available
          // it has to be calculated based on remainingFillableTakerAmount, takerAmount and makerAmount
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
    return existingOrderAmount
  }

  useEffect(() => {
    if (userAddress != null) {
      getOptionsInWallet(userAddress).then((val) => {
        // Use values returned from getOptionsInWallet to initialize variables
        setOptionBalance(val.balance)
        setAllowance(val.allowance)
        val.allowance.lte(0) ? setIsApproved(false) : setIsApproved(true)

        // Get Buy Limit orders which the user is going to fill during the Sell Market operation
        if (responseBuy.length > 0) {
          getBuyLimitOrders().then((orders) => {
            setExistingBuyLimitOrders(orders)
          })
        }

        // Get the user's existing Sell Limit orders which block some of the user's allowance
        getMakerOrdersTotalAmount(val.account).then((amount) => {
          setExistingSellLimitOrdersAmountUser(amount)
          const remainingAmount = val.allowance.sub(amount)
          setRemainingAllowance(remainingAmount)
          remainingAmount.lte(0) ? setIsApproved(false) : setIsApproved(true)
        })
      })
    }
  }, [responseBuy, responseSell, userAddress])

  useEffect(() => {
    // Calculate expected price
    if (numberOfOptions > 0 && existingBuyLimitOrders.length > 0) {
      // If user has entered an input into the Number field and there are existing Buy Limit orders to fill in the orderbook
      setOrderBtnDisabled(false)
      let makerAmountToFill = parseUnits(numberOfOptions.toString()) // <=18 decimals as makerToken is collateral token
      let cumulativeAvg = ZERO
      let cumulativeTaker = ZERO
      let cumulativeMaker = ZERO

      // Calculate collateral amount to ... TODO
      existingBuyLimitOrders.forEach((order: any) => {
        let takerAmount = BigENumber.from(order.takerAmount) // position token amount (18 decimals)
        let makerAmount = BigENumber.from(order.makerAmount) // collateral token amount (<= 18 decimals)
        const remainingFillableTakerAmount = BigENumber.from(
          order.remainingFillableTakerAmount
        )
        const expectedRate = BigENumber.from(order.expectedRate) // <= 18 decimals

        if (remainingFillableTakerAmount.lt(takerAmount)) {
          // Existing Buy Limit order was already partially filled

          // Overwrite takerAmount and makerAmount with remaining amounts
          takerAmount = remainingFillableTakerAmount // 18 decimals
          makerAmount = remainingFillableTakerAmount
            .mul(order.expectedRate)
            .div(positionTokenUnit) // result has <= 18 decimals
        }

        if (makerAmountToFill.gt(0)) {
          if (makerAmountToFill.lte(makerAmount)) {
            const orderTotalAmount = expectedRate.mul(makerAmountToFill)
            cumulativeMaker = cumulativeMaker.add(orderTotalAmount)
            cumulativeTaker = cumulativeTaker.add(makerAmountToFill)
            makerAmountToFill = ZERO
          } else {
            cumulativeTaker = cumulativeTaker.add(takerAmount)
            cumulativeMaker = cumulativeMaker.add(makerAmount)
            makerAmountToFill = makerAmountToFill.sub(takerAmount)
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
                {toExponentialOrNumber(Number(formatUnits(remainingAllowance)))}
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
