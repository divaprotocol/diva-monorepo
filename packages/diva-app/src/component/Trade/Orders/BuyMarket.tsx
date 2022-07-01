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
import Web3 from 'web3'
import { Pool } from '../../../lib/queries'
import { toExponentialOrNumber } from '../../../Util/utils'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-var-requires
import ERC20_ABI from '@diva/contracts/abis/erc20.json'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
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
// eslint-disable-next-line @typescript-eslint/no-var-requires
const web3 = new Web3(Web3.givenProvider)
const ZERO = BigNumber.from(0)
const feeMultiplier = (1 + tradingFee).toString()

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

  const userAddress = useAppSelector(selectUserAddress)

  const option = props.option
  const exchangeProxy = props.exchangeProxy
  const makerToken = props.tokenAddress
  const takerToken = option.collateralToken.id
  const takerTokenContract =
    takerToken != null && new web3.eth.Contract(ERC20_ABI as any, takerToken)
  const usdPrice = props.usdPrice
  const decimals = option.collateralToken.decimals
  const positionTokenUnit = parseUnits('1')
  const collateralTokenUnit = parseUnits('1', decimals)

  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [avgExpectedRate, setAvgExpectedRate] = React.useState(ZERO)
  const [youPay, setYouPay] = React.useState(ZERO)
  const [existingSellLimitOrders, setExistingSellLimitOrders] = React.useState(
    []
  )
  const [
    existingBuyLimitOrdersAmountUser,
    setExistingBuyLimitOrdersAmountUser,
  ] = React.useState(ZERO)
  const [isApproved, setIsApproved] = React.useState(false)
  const [orderBtnDisabled, setOrderBtnDisabled] = React.useState(true)
  const [allowance, setAllowance] = React.useState(ZERO)
  const [remainingAllowance, setRemainingAllowance] = React.useState(ZERO)
  // eslint-disable-next-line prettier/prettier
  const [collateralBalance, setCollateralBalance] = React.useState(
    ZERO
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
      setYouPay(ZERO)
      setNumberOfOptions(0.0)
      setOrderBtnDisabled(true)
    }
  }

  const approve = async (amount) => {
    await takerTokenContract.methods
      .approve(exchangeProxy, amount)
      .send({ from: userAddress })

    // Set allowance for collateral token (<=18 decimals)
    const collateralAllowance = await takerTokenContract.methods
      .allowance(userAddress, exchangeProxy)
      .call()
    console.log('collateralAllowance', collateralAllowance)

    return collateralAllowance
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      // Approved amount is 0 ...

      if (numberOfOptions > 0) {
        // Calculate required allowance amount for collateral token assuming 1% fee (expressed as an integer with collateral token decimals (<= 18)).
        // NOTE: The assumption that the maximum fee is 1% may not be valid in the future as market makers start posting orders with higher fees.
        // In the worst case, the amountToApprove will be too small due to fees being higher than 1% and the fill transaction may fail.
        // TODO: Exclude orders that have a fee higher than 1% from the orderbook so that users will not get screwed.
        const amountToApprove = allowance
          .add(youPay) // youPay is already including fee, hence no feeMultiplier needed in that case
          .add(BigNumber.from(100)) // Adding a buffer of 10 to make sure that there will be always sufficient approval
        // Set allowance
        const collateralAllowance = await approve(amountToApprove)

        const remainingAllowance = collateralAllowance.sub(
          existingBuyLimitOrdersAmountUser
        )

        setRemainingAllowance(remainingAllowance)
        setAllowance(collateralAllowance)
        setIsApproved(true)
        alert(
          `Allowance for ${toExponentialOrNumber(
            Number(formatUnits(collateralAllowance, decimals))
          )} ${option.collateralToken.symbol} tokens successfully set.`
        )
      } else {
        alert(
          `Please enter the number of ${params.tokenType.toUpperCase()} tokens you want to buy.`
        )
      }
    } else {
      // Approved amount is > 0 ...

      if (collateralBalance.gt(0)) {
        // User owns collateral tokens ...

        // youPay is the amount of collateral token that the user would need to pay for the nbrOfOptions entered.
        // It is calculated further down in the code based on the nbrOfOptions to buy entered by the user.
        if (youPay.gt(remainingAllowance)) {
          // Collateral token amount to pay exceeds remaining allowance ...

          if (youPay.gt(collateralBalance)) {
            // User not enough collateral tokens to pay for the purchase ...

            alert('Insufficient collateral token balance')
          } else {
            // Integer with collateral token decimals
            const additionalAllowance = youPay.sub(remainingAllowance)
            if (
              confirm(
                'The entered amount exceeds your current remaining allowance. Click OK to increase your allowance by ' +
                  toExponentialOrNumber(
                    Number(formatUnits(additionalAllowance, decimals))
                  ) +
                  ' ' +
                  option.collateralToken.symbol +
                  ' tokens. Click Fill Order after the allowance has been updated.'
              )
            ) {
              let newAllowance = additionalAllowance
                .add(allowance)
                .add(BigNumber.from(100)) // Buffer to ensure that there is always sufficient approval

              newAllowance = await approve(newAllowance)

              const remainingAllowance = newAllowance.sub(
                existingBuyLimitOrdersAmountUser
              )

              setRemainingAllowance(remainingAllowance)
              setAllowance(newAllowance)
            } else {
              // QUESTION: setIsApproved(true) needed here (see SellMarket)?
              console.log('Additional approval rejected by user.')
            }
          }
        } else {
          const orderData = {
            taker: userAddress,
            provider: web3,
            isBuy: true,
            nbrOptions: numberOfOptions,
            collateralDecimals: decimals,
            makerToken: makerToken,
            takerToken: takerToken,
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
                      setYouPay(ZERO)
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
              setYouPay(ZERO)
            }
            if (orderFilled) {
              alert('Order successfully filled.')
            }
          })
        }
      } else {
        alert('No collateral tokens availabe to buy.')
      }
    }
  }

  const getCollateralInWallet = async (takerAccount: string) => {
    const allowance = await takerTokenContract.methods
      .allowance(takerAccount, exchangeProxy)
      .call()
    const balance = await takerTokenContract.methods
      .balanceOf(takerAccount)
      .call()
    return {
      balance: BigNumber.from(balance),
      account: takerAccount,
      allowance: BigNumber.from(allowance),
    }
  }

  const getSellLimitOrders = async () => {
    const orders: any = []
    responseSell.forEach((data: any) => {
      const order = JSON.parse(JSON.stringify(data.order))
      const takerAmount = BigNumber.from(order.takerAmount) // collateral token (<= 18 decimals)
      const makerAmount = BigNumber.from(order.makerAmount) // position token (18 decimals)

      const remainingFillableTakerAmount =
        data.metaData.remainingFillableTakerAmount

      if (BigNumber.from(remainingFillableTakerAmount).gt(0)) {
        order['expectedRate'] = takerAmount
          .mul(positionTokenUnit)
          .div(makerAmount) // result has collateral token decimals
        order['remainingFillableTakerAmount'] = remainingFillableTakerAmount
        orders.push(order)
      }
    })

    const sortOrder = 'ascOrder'
    const orderBy = 'expectedRate'
    const sortedOrders = stableSort(orders, getComparator(sortOrder, orderBy))
    if (sortedOrders.length > 0) {
      const bestRate = sortedOrders[0].expectedRate
      // TODO: Test whether bestRate is correct when multiple orders in the orderbook
      setAvgExpectedRate(bestRate)
    }
    return sortedOrders
  }

  // Check how many existing Buy Limit orders the user has outstanding in the orderbook.
  // Note that in Buy Limit, the makerToken is the collateral token which is the relevant token for approval in Buy Market.
  // As remainingFillableMakerAmount is not directly available, it has to be backed out from remainingFillableTakerAmount, takerAmount and makerAmount
  const getTakerOrdersTotalAmount = async (maker) => {
    let existingOrderAmount = ZERO
    if (responseBuy.length == 0) {
      // Double check if any limit orders exists
      const rBuy: any = await get0xOpenOrders(
        takerToken,
        makerToken,
        props.chainId
      )
      responseBuy = rBuy
    }
    responseBuy.forEach((data: any) => {
      const order = data.order

      if (order.maker == maker) {
        const metaData = data.metaData
        const remainingFillableTakerAmount = BigNumber.from(
          metaData.remainingFillableTakerAmount
        )
        const takerAmount = BigNumber.from(order.takerAmount) // position token
        const makerAmount = BigNumber.from(order.makerAmount) // collateral token

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
      getCollateralInWallet(userAddress).then(async (val) => {
        // Use values returned from getCollateralInWallet to initialize variables
        setCollateralBalance(val.balance)
        setAllowance(val.allowance)
        val.allowance.lte(0) ? setIsApproved(false) : setIsApproved(true)

        // Get Sell Limit orders which the user is going to fill during the Buy Market operation
        if (responseSell.length > 0) {
          getSellLimitOrders().then((orders) => {
            setExistingSellLimitOrders(orders)
          })
        }

        // Get the user's existing Buy Limit orders which block some of the user's allowance
        getTakerOrdersTotalAmount(val.account).then((amount) => {
          setExistingBuyLimitOrdersAmountUser(amount)
          const remainingAmount = val.allowance.sub(amount)
          setRemainingAllowance(remainingAmount)
          remainingAmount.lte(0) ? setIsApproved(false) : setIsApproved(true)
        })
      })
    }
  }, [responseSell, responseBuy, userAddress])

  useEffect(() => {
    // Calculate average price
    if (numberOfOptions > 0 && existingSellLimitOrders.length > 0) {
      // If user has entered an input into the Number field and there are existing Sell Limit orders to fill in the orderbook...

      setOrderBtnDisabled(false)
      // User input (numberOfOptions) corresponds to the maker token in Sell Limit.
      let makerAmountToFill = parseUnits(
        convertExponentialToDecimal(numberOfOptions)
      ) // 18 decimals

      let cumulativeAvgRate = ZERO
      let cumulativeTaker = ZERO
      let cumulativeMaker = ZERO

      // Calculate average price. Note that if numberOfOptions exceeds the amount in the orderbook,
      // existing orders will be cleared and a portion will remain unfilled.
      // TODO: Consider showing a message to user when desired buy amount exceeds the available amount in the orderbook.
      existingSellLimitOrders.forEach((order: any) => {
        // Loop through each Sell Limit order where makerToken = position token (18 decimals) and takerToken = collateral token (<= 18 decimals)

        let takerAmount = BigNumber.from(order.takerAmount)
        let makerAmount = BigNumber.from(order.makerAmount)
        const remainingFillableTakerAmount = BigNumber.from(
          order.remainingFillableTakerAmount
        )
        const expectedRate = BigNumber.from(order.expectedRate) // <= 18 decimals

        // If order is already partially filled, set takerAmount equal to remainingFillableTakerAmount and makerAmount to the corresponding pro-rata fillable makerAmount
        if (remainingFillableTakerAmount.lt(takerAmount)) {
          // Existing Sell Limit order was already partially filled

          // Overwrite takerAmount and makerAmount with remaining amounts
          takerAmount = remainingFillableTakerAmount // <= 18 decimals
          makerAmount = remainingFillableTakerAmount // 18 decimals
            .mul(collateralTokenUnit) // scaling for high precision integer math
            .div(expectedRate)
        }

        // If there are remaining nbrOfOptions (takerAmountToFill), then check whether the current order under consideration will be fully filled or only partially
        if (makerAmountToFill.gt(0)) {
          if (makerAmountToFill.lt(makerAmount)) {
            const takerAmountToFill = expectedRate
              .mul(makerAmountToFill)
              .div(positionTokenUnit)
            cumulativeTaker = cumulativeTaker.add(takerAmountToFill)
            cumulativeMaker = cumulativeMaker.add(makerAmountToFill)
            makerAmountToFill = ZERO // With that, it will not enter this if block again
          } else {
            cumulativeTaker = cumulativeTaker.add(takerAmount)
            cumulativeMaker = cumulativeMaker.add(makerAmount)
            makerAmountToFill = makerAmountToFill.sub(makerAmount)
          }
        }
      })
      // Calculate average price to pay excluding 1% fee (result is expressed as an integer with collateral token decimals (<= 18))
      cumulativeAvgRate = cumulativeTaker
        .mul(positionTokenUnit) // scaling for high precision integer math
        .div(cumulativeMaker)

      if (cumulativeAvgRate.gt(0)) {
        setAvgExpectedRate(cumulativeAvgRate)
        // Amount that the buyer/user has to pay including fee; result is expressed as an integer with collateral token decimals.
        // NOTE: youPay is including fees. It assumes that the maximum average fee is 1% which may not be the case if market makers
        // start posting orders with higher fee. Prevent this by excludings such orders from the orderbook.
        const youPay = cumulativeTaker
          .mul(parseUnits(feeMultiplier, decimals))
          .div(collateralTokenUnit)
        setYouPay(youPay)
      }
    } else {
      if (numberOfOptions == 0) {
        if (existingSellLimitOrders.length > 0) {
          setAvgExpectedRate(existingSellLimitOrders[0].expectedRate)
        }
      }
      setOrderBtnDisabled(true)
    }
  }, [numberOfOptions])

  useEffect(() => {
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
    const expectedPrice = Number(formatUnits(avgExpectedRate)) // ok to convert to number here as it's only for displaying stats
    if (expectedPrice > 0 && !isNaN(expectedPrice)) {
      dispatch(
        setMaxYield(
          parseFloat(
            formatUnits(
              parseUnits(maxPayout)
                .mul(positionTokenUnit)
                .div(parseUnits(convertExponentialToDecimal(expectedPrice)))
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
              <FormLabel>
                {Number(formatUnits(avgExpectedRate)).toFixed(4)}
              </FormLabel>
            </Stack>
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <Stack>
              <LabelStyle>You Pay (incl. 1% fee) </LabelStyle>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                Remaining allowance:{' '}
                {toExponentialOrNumber(
                  Number(formatUnits(remainingAllowance.toString(), decimals))
                )}
              </FormLabel>
            </Stack>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                {option.collateralToken.symbol + ' '}
              </FormLabel>
              <FormLabel>
                {toExponentialOrNumber(Number(formatUnits(youPay, decimals))) +
                  ' '}
              </FormLabel>
            </Stack>
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>Wallet Balance </LabelStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                {option.collateralToken.symbol + ' '}
              </FormLabel>
              <FormLabel>
                {toExponentialOrNumber(
                  Number(formatUnits(collateralBalance.toString(), decimals))
                )}
              </FormLabel>
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
