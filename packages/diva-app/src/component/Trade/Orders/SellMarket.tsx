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
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
import { FormLabel, Stack, Tooltip } from '@mui/material'
import { useParams } from 'react-router-dom'
import { selectUserAddress } from '../../../Redux/appSlice'
import { BigNumber } from 'ethers'
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
import CheckIcon from '@mui/icons-material/Check'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const web3 = new Web3(Web3.givenProvider)
const ZERO = BigNumber.from(0)
const feeMultiplier = (1 + tradingFee).toString()

export default function SellMarket(props: {
  option: Pool
  handleDisplayOrder: () => any
  tokenAddress: string
  exchangeProxy: string
  chainId: number
  usdPrice: string
  provider: any
  approve: (
    amount: BigNumber,
    tokenContract: any,
    spender: string,
    owner: string
  ) => any
}) {
  const responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  let responseSell = useAppSelector((state) => state.tradeOption.responseSell)

  const userAddress = useAppSelector(selectUserAddress)

  const option = props.option
  const exchangeProxy = props.exchangeProxy
  const makerToken = option.collateralToken.id
  const takerToken = props.tokenAddress
  const takerTokenContract =
    takerToken != null && new web3.eth.Contract(ERC20_ABI as any, takerToken)
  const usdPrice = props.usdPrice
  const decimals = option.collateralToken.decimals
  const positionTokenUnit = parseUnits('1')
  const collateralTokenUnit = parseUnits('1', decimals)

  const [numberOfOptions, setNumberOfOptions] = React.useState(ZERO) // User input field
  const [feeAmount, setFeeAmount] = React.useState(ZERO) // User input field
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
  const [optionBalance, setOptionBalance] = React.useState(ZERO)

  const params: { tokenType: string } = useParams()
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const dispatch = useAppDispatch()
  const isLong = window.location.pathname.split('/')[2] === 'long'

  const handleNumberOfOptions = (value: string) => {
    if (value !== '') {
      const nbrOptions = parseUnits(value)
      setNumberOfOptions(nbrOptions)

      // Set trading fee
      const feeAmount = nbrOptions
        .mul(parseUnits(tradingFee.toString()))
        .div(positionTokenUnit)
      setFeeAmount(feeAmount)
    } else {
      setYouReceive(ZERO)
      setNumberOfOptions(ZERO)
      setOrderBtnDisabled(true)
      setFeeAmount(ZERO)
    }
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      // Approved amount is 0 ...

      if (numberOfOptions.gt(0)) {
        // Calculate required allowance amount for position token assuming 1% fee (expressed as an integer with 18 decimals).
        // NOTE: The assumption that the maximum fee is 1% may not be valid in the future as market makers start posting orders with higher fees.
        // In the worst case, the amountToApprove will be too small due to fees being higher than 1% and the fill transaction may fail.
        // TODO: Exclude orders that have a fee higher than 1% from the orderbook so that users will not get screwed.
        const amountToApprove = allowance
          .add(numberOfOptions)
          .mul(parseUnits(feeMultiplier))
          .div(positionTokenUnit)
          .add(BigNumber.from(100)) // Adding a buffer of 10 to make sure that there will be always sufficient approval

        // Set allowance. Returns 'undefined' if rejected by user.
        const approveResponse = await props.approve(
          amountToApprove,
          takerTokenContract,
          exchangeProxy,
          userAddress
        )

        if (approveResponse !== 'undefined') {
          const optionAllowance = BigNumber.from(approveResponse)
          const remainingAllowance = optionAllowance.sub(
            existingSellLimitOrdersAmountUser
          ) // QUESTION: Do we have to deduct fees here?

          setRemainingAllowance(remainingAllowance)
          setAllowance(optionAllowance)
          setIsApproved(true)
          alert(
            `Allowance for ${toExponentialOrNumber(
              Number(formatUnits(optionAllowance))
            )} ${params.tokenType.toUpperCase()} tokens successfully set (includes allowance for 1% fee payment).`
          )
        }
      }
    } else {
      // Approved amount is > 0 ...

      if (optionBalance.gt(0)) {
        // User owns position tokens ...

        // NOTE: As the seller will have to pay fees in position token, the user is required to have more than the nbrOfOptions in his wallet.
        // User has to approve a higher amount (due to fees) that they are selling.
        // Further, note below calcs assume a maximum average fee of 1%. If this is higher, then this simplified math may fail as the user will not have enough
        // allowance/balance.
        const numberOfOptionsInclFees = numberOfOptions
          .mul(parseUnits(feeMultiplier))
          .div(positionTokenUnit)
        if (optionBalance.lt(numberOfOptionsInclFees)) {
          alert(
            `Insufficient ${params.tokenType.toUpperCase()} token balance. Try to reduce the entered amount to account for fees.`
          )
        } else {
          if (numberOfOptionsInclFees.gt(remainingAllowance)) {
            // Entered position token amount exceeds remaining allowance ...

            // Get total amount of position tokens that the user wants to sell (incl. the user's Sell Limit orders and fees)
            const totalSellAmount = numberOfOptionsInclFees.add(
              existingSellLimitOrdersAmountUser
            )

            // TODO: Consider refactoring the if clauses a bit
            if (totalSellAmount.gt(optionBalance)) {
              // User has not enough position tokens to sell ...

              alert('Insufficient position token balance')
            } else {
              // Calculate additional allowance required to executed the Sell Market order
              const additionalAllowance =
                numberOfOptionsInclFees.sub(remainingAllowance)
              if (
                confirm(
                  'The entered amount exceeds your current remaining allowance. Click OK to increase your allowance by ' +
                    toExponentialOrNumber(
                      Number(formatUnits(additionalAllowance))
                    ) +
                    ' ' +
                    params.tokenType.toUpperCase() +
                    ' tokens (includes allowance for 1% fee payment). Click FILL ORDER after the allowance has been updated.'
                )
              ) {
                const amountToApprove = additionalAllowance
                  .add(allowance)
                  .add(BigNumber.from(100)) // Buffer to make sure there is always sufficient approval

                // Set allowance. Returns 'undefined' if rejected by user.
                const approveResponse = await props.approve(
                  amountToApprove,
                  takerTokenContract,
                  exchangeProxy,
                  userAddress
                )

                if (approveResponse !== 'undefined') {
                  const newAllowance = BigNumber.from(approveResponse)
                  const remainingAllowance = newAllowance.sub(
                    existingSellLimitOrdersAmountUser
                  )

                  setRemainingAllowance(remainingAllowance)
                  setAllowance(newAllowance)
                  alert(
                    `Additional ${toExponentialOrNumber(
                      Number(formatUnits(additionalAllowance))
                    )} ${params.tokenType.toUpperCase()} tokens approved. Please proceed with the order.`
                  )
                }
              } else {
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
                        await new Promise((resolve) =>
                          setTimeout(resolve, 4000)
                        )
                        await props.handleDisplayOrder()
                        //reset input & you pay fields
                        Array.from(document.querySelectorAll('input')).forEach(
                          (input) => (input.value = '')
                        )
                        setNumberOfOptions(ZERO)
                        setYouReceive(ZERO)
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
                setNumberOfOptions(ZERO)
                setYouReceive(ZERO)
              }
              if (orderFilled) {
                alert('Order successfully filled.')
              }
            })
          }
        }
      } else {
        alert(
          'No ' + params.tokenType.toUpperCase() + ' tokens available to sell.'
        )
      }
    }
  }

  // TODO: Outsource this function into a separate file as it's the same across Buy/Sell Limit/Market
  const getOptionsInWallet = async (takerAccount: string) => {
    const allowance = await takerTokenContract.methods
      .allowance(takerAccount, exchangeProxy)
      .call()
    const balance = await takerTokenContract.methods
      .balanceOf(takerAccount)
      .call()
    return {
      balance: BigNumber.from(balance),
      allowance: BigNumber.from(allowance),
    }
  }

  const getBuyLimitOrders = async () => {
    const orders: any = []
    responseBuy.forEach((data: any) => {
      const order = JSON.parse(JSON.stringify(data.order))

      const takerAmount = BigNumber.from(order.takerAmount) // position token (18 decimals)
      const makerAmount = BigNumber.from(order.makerAmount) // collateral token (<= 18 decimals)

      const remainingFillableTakerAmount =
        data.metaData.remainingFillableTakerAmount

      if (BigNumber.from(remainingFillableTakerAmount).gt(0)) {
        // TODO Consider moving the expectedRate calcs inside get0xOpenOrders
        order['expectedRate'] = makerAmount
          .mul(positionTokenUnit)
          .div(takerAmount) // result has collateral token decimals
        order['remainingFillableTakerAmount'] = remainingFillableTakerAmount
        orders.push(order)
      }
    })

    if (orders.length > 0) {
      const bestRate = orders[0].expectedRate
      setAvgExpectedRate(bestRate)
    }

    return orders
  }

  // Check how many existing Sell Limit orders the user has outstanding in the orderbook.
  // Note that in Sell Limit, the makerToken is the position token which is the relevant token for approval.
  // As remainingFillableMakerAmount is not directly available, it has to be backed out from remainingFillableTakerAmount, takerAmount and makerAmount
  // TODO: Outsource this function into OpenOrders.ts, potentially integrate into getUserOrders function
  const getTotalSellLimitOrderAmountUser = async (maker) => {
    let existingOrdersAmount = ZERO
    if (responseSell.length == 0) {
      // Double check the any limit orders exists
      const rSell: any = await get0xOpenOrders(
        takerToken,
        makerToken,
        props.chainId,
        props.provider,
        props.exchangeProxy
      )
      responseSell = rSell
    }
    responseSell.forEach((data: any) => {
      const order = data.order

      if (order.maker == maker) {
        const metaData = data.metaData
        const remainingFillableTakerAmount = BigNumber.from(
          metaData.remainingFillableTakerAmount
        )
        const takerAmount = BigNumber.from(order.takerAmount) // collateral token
        const makerAmount = BigNumber.from(order.makerAmount) // position token

        if (remainingFillableTakerAmount.lt(takerAmount)) {
          // As remainingFillableMakerAmount is not directly available
          // it has to be calculated based on remainingFillableTakerAmount, takerAmount and makerAmount
          const remainingFillableMakerAmount = remainingFillableTakerAmount
            .mul(makerAmount)
            .div(takerAmount)
          existingOrdersAmount = existingOrdersAmount.add(
            remainingFillableMakerAmount
          )
        } else {
          existingOrdersAmount = existingOrdersAmount.add(makerAmount)
        }
      }
    })
    return existingOrdersAmount
  }

  useEffect(() => {
    if (userAddress != null) {
      getOptionsInWallet(userAddress).then(async (val) => {
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

        // Get the user's (taker) existing Sell Limit orders which block some of the user's allowance
        getTotalSellLimitOrderAmountUser(userAddress).then((amount) => {
          const remainingAmount = val.allowance.sub(amount) // May be negative if user manually revokes allowance
          setExistingSellLimitOrdersAmountUser(amount)
          setRemainingAllowance(remainingAmount)
          remainingAmount.lte(0) ? setIsApproved(false) : setIsApproved(true)
        })
      })
    }
  }, [responseBuy, responseSell, userAddress])

  useEffect(() => {
    // Calculate average price
    if (numberOfOptions.gt(0) && existingBuyLimitOrders.length > 0) {
      // If user has entered an input into the Number field and there are existing Buy Limit orders to fill in the orderbook...

      setOrderBtnDisabled(false)
      // User input (numberOfOptions) corresponds to the taker token in Buy Limit.
      let takerAmountToFill = numberOfOptions // <= 18 decimals

      let cumulativeAvgRate = ZERO
      let cumulativeTaker = ZERO
      let cumulativeMaker = ZERO

      // Calculate average price. Note that if numberOfOptions exceeds the amount in the orderbook,
      // existing orders will be cleared and a portion will remain unfilled.
      // TODO: Consider showing a message to user when desired sell amount exceeds the available amount in the orderbook.
      existingBuyLimitOrders.forEach((order: any) => {
        // Loop through each Buy Limit order where makerToken = collateral token (<= 18 decimals) and takerToken = position token (18 decimals)

        let takerAmount = BigNumber.from(order.takerAmount)
        let makerAmount = BigNumber.from(order.makerAmount)
        const remainingFillableTakerAmount = BigNumber.from(
          order.remainingFillableTakerAmount
        )
        const expectedRate = BigNumber.from(order.expectedRate) // <= 18 decimals

        // If order is already partially filled, set takerAmount equal to remainingFillableTakerAmount and makerAmount to the corresponding pro-rata fillable makerAmount
        if (remainingFillableTakerAmount.lt(takerAmount)) {
          // Existing Buy Limit order was already partially filled

          // Overwrite takerAmount and makerAmount with remaining amounts
          takerAmount = remainingFillableTakerAmount // 18 decimals
          makerAmount = remainingFillableTakerAmount
            .mul(order.expectedRate)
            .div(positionTokenUnit) // result has <= 18 decimals
        }

        // If there are remaining nbrOfOptions (takerAmountToFill), then check whether the current order under consideration will be fully filled or only partially
        if (takerAmountToFill.gt(0)) {
          if (takerAmountToFill.lt(takerAmount)) {
            const makerAmountToFill = expectedRate
              .mul(takerAmountToFill)
              .div(positionTokenUnit)
            cumulativeMaker = cumulativeMaker.add(makerAmountToFill)
            cumulativeTaker = cumulativeTaker.add(takerAmountToFill)
            takerAmountToFill = ZERO // With that, it will not enter this if block again
          } else {
            cumulativeTaker = cumulativeTaker.add(takerAmount)
            cumulativeMaker = cumulativeMaker.add(makerAmount)
            takerAmountToFill = takerAmountToFill.sub(takerAmount)
          }
        }
      })
      // Calculate average price to pay excluding 1% fee (result is expressed as an integer with collateral token decimals (<= 18))
      cumulativeAvgRate = cumulativeMaker
        .mul(positionTokenUnit) // scaling for high precision integer math
        .div(cumulativeTaker)

      if (cumulativeAvgRate.gt(0)) {
        setAvgExpectedRate(cumulativeAvgRate)
        // Amount to that the seller/user will receive; result is expressed as an integer with collateral token decimals
        const youReceive = cumulativeMaker
        setYouReceive(youReceive)
      }
    } else {
      if (numberOfOptions.eq(0)) {
        if (existingBuyLimitOrders.length > 0) {
          setAvgExpectedRate(existingBuyLimitOrders[0].expectedRate)
        }
      }
      setOrderBtnDisabled(true)
    }
  }, [numberOfOptions])

  useEffect(() => {
    if (allowance.sub(youReceive).gt(0)) {
      setIsApproved(false)
    }
    if (allowance.sub(youReceive).lte(0)) {
      setIsApproved(true)
    }
    const { payoffPerLongToken, payoffPerShortToken } = calcPayoffPerToken(
      BigNumber.from(option.floor),
      BigNumber.from(option.inflection),
      BigNumber.from(option.cap),
      BigNumber.from(option.collateralBalanceLongInitial),
      BigNumber.from(option.collateralBalanceShortInitial),
      option.statusFinalReferenceValue === 'Open' && usdPrice != ''
        ? parseUnits(usdPrice)
        : BigNumber.from(option.finalReferenceValue),
      BigNumber.from(option.supplyInitial),
      decimals
    )
    if (avgExpectedRate.gt(0)) {
      dispatch(
        setMaxYield(
          parseFloat(
            formatUnits(
              parseUnits(maxPayout, decimals)
                .mul(collateralTokenUnit)
                .div(avgExpectedRate),
              decimals
            )
          ).toFixed(2) + 'x'
        )
      )
    } else {
      dispatch(setMaxYield('n/a'))
    }

    let breakEven: number | string

    if (!avgExpectedRate.eq(0)) {
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
      dispatch(setBreakEven(formatUnits(breakEven)))
    }

    if (isLong) {
      if (option.statusFinalReferenceValue === 'Open' && usdPrice === '') {
        dispatch(setIntrinsicValue('n/a'))
      } else {
        dispatch(setIntrinsicValue(formatUnits(payoffPerLongToken, decimals)))
      }
      dispatch(
        setMaxPayout(
          formatUnits(
            BigNumber.from(option.collateralBalanceLongInitial)
              .add(BigNumber.from(option.collateralBalanceShortInitial))
              .mul(parseUnits('1', 18 - decimals))
              .mul(positionTokenUnit)
              .div(BigNumber.from(option.supplyInitial))
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
          formatUnits(
            BigNumber.from(option.collateralBalanceLongInitial)
              .add(BigNumber.from(option.collateralBalanceShortInitial))
              .mul(parseUnits('1', 18 - decimals))
              .mul(positionTokenUnit)
              .div(BigNumber.from(option.supplyInitial))
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
              paddingTop: 2,
              paddingRight: 1.5,
            }}
          >
            {params.tokenType.toUpperCase() + ' '}
          </FormLabel>
          <Stack alignItems="flex-end">
            <FormInput
              width={'78.3px'}
              type="text"
              onChange={(event) => handleNumberOfOptions(event.target.value)}
            />
            <FormLabel
              sx={{
                color: 'Gray',
                fontSize: 11,
                alignItems: 'flex-end',
                marginTop: '2px',
              }}
            >
              {toExponentialOrNumber(
                Number(formatUnits(numberOfOptions.add(feeAmount)))
              )}
            </FormLabel>
            <FormLabel
              sx={{
                color: 'Gray',
                fontSize: 11,
                alignItems: 'flex-end',
              }}
            >
              (incl. 1% fee)
            </FormLabel>
          </Stack>
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
                {option.collateralToken.symbol +
                  '/' +
                  params.tokenType.toUpperCase()}
              </FormLabel>
              <FormLabel>
                {toExponentialOrNumber(
                  Number(formatUnits(avgExpectedRate, decimals))
                )}
              </FormLabel>
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
              <FormLabel>
                {toExponentialOrNumber(Number(formatUnits(optionBalance)))}
              </FormLabel>
            </Stack>
          </RightSideLabel>
        </FormDiv>
        <CreateButtonWrapper />
        <Box marginLeft={4} marginBottom={2}>
          <Stack direction={'row'} spacing={1}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<CheckIcon />}
              type="submit"
              value="Submit"
              disabled={!isApproved || orderBtnDisabled}
            >
              {'Approve'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<AddIcon />}
              type="submit"
              value="Submit"
              disabled={isApproved || orderBtnDisabled}
            >
              {'Fill Order'}
            </Button>
          </Stack>
        </Box>
      </form>
    </div>
  )
}
