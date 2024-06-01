import React, { useState, useEffect, FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Collapse,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import AddIcon from '@mui/icons-material/Add'
import { LoadingButton } from '@mui/lab'
import { BigNumber, ethers } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { Pool } from '../../../lib/queries'
import { toExponentialOrNumber } from '../../../Util/utils'
import { buylimitOrder } from '../../../Orders/BuyLimit'
import ERC20_ABI from '../../../abi/ERC20ABI.json'
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks'
import { selectUserAddress } from '../../../Redux/appSlice'
import { setResponseBuy } from '../../../Redux/TradeOption'
import { buyMarketOrder } from '../../../Orders/BuyMarket'
import {
  calcBreakEven,
  calcPayoffPerToken,
} from '../../../Util/calcPayoffPerToken'
import { TRADING_FEE } from '../../../constants'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
import {
  setBreakEven,
  setIntrinsicValue,
  setMaxYield,
  setMaxPayout,
} from '../../../Redux/Stats'
import { useConnectionContext } from '../../../hooks/useConnectionContext'
import { useParams } from 'react-router-dom'
import styled from '@emotion/styled'

const MaxCollateral = styled.u`
  cursor: pointer;
  &:hover {
    color: ${(props) => (props.theme as any).palette.primary.main};
  }
`

const expiryOrderTime = [
  {
    value: 5,
    label: '5 Minutes',
  },
  {
    value: 10,
    label: '10 Minutes',
  },
  {
    value: 20,
    label: '20 Minutes',
  },
  {
    value: 30,
    label: '30 Minutes',
  },
  {
    value: 60,
    label: '1 Hour',
  },
  {
    value: 60 * 4,
    label: '4 Hour',
  },
  {
    value: 60 * 12,
    label: '12 Hour',
  },
  {
    value: 60 * 24,
    label: '1 Day',
  },
  {
    value: 60 * 24 * 365,
    label: '1 Year',
  },
]

const ZERO = BigNumber.from(0)

const BuyOrder = (props: {
  option: Pool
  handleDisplayOrder?: () => any
  tokenAddress: string
  exchangeProxy: string
  chainId: number
  usdPrice?: string
  provider: any
  approve: (
    amount: BigNumber,
    tokenContract: any,
    spender: string,
    owner: string
  ) => any
}) => {
  const theme = useTheme()
  const { provider } = useConnectionContext()
  const [collateralBalance, setCollateralBalance] = useState(ZERO)
  const [checked, setChecked] = useState(false)
  const [numberOfOptions, setNumberOfOptions] = useState('') // User input field
  const [pricePerOption, setPricePerOption] = useState(ZERO) // User input field
  const [feeAmount, setFeeAmount] = React.useState(ZERO) // User input field
  const [expiry, setExpiry] = useState(5) //Expiry Time
  const [avgExpectedRate, setAvgExpectedRate] = useState(ZERO) //Price Per long/short Token
  const [balanceAlert, setBalanceAlert] = useState(false) //Alert message for insufficient balance
  const [orderBookAlert, setOrderBookAlert] = useState(false) //Alert message for no Asks in BuyMarket
  /* const [amountExceedAlert, setAmountExceedAlert] = useState(false) */ // Alert message for Amount Exceed
  const [totalQuantity, setTotalQuantity] = useState(0)
  const [isApproved, setIsApproved] = useState(false)
  const [fillLoading, setFillLoading] = React.useState(false)
  const [approveLoading, setApproveLoading] = useState(false)
  const [allowance, setAllowance] = useState(ZERO)
  const [remainingAllowance, setRemainingAllowance] = useState(ZERO)
  const [youPay, setYouPay] = useState(ZERO)
  const [
    existingBuyLimitOrdersAmountUser,
    setExistingBuyLimitOrdersAmountUser,
  ] = React.useState(ZERO)
  const [existingSellLimitOrders, setExistingSellLimitOrders] = React.useState(
    []
  )
  const [orderBtnDisabled, setOrderBtnDisabled] = useState(true)

  const userAddress = useAppSelector(selectUserAddress)
  const option = props.option
  const decimals = option.collateralToken.decimals
  const exchangeProxy = props.exchangeProxy
  const tokenSymbol = option.collateralToken.symbol
  const makerToken = option.collateralToken.id
  const takerToken = props.tokenAddress
  const makerTokenContract = new ethers.Contract(
    makerToken,
    ERC20_ABI as any,
    provider?.getSigner()
  )
  const collateralTokenUnit = parseUnits('1', decimals)
  const usdPrice = props.usdPrice
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const dispatch = useAppDispatch()
  const params: { tokenType: string } = useParams()
  const isLong = window.location.pathname.split('/')[2] === 'long'
  let responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  const responseSell = useAppSelector((state) => state.tradeOption.responseSell)

  const handleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
    if (event.target.checked) {
      setFeeAmount(ZERO)
    } else {
      setPricePerOption(ZERO)
    }
  }
  const handleNumberOfOptions = (value: string) => {
    if (value !== '' && checked) {
      // LIMIT order case
      const nbrOptions = parseUnits(value, decimals)
      setNumberOfOptions(value)

      if (pricePerOption.gt(0) && nbrOptions.gt(0)) {
        const youPay = pricePerOption.mul(nbrOptions).div(collateralTokenUnit)
        setYouPay(youPay)
      }
      // Keep this outside as this if block is for limit orders and the zero fee amount applies
      // independent of any condition
      setFeeAmount(ZERO)
    } else if (value !== '') {
      // MARKET order case

      setNumberOfOptions(value)

      // Disable fill order button if youPay amount incl. fee exceeds user's collateral token balance
      if (collateralBalance.sub(youPay).sub(feeAmount).lt(0)) {
        console.log('Entered Amount exceeds position token balance of user') // TODO replace with a notification in the app at a later stage
        setOrderBtnDisabled(true)

        // TODO Below is currently not working as isApproved is updated after this part. To be revisited in a separate PR.
        // if (isApproved) {
        //   // Display message only when balance is exceeded in the presence of sufficient approval.
        //   // Otherwise the normal approval logic will take place where a user can approve a higher amount.
        //   console.log('Insufficient wallet balance')
        // }
      } else {
        setOrderBtnDisabled(false)
      }
    } else {
      setYouPay(ZERO)
      setFeeAmount(ZERO)
      setNumberOfOptions('')
      setOrderBtnDisabled(true)
    }
  }

  const handlePricePerOption = (value: string) => {
    if (value !== '') {
      const pricePerOption = parseUnits(value, decimals)
      setPricePerOption(pricePerOption)
      if (parseUnits(numberOfOptions, decimals).gt(0) && pricePerOption.gt(0)) {
        // @todo possible to use numberOfOptions.gt(0) only? or would "0." input considerd gt(0) given its a string?
        const youPay = pricePerOption
          .mul(parseUnits(numberOfOptions, decimals))
          .div(collateralTokenUnit)
        setYouPay(youPay)
        setFeeAmount(ZERO)
      }
    } else {
      setYouPay(ZERO)
      setFeeAmount(ZERO)
      setPricePerOption(ZERO)
    }
  }

  const handleExpirySelection = (event: any) => {
    event.preventDefault()
    setExpiry(
      typeof event.target.value === 'string'
        ? parseInt(event.target.value)
        : event.target.value
    )
  }

  const handleFormReset = async () => {
    Array.from(document.querySelectorAll('input')).forEach(
      (input) => (input.value = '')
    )
    setNumberOfOptions('')
    setPricePerOption(ZERO)
    setYouPay(ZERO)
    setFeeAmount(ZERO)

    const allowance = await makerTokenContract.allowance(
      userAddress,
      exchangeProxy
    )
    const remainingAllowance = BigNumber.from(allowance).sub(
      existingBuyLimitOrdersAmountUser
    )
    setRemainingAllowance(remainingAllowance)
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      // Remaining allowance - youPay (incl. fee) <= 0 (fee is 0 for LIMIT orders, i.e. if checked = true)
      setApproveLoading(true)
      if (parseUnits(numberOfOptions, decimals).gt(0)) {
        // Calculate required allowance amount for collateral token.
        // Note that `feeAmount = 0` for LIMIT order (i.e. checked = true) and > 0 otherwise.
        // Make sure that orders with fee amount > 1% are filtered out from the orderbook as it may result in
        // insufficient allowance causing the fill order operation to fail.
        const amountToApprove = allowance
          .add(youPay)
          .add(feeAmount) // 0 if checked = true (i.e. a LIMIT order is created)
          .sub(remainingAllowance)
          .add(BigNumber.from(100)) // Adding a buffer of 100 ensures that there will be always sufficient approval

        // Set allowance. Returns 'undefined' if rejected by user.
        const approveResponse = await props.approve(
          amountToApprove,
          makerTokenContract,
          exchangeProxy,
          userAddress
        )

        if (approveResponse !== 'undefined') {
          const collateralAllowance = BigNumber.from(approveResponse)
          const remainingAllowance = collateralAllowance.sub(
            existingBuyLimitOrdersAmountUser
          )

          setRemainingAllowance(remainingAllowance)
          setAllowance(collateralAllowance)
          setIsApproved(true)
          setApproveLoading(false)
          alert(
            `Total allowance updated to ${toExponentialOrNumber(
              Number(formatUnits(collateralAllowance, decimals))
            )} ${
              option.collateralToken.symbol
            }. Remaining allowance taking into account open orders: ${toExponentialOrNumber(
              Number(formatUnits(remainingAllowance, decimals))
            )} ${option.collateralToken.symbol}.`
          )
        } else {
          setApproveLoading(false)
        }
      }
    } else if (checked) {
      // LIMIT order case

      // Remaining allowance - youPay (incl. fee) > 0 (fee = 0 for LIMIT order)

      setFillLoading(true)
      const orderData = {
        maker: userAddress,
        provider: provider,
        isBuy: true,
        nbrOptions: parseUnits(numberOfOptions, decimals),
        collateralDecimals: decimals,
        makerToken: makerToken,
        takerToken: takerToken,
        limitPrice: pricePerOption,
        orderExpiry: expiry,
        chainId: props.chainId,
        exchangeProxy: exchangeProxy,
        poolId: option.id,
      }
      buylimitOrder(orderData)
        .then(async (response) => {
          if (response.status === 200) {
            //need to invalidate cache order response since orderbook is updated
            dispatch(setResponseBuy([]))

            // Wait for 2 secs for 0x to update orders, then handle order book display
            await new Promise((resolve) => setTimeout(resolve, 2000))

            await props.handleDisplayOrder()
            setFillLoading(false)
            handleFormReset()
          }
        })
        .catch(function (error) {
          setFillLoading(false)
          console.error(error)
        })
    } else {
      // MARKET order case

      // Remaining allowance - youPay (incl. fee) > 0

      setFillLoading(true)
      const orderData = {
        taker: userAddress,
        provider: provider,
        isBuy: true,
        nbrOptions: parseUnits(numberOfOptions, decimals),
        collateralDecimals: decimals,
        makerToken: makerToken,
        takerToken: takerToken,
        avgExpectedRate: avgExpectedRate,
        existingLimitOrders: existingSellLimitOrders,
        chainId: props.chainId,
      }
      buyMarketOrder(orderData)
        .then(async (orderFillStatus: any) => {
          if (!(orderFillStatus === undefined)) {
            // On fill order success ...

            // Wait for 4 secs for 0x to update orders, then handle order book display
            await new Promise((resolve) => setTimeout(resolve, 4000))

            // Reset inputs and state variables
            await props.handleDisplayOrder()
            Array.from(document.querySelectorAll('input')).forEach(
              (input) => (input.value = '')
            )
            setNumberOfOptions('')
            setFillLoading(false)
            setYouPay(ZERO)
            setFeeAmount(ZERO)
            alert('Order successfully filled.')
          } else {
            // Rejected by user or tx failure (i.e., orderFillStatus == undefined as no tx receipt was returned)
            // Do not reset values.
            setFillLoading(false)
            alert('Order could not be filled.')
          }
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }

  // TODO: Outsource this function into a separate file as it's the same across BUY/SELL LIMIT/MARKET
  const getMakerTokenAllowanceAndBalance = async (makerAccount: string) => {
    const allowance = await makerTokenContract.allowance(
      makerAccount,
      exchangeProxy
    )
    const balance = await makerTokenContract.balanceOf(makerAccount)
    return {
      balance: BigNumber.from(balance),
      allowance: BigNumber.from(allowance),
    }
  }

  // This will fetch the SELL LIMIT orders to perform the BUY MARKET operation
  const getSellLimitOrders = async () => {
    const orders: any = []
    responseSell.forEach((data: any) => {
      const order = JSON.parse(JSON.stringify(data.order))

      const takerAmount = BigNumber.from(order.takerAmount) // collateral token
      const makerAmount = BigNumber.from(order.makerAmount) // position token

      const remainingFillableTakerAmount =
        data.metaData.remainingFillableTakerAmount

      if (BigNumber.from(remainingFillableTakerAmount).gt(0)) {
        // TODO Consider moving the expectedRate calcs inside get0xOpenOrders
        order['expectedRate'] = takerAmount
          .mul(collateralTokenUnit)
          .div(makerAmount)
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
  // Check how many existing BUY LIMIT orders the user has outstanding in the orderbook.
  // Note that in BUY LIMIT, the makerToken is the collateral token which is the relevant token for approval.
  // TODO: Outsource this function into OpenOrders.ts, potentially integrate into getUserOrders function
  const getTotalBuyLimitOrderAmountUser = async (maker) => {
    let existingOrdersAmount = ZERO
    if (responseBuy.length == 0) {
      // Double check whether any limit orders exist
      const rBuy: any = await get0xOpenOrders(
        makerToken,
        takerToken,
        props.chainId,
        props.provider,
        props.exchangeProxy
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
        const takerAmount = BigNumber.from(order.takerAmount)
        const makerAmount = BigNumber.from(order.makerAmount)

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
      getMakerTokenAllowanceAndBalance(userAddress).then(async (val) => {
        // Use values returned from getMakerTokenAllowanceAndBalance to initialize variables
        setCollateralBalance(val.balance)
        setAllowance(val.allowance)

        // Get SELL LIMIT orders which the user is going to fill during the BUY MARKET operation
        if (responseSell.length > 0) {
          getSellLimitOrders().then((orders) => {
            setExistingSellLimitOrders(orders)
          })
        }

        // Get the user's (maker) existing BUY LIMIT orders which block some of the user's allowance
        getTotalBuyLimitOrderAmountUser(userAddress).then((amount) => {
          const remainingAmount = val.allowance.sub(amount) // May be negative if user manually revokes allowance but should go back to zero if 0x orders are refreshed and reflect the actually fillable amount
          setExistingBuyLimitOrdersAmountUser(amount)
          setRemainingAllowance(remainingAmount)
        })
      })
    }
  }, [responseBuy, responseSell, userAddress, provider, checked])

  //to calculate the total no of order quantity
  /*  useEffect(() => {
    const QuantitiesOrderBook = existingSellLimitOrders.map((order) =>
      Number(formatUnits(order.makerAmount, decimals))
    )
    let sumOfQuantity = 0
    QuantitiesOrderBook.forEach((quantity) => (sumOfQuantity += quantity))
    setTotalQuantity(sumOfQuantity)
  }, [numberOfOptions]) */

  //useEffect function to fetch the average price for the BUY MARKET order
  useEffect(() => {
    if (!checked) {
      // Calculate average price
      if (numberOfOptions != '') {
        if (
          parseUnits(numberOfOptions, decimals).gt(0) &&
          existingSellLimitOrders.length > 0
        ) {
          // If user has entered an input into the Amount field and there are existing SELL LIMIT orders to fill in the orderbook...

          // User input (numberOfOptions) corresponds to the maker token in SELL LIMIT.
          let makerAmountToFill = parseUnits(numberOfOptions, decimals)

          let cumulativeAvgRate = ZERO
          let cumulativeTaker = ZERO
          let cumulativeMaker = ZERO

          // Calculate average price. Note that if numberOfOptions exceeds the amount in the orderbook,
          // existing orders will be cleared and a portion will remain unfilled.
          // TODO: Consider showing a message to user when desired buy amount exceeds the available amount in the orderbook.
          existingSellLimitOrders.forEach((order: any) => {
            // Loop through each SELL LIMIT order where makerToken = position token and takerToken = collateral token

            let takerAmount = BigNumber.from(order.takerAmount)
            let makerAmount = BigNumber.from(order.makerAmount)
            const remainingFillableTakerAmount = BigNumber.from(
              order.remainingFillableTakerAmount
            )
            const expectedRate = BigNumber.from(order.expectedRate)

            // If order is already partially filled, set takerAmount equal to remainingFillableTakerAmount and makerAmount to the corresponding pro-rata fillable makerAmount
            if (remainingFillableTakerAmount.lt(takerAmount)) {
              // Existing SELL LIMIT order was already partially filled

              // Overwrite takerAmount and makerAmount with remaining amounts
              takerAmount = remainingFillableTakerAmount
              makerAmount = remainingFillableTakerAmount
                .mul(collateralTokenUnit) // scaling for high precision integer math
                .div(expectedRate)
            }

            // If there are remaining nbrOfOptions (takerAmountToFill), then check whether the current order under consideration will be fully filled or only partially
            if (makerAmountToFill.gt(0)) {
              if (makerAmountToFill.lt(makerAmount)) {
                const takerAmountToFill = expectedRate
                  .mul(makerAmountToFill)
                  .div(collateralTokenUnit)
                cumulativeMaker = cumulativeMaker.add(makerAmountToFill)
                cumulativeTaker = cumulativeTaker.add(takerAmountToFill)
                makerAmountToFill = ZERO // With that, it will not enter this if block again
              } else {
                cumulativeTaker = cumulativeTaker.add(takerAmount)
                cumulativeMaker = cumulativeMaker.add(makerAmount)
                makerAmountToFill = makerAmountToFill.sub(makerAmount)
              }
            }
          })

          // Calculate average price to pay excluding 1% fee
          cumulativeAvgRate = cumulativeTaker
            .mul(collateralTokenUnit) // scaling for high precision integer math
            .div(cumulativeMaker)

          if (cumulativeAvgRate.gt(0)) {
            setAvgExpectedRate(cumulativeAvgRate)
            // Amount that the buyer/user has to pay excluding fee.
            const youPay = cumulativeTaker
            setYouPay(youPay)

            // Calculate fee amount (to be paid in collateral token)
            const feeAmount = cumulativeTaker
              .mul(parseUnits(TRADING_FEE.toString(), decimals))
              .div(collateralTokenUnit)
            setFeeAmount(feeAmount)
          }
        } else {
          if (parseUnits(numberOfOptions, decimals).eq(0)) {
            if (existingSellLimitOrders.length > 0) {
              setAvgExpectedRate(existingSellLimitOrders[0].expectedRate)
            }
          }
          setOrderBtnDisabled(true)
        }
      }
    }
  }, [numberOfOptions, checked])

  useEffect(() => {
    const { payoffPerLongToken, payoffPerShortToken } = calcPayoffPerToken(
      BigNumber.from(option.floor),
      BigNumber.from(option.inflection),
      BigNumber.from(option.cap),
      BigNumber.from(option.gradient),
      option.statusFinalReferenceValue === 'Open' && usdPrice != ''
        ? parseUnits(usdPrice)
        : BigNumber.from(option.finalReferenceValue),
      decimals
    )
    if (pricePerOption.gt(0)) {
      dispatch(
        setMaxYield(
          parseFloat(
            formatUnits(
              parseUnits(maxPayout, decimals)
                .mul(collateralTokenUnit)
                .div(pricePerOption),
              decimals
            )
          ).toFixed(2) + 'x'
        )
      )
    } else if (avgExpectedRate.gt(0)) {
      dispatch(
        // TODO Consider simplifying that formula
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

    let breakEven: BigNumber | string

    if (!pricePerOption.eq(0)) {
      breakEven = calcBreakEven(
        pricePerOption,
        option.floor,
        option.inflection,
        option.cap,
        option.gradient,
        isLong,
        decimals
      )
    } else if (!avgExpectedRate.eq(0)) {
      breakEven = calcBreakEven(
        avgExpectedRate,
        option.floor,
        option.inflection,
        option.cap,
        option.gradient,
        isLong,
        decimals
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
      dispatch(setMaxPayout('1'))
    } else {
      if (option.statusFinalReferenceValue === 'Open' && usdPrice == '') {
        dispatch(setIntrinsicValue('n/a'))
      } else {
        dispatch(setIntrinsicValue(formatUnits(payoffPerShortToken, decimals)))
      }
      dispatch(setMaxPayout('1'))
    }
  }, [
    allowance,
    option,
    avgExpectedRate,
    pricePerOption, // TODO Consider renaming to "pricePerPositionToken"
    usdPrice, // TODO Consider renaming to "underlyingValue"
    existingBuyLimitOrdersAmountUser,
    userAddress,
  ])

  useEffect(() => {
    if (remainingAllowance.sub(youPay).sub(feeAmount).lte(0)) {
      setIsApproved(false)
    } else {
      setIsApproved(true)
    }
  }, [remainingAllowance, youPay, userAddress])

  // Alert message for Insuffcientbalance & No Asks on OrderBook
  useEffect(() => {
    if (numberOfOptions != '') {
      if (youPay.gt(collateralBalance) && youPay.lte(remainingAllowance)) {
        setBalanceAlert(true)
      } else {
        setBalanceAlert(false)
      }
      if (!checked && avgExpectedRate.eq(0)) {
        setOrderBookAlert(true)
      } else {
        setOrderBookAlert(false)
      } /* 
      if (
        youPay.gt(collateralBalance) ||
        (!checked && Number(numberOfOptions) > totalQuantity)
      ) {
        setAmountExceedAlert(true)
      } else {
        setAmountExceedAlert(false)
      } */
    }
  }, [numberOfOptions, youPay, avgExpectedRate, checked])

  const createBtnDisabled =
    !isApproved ||
    youPay.lte(0) ||
    collateralBalance.sub(youPay).sub(feeAmount).lt(0) // feeAmount should be zero here; added for consistency
  const fillBtnDisabled =
    !isApproved ||
    orderBtnDisabled ||
    collateralBalance.sub(youPay).sub(feeAmount).lt(0)
  const approveBtnDisabled = isApproved || youPay.lte(0) // No collateralBalance.sub(youPay).lt(0) condition as a user should be able to approve any amount they want

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', ml: theme.spacing(-3) }}
    >
      <form onSubmit={(event) => handleOrderSubmit(event)}>
        <Card
          sx={{
            width: '430px',
            border: '1px solid #383838',
            background: theme.palette.background.default,
            borderBottom: 0,
            borderTop: 0,
            p: theme.spacing(2),
            mt: theme.spacing(-4),
          }}
        >
          <Box sx={{ my: theme.spacing(3) }}>
            <TextField
              id="outlined-number"
              label="Amount"
              type="text"
              sx={{ width: '100%' }}
              value={numberOfOptions}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end" sx={{ color: '#929292' }}>
                    {params.tokenType.toUpperCase()}
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{
                shrink: true,
              }}
              onChange={(e) => {
                handleNumberOfOptions(e.target.value)
              }}
            />
            <Typography
              variant="h5"
              color="text.secondary"
              textAlign="right"
              sx={{ mt: theme.spacing(1) }}
            >
              Max Amount:
              <Typography variant="h5" sx={{ display: 'inline' }}>
                {' '}
                {checked && pricePerOption.gt(ZERO)
                  ? [
                      toExponentialOrNumber(
                        Number(
                          formatUnits(
                            collateralBalance
                              .mul(collateralTokenUnit)
                              .div(pricePerOption),
                            decimals
                          )
                        )
                      ),
                      ' ',
                      params.tokenType.toUpperCase(),
                    ]
                  : !checked && avgExpectedRate.gt(ZERO)
                  ? [
                      toExponentialOrNumber(
                        Number(
                          formatUnits(
                            collateralBalance
                              .mul(collateralTokenUnit)
                              .div(avgExpectedRate),
                            decimals
                          )
                        )
                      ),
                      ' ',
                      params.tokenType.toUpperCase(),
                    ]
                  : 'please enter price'}{' '}
                {checked && pricePerOption.gt(ZERO) ? (
                  <MaxCollateral
                    role="button"
                    onClick={() => {
                      handleNumberOfOptions(
                        formatUnits(
                          collateralBalance
                            .mul(collateralTokenUnit)
                            .div(pricePerOption),
                          decimals
                        )
                      )
                    }}
                  >
                    {'('}
                    Max
                    {')'}
                  </MaxCollateral>
                ) : (
                  !checked &&
                  avgExpectedRate.gt(ZERO) && (
                    <MaxCollateral
                      role="button"
                      onClick={() => {
                        handleNumberOfOptions(
                          formatUnits(
                            collateralBalance
                              .mul(collateralTokenUnit)
                              .div(avgExpectedRate),
                            decimals
                          )
                        )
                      }}
                    >
                      {'('}
                      Max
                      {')'}
                    </MaxCollateral>
                  )
                )}
              </Typography>
            </Typography>
          </Box>
          <TextField
            id="outlined-number"
            label="Price"
            type="text"
            sx={{ width: '100%' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ color: '#929292' }}>
                  {tokenSymbol}
                  {'/'}
                  {params.tokenType.toUpperCase()}
                </InputAdornment>
              ),
            }}
            InputLabelProps={{
              shrink: true,
            }}
            disabled={checked ? false : true}
            value={
              !checked
                ? toExponentialOrNumber(
                    Number(formatUnits(avgExpectedRate, decimals))
                  )
                : null
            }
            onChange={(e) => {
              handlePricePerOption(e.target.value)
            }}
          />
          <FormControlLabel
            control={
              <Checkbox
                color="primary"
                checked={checked}
                onChange={handleChecked}
                inputProps={{ 'aria-label': 'controlled' }}
              />
            }
            label="Set Price Target"
            color="gray"
          />
          <Box sx={{ my: theme.spacing(3) }}>
            {checked && (
              <TextField
                id="outlined-select-currency"
                select
                label="Order Expires in"
                sx={{ width: '100%' }}
                value={expiry}
                onChange={handleExpirySelection}
              >
                {expiryOrderTime.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </Card>
        <Card
          sx={{
            width: '430px',
            border: '1px solid #1B3448',
            mt: theme.spacing(-1),
            py: theme.spacing(4),
            px: theme.spacing(2),
            background: 'linear-gradient(to bottom, #051827, #121212 110%)',
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            mb={theme.spacing(3)}
          >
            <Typography variant="h3" textAlign="right">
              You Pay
            </Typography>
            <Typography variant="h3">
              {`${toExponentialOrNumber(Number(formatUnits(youPay, decimals)))}
               ${tokenSymbol}`}
            </Typography>
          </Stack>
          <Collapse in={balanceAlert} sx={{ mt: theme.spacing(2) }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              Insufficient balance
            </Alert>
          </Collapse>
          <Collapse in={orderBookAlert} sx={{ mt: theme.spacing(2) }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              No Asks in orderbook
            </Alert>
          </Collapse>
          {/* 
          <Collapse in={amountExceedAlert}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Amount to be approved exceeds{' '}
              {checked ? 'Wallet Balance' : 'available quantities'}
            </Alert>
          </Collapse> */}
          <Stack direction={'row'} spacing={1} mt={theme.spacing(1)}>
            <LoadingButton
              variant="contained"
              sx={{ width: '50%', height: '45px' }}
              loading={approveLoading}
              color="primary"
              startIcon={<CheckIcon />}
              type="submit"
              value="Submit"
              disabled={approveBtnDisabled}
            >
              {'Approve'}
            </LoadingButton>
            <LoadingButton
              variant="contained"
              sx={{ width: '50%', height: '45px' }}
              loading={fillLoading}
              color="primary"
              startIcon={<AddIcon />}
              type="submit"
              value="Submit"
              disabled={checked ? createBtnDisabled : fillBtnDisabled}
            >
              {checked ? 'Create' : 'Fill'}
            </LoadingButton>
          </Stack>
          <Stack
            direction="row"
            justifyContent="space-between"
            mt={theme.spacing(1)}
          >
            <Typography variant="h5" color="text.secondary" textAlign="right">
              {checked
                ? 'Fees (0%)'
                : `Fees (${(TRADING_FEE * 100).toFixed(0)}%)`}
            </Typography>
            <Typography variant="h5" color="text.secondary">
              {Number(formatUnits(feeAmount, decimals)) < 0.00000000001
                ? Number(0).toFixed(4)
                : toExponentialOrNumber(
                    Number(formatUnits(feeAmount, decimals))
                  )}{' '}
              {tokenSymbol}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            justifyContent="space-between"
            mt={theme.spacing(1)}
          >
            <Typography variant="h5" color="text.secondary" textAlign="right">
              Remaining Allowance
            </Typography>
            <Typography variant="h5" color="text.secondary">
              {Number(formatUnits(remainingAllowance, decimals)) < 0.00000000001
                ? Number(0).toFixed(4)
                : toExponentialOrNumber(
                    Number(formatUnits(remainingAllowance, decimals))
                  )}{' '}
              {tokenSymbol}
            </Typography>
          </Stack>
        </Card>
      </form>
    </Box>
  )
}

export default BuyOrder
