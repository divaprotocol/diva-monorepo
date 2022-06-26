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
import Web3 from 'web3'
import { Pool } from '../../../lib/queries'
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
import { useParams } from 'react-router-dom'
import { FormLabel, Stack, Tooltip } from '@mui/material'
import { selectUserAddress } from '../../../Redux/appSlice'
import { BigNumber as BigENumber } from 'ethers'
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
  const exchangeProxy = props.exchangeProxy
  const makerToken = props.tokenAddress
  const usdPrice = props.usdPrice
  const decimals = option.collateralToken.decimals
  const takerToken = option.collateralToken.id
  // TODO: check again why we need to use "any" here
  const takerTokenContract =
    takerToken != null && new web3.eth.Contract(ERC20_ABI as any, takerToken)

  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [avgExpectedRate, setAvgExpectedRate] = React.useState(
    BigENumber.from(0)
  )
  const [youPay, setYouPay] = React.useState(BigENumber.from(0))
  const [existingSellLimitOrders, setExistingSellLimitOrders] = React.useState(
    []
  )
  const [isApproved, setIsApproved] = React.useState(false)
  const [orderBtnDisabled, setOrderBtnDisabled] = React.useState(true)
  const [allowance, setAllowance] = React.useState(BigENumber.from(0))
  const [remainingApprovalAmount, setRemainingApprovalAmount] = React.useState(
    BigENumber.from(0)
  )
  // eslint-disable-next-line prettier/prettier
  const [collateralBalance, setCollateralBalance] = React.useState(
    BigENumber.from(0)
  )

  const params: { tokenType: string } = useParams()
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const dispatch = useAppDispatch()
  const isLong = window.location.pathname.split('/')[2] === 'long'

  const handleNumberOfOptions = (value: string) => {
    if (value !== '') {
      const nbrOptions = parseFloat(value)
      setNumberOfOptions(nbrOptions)
    } else {
      setYouPay(BigENumber.from(0))
      setNumberOfOptions(0.0)
      setOrderBtnDisabled(true)
    }
  }

  const approveBuyAmount = async (amount) => {
    await takerTokenContract.methods
      .approve(exchangeProxy, amount)
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
        const amount = allowance.add(youPay) // collateral token decimals
        const collateralAllowance = await approveBuyAmount(amount)
        // collateralAllowance = Number(
        //   formatUnits(collateralAllowance.toString(), decimals)
        // )
        setRemainingApprovalAmount(collateralAllowance)
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
      if (collateralBalance.gt(0)) {
        if (youPay.gt(remainingApprovalAmount)) {
          if (youPay.gt(collateralBalance)) {
            alert('Insufficient balance')
          } else {
            const additionalApproval = youPay.sub(remainingApprovalAmount)
            if (
              confirm(
                'The entered amount exceeds your current remaining allowance. Click OK to increase your allowance by ' +
                  Number(formatUnits(additionalApproval, decimals)).toFixed(2) +
                  ' ' +
                  option.collateralToken.name +
                  '. Click Fill Order after the allowance has been updated.'
              )
            ) {
              let newAllowance = additionalApproval.add(allowance)

              newAllowance = await approveBuyAmount(newAllowance)
              // newAllowance = Number(
              //   formatUnits(newAllowance.toString(), decimals)
              // )

              // const remainingApproval = Number(newAllowance)
              setRemainingApprovalAmount(newAllowance)
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
            collateralDecimals: decimals,
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
                      setYouPay(BigENumber.from(0))
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
              setYouPay(BigENumber.from(0))
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
    allowance = Number(formatUnits(allowance, decimals))
    let balance = await takerTokenContract.methods
      .balanceOf(takerAccount)
      .call()
    balance = Number(formatUnits(balance.toString(), decimals))
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
      const takerAmount2 = BigENumber.from(order.takerAmount) // collateral token (<= 18 decimals)
      const makerAmount2 = BigENumber.from(order.makerAmount) // position token (18 decimals)
      console.log('takerAmount2', takerAmount2.toString())
      // const takerAmount = Number(
      //   formatUnits(order.takerAmount, option.collateralToken.decimals)
      // )
      // const makerAmount = Number(formatUnits(order.makerAmount))

      const remainingFillableTakerAmount =
        data.metaData.remainingFillableTakerAmount

      if (BigENumber.from(remainingFillableTakerAmount).gt(1)) {
        // > 1 to filter out dust orders

        // console.log('totalDecimals', totalDecimals(takerAmount, makerAmount))
        // if (totalDecimals(takerAmount, makerAmount) > 1) {
        //   order['expectedRate'] = (takerAmount / makerAmount).toFixed(
        //     totalDecimals(takerAmount, makerAmount)
        //     // TODO Why is this part needed? I don't think it's needed when doing BigNumber operations
        //   )
        // } else {
        // console.log('takerAmount', takerAmount)
        // console.log('makerAmount', makerAmount)
        order['expectedRate'] = takerAmount2
          .mul(parseUnits('1', 18 - decimals))
          .mul(parseUnits('1'))
          .div(makerAmount2) // result has 18 decimals
        console.log('expectedRate', formatUnits(order['expectedRate']))
        // }
        order['remainingFillableTakerAmount'] =
          data.metaData.remainingFillableTakerAmount
        orders.push(order)
      }
    })

    const sortOrder = 'ascOrder'
    const orderBy = 'expectedRate'
    const sortedOrders = stableSort(orders, getComparator(sortOrder, orderBy))
    console.log('sortedOrders')
    console.log(sortedOrders)
    if (sortedOrders.length > 0) {
      const bestRate = sortedOrders[0].expectedRate
      console.log('bestRate', bestRate.toString())
      // TODO: Test whether bestRate is correct when multiple orders in the orderbook
      // const rate = Number(formatUnits(bestRate)) // has 18 decimals
      setAvgExpectedRate(bestRate)
      console.log('bestRate', bestRate)
    }
    return {
      sortedOrders: sortedOrders,
    }
  }

  const getTakerOrdersTotalAmount = async (taker) => {
    let existingOrdersAmount = BigENumber.from(0)
    if (responseBuy.length == 0) {
      //Double check if any limit orders exists
      const rBuy = await get0xOpenOrders(
        option.collateralToken.id,
        makerToken,
        props.chainId
      )
      if (rBuy.length > 0) {
        responseBuy = rBuy
      }
    }
    // Check how many existing Buy Limit orders the user has currently outstanding in the orderbook.
    // Note that in Buy Limit, the makerToken is the collateral token which is the relevant token for approval in Buy Market.
    // As remainingFillableMakerAmount is not directly available, it has to be backed out from remainingFillableTakerAmount, takerAmount and makerAmount
    responseBuy.forEach((data: any) => {
      const order = data.order
      const metaData = data.metaData

      if (taker == order.maker) {
        const remainingFillableTakerAmount = BigENumber.from(
          metaData.remainingFillableTakerAmount
        )
        const takerAmount = BigENumber.from(order.takerAmount) // position token
        const makerAmount = BigENumber.from(order.makerAmount) // collateral token

        // As remainingFillableMakerAmount is not directly available
        // it has to be calculated based on remainingFillableTakerAmount, takerAmount and makerAmount
        if (remainingFillableTakerAmount.lt(takerAmount)) {
          // const makerAmount = new BigNumber(order.makerAmount)
          // const takerAmount = new BigNumber(order.takerAmount)

          // const bidAmount = makerAmount
          //   .mul(parseUnits('1', 18 - option.collateralToken.decimals)) // scale to 18 decimals
          //   .mul(parseUnits('1')) // scale to achieve high precision in integer math
          //   .div(takerAmount) // division by amount with 18 decimals
          // Note: the resulting remainingFillableMakerAmount may have less than 18 decimals
          const remainingFillableMakerAmount = remainingFillableTakerAmount
            .mul(makerAmount)
            .mul(parseUnits('1', 18 - decimals))
            .div(takerAmount)
          // bidAmount
          //   .mul(remainingFillableTakerAmount)
          //   .mul(parseUnits('1', 18 - option.collateralToken.decimals))
          existingOrdersAmount = existingOrdersAmount.add(
            remainingFillableMakerAmount
          )
        } else {
          existingOrdersAmount = existingOrdersAmount.add(makerAmount)
        }
      }
    })
    return Number(formatUnits(existingOrdersAmount.toString(), decimals))
  }

  useEffect(() => {
    if (userAddress != null) {
      getCollateralInWallet(userAddress).then(async (val) => {
        console.log('val.approvalAmount', val.approvalAmount)
        !isNaN(val.balance)
          ? setCollateralBalance(val.balance)
          : setCollateralBalance(0)
        setAllowance(val.approvalAmount)
        setRemainingApprovalAmount(val.approvalAmount)
        val.approvalAmount <= 0 ? setIsApproved(false) : setIsApproved(true) // QUESTION: when can approvalAmount be negative? -> "==" should work as well
        if (responseSell.length > 0) {
          const data = await getSellLimitOrders()
          setExistingSellLimitOrders(data.sortedOrders)
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
    }
  }, [responseSell, responseBuy, userAddress])

  useEffect(() => {
    if (numberOfOptions > 0 && existingSellLimitOrders.length > 0) {
      // If user has entered an input into the Number field and there are existing Sell Limit orders to fill in the orderbook
      setOrderBtnDisabled(false)
      let count = parseUnits(numberOfOptions.toString())
      let cumulativeAvg = BigENumber.from(0)
      let cumulativeTaker = BigENumber.from(0)
      let cumulativeMaker = BigENumber.from(0)
      existingSellLimitOrders.forEach((order: any) => {
        // let takerAmount = Number(
        //   formatUnits(order.takerAmount, option.collateralToken.decimals)
        // )
        // let makerAmount = Number(formatUnits(order.makerAmount))

        let takerAmount = BigENumber.from(order.takerAmount)
        let makerAmount = BigENumber.from(order.makerAmount)

        const remainingFillableTakerAmount = BigENumber.from(
          order.remainingFillableTakerAmount
        )

        const expectedRate = BigENumber.from(order.expectedRate)

        if (remainingFillableTakerAmount.lt(takerAmount)) {
          //Order partially filled
          takerAmount = remainingFillableTakerAmount
          // const decimals = totalDecimals(
          //   remainingFillableTakerAmount,
          //   order.expectedRate
          // )

          makerAmount = remainingFillableTakerAmount
            .mul(parseUnits('1', 18 - decimals))
            .mul(parseUnits('1'))
            .div(expectedRate)
          // decimals > 1
          //   ? Number(
          //       (remainingFillableTakerAmount / order.expectedRate).toFixed(
          //         decimals
          //       )
          //     )
          //   : Number(remainingFillableTakerAmount / order.expectedRate)
        }
        // const expectedRate = order.expectedRate
        if (count.gt(0)) {
          if (count.lte(makerAmount)) {
            const orderTotalAmount = expectedRate
              .mul(count)
              .div(parseUnits('1'))
              .div(parseUnits('1', 18 - decimals))
            cumulativeTaker = cumulativeTaker.add(orderTotalAmount)
            cumulativeMaker = cumulativeMaker.add(count)
            count = BigENumber.from(0)
          } else {
            cumulativeTaker = cumulativeTaker.add(takerAmount)
            cumulativeMaker = cumulativeMaker.add(makerAmount)
            count = count.sub(makerAmount)
          }
        }
      })
      // Calculate average price to pay (result is expressed as an integer with 18 decimals)
      cumulativeAvg = cumulativeTaker
        .mul(parseUnits('1', 18 - decimals))
        .mul(parseUnits('1'))
        .div(cumulativeMaker)
      // if (totalDecimals(cumulativeTaker, cumulativeMaker) > 1) {
      //   cumulativeAvg = Number(
      //     (cumulativeTaker / cumulativeMaker).toFixed(
      //       totalDecimals(cumulativeTaker, cumulativeMaker)
      //     )
      //   )
      // } else {
      //   cumulativeAvg = Number(cumulativeTaker / cumulativeMaker)
      // }

      if (cumulativeAvg.gt(0)) {
        console.log('cumulativeAvg', cumulativeAvg)
        setAvgExpectedRate(cumulativeAvg)
        const youPayAmount = cumulativeAvg.mul(BigENumber.from(numberOfOptions))
        setYouPay(youPayAmount)
      }
    } else {
      if (numberOfOptions == 0) {
        if (existingSellLimitOrders.length > 0) {
          console.log(
            'existingSellLimitOrders[0].expectedRate',
            existingSellLimitOrders[0].expectedRate
          )
          setAvgExpectedRate(existingSellLimitOrders[0].expectedRate)
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
    const expectedPrice = Number(formatUnits(avgExpectedRate)) // ok to convert to number here as it's only for displaying stats
    if (expectedPrice > 0 && !isNaN(expectedPrice)) {
      dispatch(
        setMaxYield(
          parseFloat(
            formatEther(
              parseEther(maxPayout)
                .mul(parseEther('1'))
                .div(
                  parseEther(
                    convertExponentialToDecimal(expectedPrice).toString()
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

    if (expectedPrice != 0) {
      breakEven = calcBreakEven(
        expectedPrice,
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
              <FormLabel>
                {Number(formatUnits(avgExpectedRate)).toFixed(4)}
              </FormLabel>
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
              <FormLabel>
                {Number(formatUnits(youPay, decimals)).toFixed(4) + ' '}
              </FormLabel>
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
