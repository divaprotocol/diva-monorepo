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
import { BigNumber } from 'ethers'
import Web3 from 'web3'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { Pool } from '../../../lib/queries'
import { toExponentialOrNumber } from '../../../Util/utils'
import { sellLimitOrder } from '../../../Orders/SellLimit'
import ERC20_ABI from '../../../abi/ERC20ABI.json'
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks'
import { selectUserAddress } from '../../../Redux/appSlice'
import { setResponseSell } from '../../../Redux/TradeOption'
import { sellMarketOrder } from '../../../Orders/SellMarket'
import {
  calcBreakEven,
  calcPayoffPerToken,
} from '../../../Util/calcPayoffPerToken'
import { TRADING_FEE } from '../../../constants'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
import {
  setBreakEven,
  setIntrinsicValue,
  setMaxPayout,
  setMaxYield,
} from '../../../Redux/Stats'
import { useConnectionContext } from '../../../hooks/useConnectionContext'
import { useParams } from 'react-router-dom'

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
]

const ZERO = BigNumber.from(0)

const SellOrder = (props: {
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
}) => {
  const theme = useTheme()
  const [Web3Provider, setWeb3Provider] = useState<Web3>()
  const web3 = new Web3(Web3Provider as any)
  const { getWeb3JsProvider, provider } = useConnectionContext()
  const [optionBalance, setOptionBalance] = React.useState(ZERO)
  const [checked, setChecked] = useState(true)
  const [numberOfOptions, setNumberOfOptions] = React.useState('') // User input field
  const [pricePerOption, setPricePerOption] = React.useState(ZERO) // User input field
  const [feeAmount, setFeeAmount] = React.useState(ZERO) // User input field
  const [balanceAlert, setBalanceAlert] = useState(false) //Alert message for insufficient balance
  const [orderBookAlert, setOrderBookAlert] = useState(false) //Alert message for no Asks in SellMarket
  const [expiry, setExpiry] = React.useState(5)
  const [avgExpectedRate, setAvgExpectedRate] = React.useState(ZERO)
  const [isApproved, setIsApproved] = React.useState(false)
  const [fillLoading, setFillLoading] = React.useState(false)
  const [approveLoading, setApproveLoading] = React.useState(false)
  const [allowance, setAllowance] = React.useState(ZERO)
  const [remainingAllowance, setRemainingAllowance] = React.useState(ZERO)
  const [youReceive, setYouReceive] = React.useState(ZERO)
  const [existingBuyLimitOrders, setExistingBuyLimitOrders] = React.useState([])
  const [
    existingSellLimitOrdersAmountUser,
    setExistingSellLimitOrdersAmountUser,
  ] = React.useState(ZERO)
  const [orderBtnDisabled, setOrderBtnDisabled] = React.useState(true)

  const userAddress = useAppSelector(selectUserAddress)
  const option = props.option
  const decimals = option.collateralToken.decimals
  const exchangeProxy = props.exchangeProxy
  const tokenSymbol = option.collateralToken.symbol
  const makerToken = props.tokenAddress
  const takerToken = option.collateralToken.id
  const makerTokenContract = new web3.eth.Contract(ERC20_ABI as any, makerToken)
  const collateralTokenUnit = parseUnits('1', decimals)
  const usdPrice = props.usdPrice
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const dispatch = useAppDispatch()
  const params: { tokenType: string } = useParams()
  const isLong = window.location.pathname.split('/')[2] === 'long'
  const responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  let responseSell = useAppSelector((state) => state.tradeOption.responseSell)

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3JsProvider()
      setWeb3Provider(web3)
    }
    init()
  }, [getWeb3JsProvider, provider])

  const handleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
    if (event.target.checked) {
      setFeeAmount(ZERO)
    }
  }
  const handleNumberOfOptions = (value: string) => {
    // @todo app breaks if `-` is entered as first value; doesn't happen for BUY

    if (value != '' && checked) {
      // LIMIT order case
      const nbrOptions = parseUnits(value, decimals)
      setNumberOfOptions(value)

      if (nbrOptions.gt(0) && pricePerOption.gt(0)) {
        const youReceive = pricePerOption
          .mul(nbrOptions)
          .div(collateralTokenUnit)
        setYouReceive(youReceive)
      }
      // Keep this outside as this if block is for limit orders and the zero fee amount applies
      // independent of any condition
      setFeeAmount(ZERO)
    } else if (value != '') {
      // MARKET order case
      const nbrOptions = parseUnits(value, decimals)
      setNumberOfOptions(value)

      // Disable fill order button if nbrOptions incl. fee exceeds user's position token balance
      if (optionBalance.sub(nbrOptions).sub(feeAmount).lt(0)) {
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
      setYouReceive(ZERO)
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
        const youReceive = pricePerOption
          .mul(parseUnits(numberOfOptions, decimals))
          .div(collateralTokenUnit)
        setYouReceive(youReceive)
        setFeeAmount(ZERO)
      }
    } else {
      setYouReceive(ZERO)
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
    setYouReceive(ZERO)
    setFeeAmount(ZERO)

    const allowance = await makerTokenContract.methods
      .allowance(userAddress, exchangeProxy)
      .call()
    const remainingAllowance = BigNumber.from(allowance).sub(
      existingSellLimitOrdersAmountUser
    )
    setRemainingAllowance(remainingAllowance)
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      // Remaining allowance - nbrOptions - feeAmount > 0 (feeAmount = 0 in case of LIMIT order)
      setApproveLoading(true)
      if (parseUnits(numberOfOptions, decimals).gt(0)) {
        // Calculate required allowance amount for position token.
        // Note that `feeAmount = 0` for LIMIT order (i.e. checked = true) and > 0 otherwise.
        // Make sure that orders with fee amount > 1% are filtered out from the orderbook as it may result in
        // insufficient allowance causing the fill order operation to fail.
        const amountToApprove = allowance
          .add(parseUnits(numberOfOptions, decimals))
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
          const optionAllowance = BigNumber.from(approveResponse)
          const remainingAllowance = BigNumber.from(optionAllowance).sub(
            existingSellLimitOrdersAmountUser
          )
          setRemainingAllowance(remainingAllowance)
          setAllowance(optionAllowance)
          setIsApproved(true)
          setApproveLoading(false)
          alert(
            `Total allowance updated to ${toExponentialOrNumber(
              Number(formatUnits(optionAllowance, decimals))
            )} ${params.tokenType.toUpperCase()}. Remaining allowance taking into account open orders: ${toExponentialOrNumber(
              Number(formatUnits(remainingAllowance, decimals))
            )} ${params.tokenType.toUpperCase()}.`
          )
        } else {
          setApproveLoading(false)
        }
      }
    } else if (checked) {
      // LIMIT order case

      // Remaining allowance - nbrOptions - feeAmount > 0 (feeAmount = 0 in case of LIMIT order)

      setFillLoading(true)
      const orderData = {
        maker: userAddress,
        provider: provider,
        isBuy: false,
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
      sellLimitOrder(orderData)
        .then(async (response) => {
          if (response.status === 200) {
            //need to invalidate cache order response since orderbook is updated
            dispatch(setResponseSell([]))

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

      // Remaining allowance - nbrOptions - feeAmount > 0

      setFillLoading(true)
      const orderData = {
        taker: userAddress,
        provider: provider,
        isBuy: false,
        nbrOptions: parseUnits(numberOfOptions, decimals),
        collateralDecimals: decimals,
        makerToken: makerToken,
        takerToken: takerToken,
        avgExpectedRate: avgExpectedRate,
        existingLimitOrders: existingBuyLimitOrders,
        chainId: props.chainId,
      }
      console.log('avgExpectedRate', avgExpectedRate)
      sellMarketOrder(orderData).then(async (orderFillStatus: any) => {
        if (!(orderFillStatus == undefined)) {
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
          setYouReceive(ZERO)
          setFeeAmount(ZERO)
          alert('Order successfully filled.')
        } else {
          // Rejected by user or tx failure (i.e., orderFillStatus == undefined as no tx receipt was returned)
          // Do not reset values.
          setFillLoading(false)
          alert('Order could not be filled.')
        }
      })
    }
  }

  // TODO: Outsource this function into a separate file as it's the same across BUY/SELL LIMIT/MARKET
  const getMakerTokenAllowanceAndBalance = async (makerAccount: string) => {
    const allowance = await makerTokenContract.methods
      .allowance(makerAccount, exchangeProxy)
      .call()
    const balance = await makerTokenContract.methods
      .balanceOf(makerAccount)
      .call()
    return {
      balance: BigNumber.from(balance),
      allowance: BigNumber.from(allowance),
    }
  }

  // This will fetch the BUY LIMIT orders to perform the SELL MARKET operation
  const getBuyLimitOrders = async () => {
    const orders: any = []
    responseBuy.forEach((data: any) => {
      const order = JSON.parse(JSON.stringify(data.order))

      const takerAmount = BigNumber.from(order.takerAmount) // position token
      const makerAmount = BigNumber.from(order.makerAmount) // collateral token

      const remainingFillableTakerAmount =
        data.metaData.remainingFillableTakerAmount

      if (BigNumber.from(remainingFillableTakerAmount).gt(0)) {
        // TODO Consider moving the expectedRate calcs inside get0xOpenOrders
        order['expectedRate'] = makerAmount
          .mul(collateralTokenUnit)
          .div(takerAmount)
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

  // Check how many existing SELL LIMIT orders the user has outstanding in the orderbook.
  // Note that in SELL LIMIT, the makerToken is the position token which is the relevant token for approval.
  // As remainingFillableMakerAmount is not directly available, it has to be backed out from remainingFillableTakerAmount, takerAmount and makerAmount
  // TODO: Outsource this function into OpenOrders.ts, potentially integrate into getUserOrders function
  const getTotalSellLimitOrderAmountUser = async (maker) => {
    let existingOrdersAmount = ZERO
    if (responseSell.length == 0) {
      // Double check whether any limit orders exist
      const rSell: any = await get0xOpenOrders(
        makerToken,
        takerToken,
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
      getMakerTokenAllowanceAndBalance(userAddress).then(async (val) => {
        // Use values returned from getMakerTokenAllowanceAndBalance to initialize variables
        setOptionBalance(val.balance)
        setAllowance(val.allowance)

        // Get BUY LIMIT orders which the user is going to fill during the SELL MARKET operation
        if (responseBuy.length > 0) {
          getBuyLimitOrders().then((orders) => {
            setExistingBuyLimitOrders(orders)
          })
        }

        // Get the user's (taker) existing SELL LIMIT orders which block some of the user's allowance
        getTotalSellLimitOrderAmountUser(userAddress).then((amount) => {
          const remainingAmount = val.allowance.sub(amount) // May be negative if user manually revokes allowance but should go back to zero if 0x orders are refreshed and reflect the actually fillable amount
          setExistingSellLimitOrdersAmountUser(amount)
          setRemainingAllowance(remainingAmount)
        })
      })
    }
  }, [responseBuy, responseSell, userAddress, Web3Provider, checked])

  // useEffect function to fetch average price for the SELL MARKET order
  useEffect(() => {
    if (!checked) {
      // Calculate average price
      if (numberOfOptions !== '') {
        if (
          parseUnits(numberOfOptions, decimals).gt(0) &&
          existingBuyLimitOrders.length > 0
        ) {
          // If user has entered an input into the Amount field and there are existing BUY LIMIT orders to fill in the orderbook...

          // User input (numberOfOptions) corresponds to the taker token in BUY LIMIT.
          let takerAmountToFill = parseUnits(numberOfOptions, decimals)

          let cumulativeAvgRate = ZERO
          let cumulativeTaker = ZERO
          let cumulativeMaker = ZERO

          // Calculate average price. Note that if numberOfOptions exceeds the amount in the orderbook,
          // existing orders will be cleared and a portion will remain unfilled.
          // TODO: Consider showing a message to user when desired sell amount exceeds the available amount in the orderbook.
          existingBuyLimitOrders.forEach((order: any) => {
            // Loop through each BUY LIMIT order where makerToken = collateral token and takerToken = position token

            let takerAmount = BigNumber.from(order.takerAmount)
            let makerAmount = BigNumber.from(order.makerAmount)
            const remainingFillableTakerAmount = BigNumber.from(
              order.remainingFillableTakerAmount
            )
            const expectedRate = BigNumber.from(order.expectedRate)

            // If order is already partially filled, set takerAmount equal to remainingFillableTakerAmount and makerAmount to the corresponding pro-rata fillable makerAmount
            if (remainingFillableTakerAmount.lt(takerAmount)) {
              // Existing BUY LIMIT order was already partially filled

              // Overwrite takerAmount and makerAmount with remaining amounts
              takerAmount = remainingFillableTakerAmount
              makerAmount = remainingFillableTakerAmount
                .mul(order.expectedRate)
                .div(collateralTokenUnit)
            }

            // If there are remaining nbrOfOptions (takerAmountToFill), then check whether the current order under consideration will be fully filled or only partially
            if (takerAmountToFill.gt(0)) {
              if (takerAmountToFill.lt(takerAmount)) {
                const makerAmountToFill = expectedRate
                  .mul(takerAmountToFill)
                  .div(collateralTokenUnit)
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

          // Calculate average price to pay excluding 1% fee
          cumulativeAvgRate = cumulativeMaker
            .mul(collateralTokenUnit) // scaling for high precision integer math
            .div(cumulativeTaker)

          if (cumulativeAvgRate.gt(0)) {
            setAvgExpectedRate(cumulativeAvgRate)
            // Amount to that the seller/user will receive
            const youReceive = cumulativeMaker
            setYouReceive(youReceive)

            // Calculate fee amount (to be paid in position token)
            const feeAmount = cumulativeTaker
              .mul(parseUnits(TRADING_FEE.toString(), decimals))
              .div(collateralTokenUnit)
            setFeeAmount(feeAmount)
          }
        } else {
          if (parseUnits(numberOfOptions, decimals).eq(0)) {
            if (existingBuyLimitOrders.length > 0) {
              setAvgExpectedRate(existingBuyLimitOrders[0].expectedRate)
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
    avgExpectedRate,
    option,
    pricePerOption, // TODO Consider renaming to "pricePerPositionToken"
    usdPrice, // TODO Consider renaming to "underlyingValue"
    existingSellLimitOrdersAmountUser,
    userAddress,
  ])
  useEffect(() => {
    if (numberOfOptions !== '') {
      if (
        remainingAllowance
          .sub(parseUnits(numberOfOptions, decimals))
          .sub(feeAmount)
          .lte(0)
      ) {
        setIsApproved(false)
      } else {
        setIsApproved(true)
      }
    }
  }, [remainingAllowance, numberOfOptions, userAddress])

  // Alert message for Insuffcientbalance & No Bids on OrderBook
  useEffect(() => {
    if (numberOfOptions != '') {
      // Convert user input into BigNumber
      const nbrOfOptionsBalance = parseUnits(numberOfOptions, decimals)

      // Calculate fee amount (to be paid in position token)
      const feeAmount = nbrOfOptionsBalance
        .mul(parseUnits(TRADING_FEE.toString(), decimals))
        .div(collateralTokenUnit)
      setFeeAmount(feeAmount)
      const requiredNbrOfOptionsBalance = nbrOfOptionsBalance.add(feeAmount)
      if (
        requiredNbrOfOptionsBalance.gt(optionBalance) &&
        requiredNbrOfOptionsBalance.lte(remainingAllowance)
      ) {
        setBalanceAlert(true)
      } else {
        setBalanceAlert(false)
      }
      if (!checked && avgExpectedRate.eq(0)) {
        setOrderBookAlert(true)
      } else {
        setOrderBookAlert(false)
      }
    }
  }, [numberOfOptions, youReceive, avgExpectedRate, checked])

  // @todo QUESTION: Is numberOfOptions !== '' needed here?
  const createBtnDisabled =
    !isApproved ||
    (numberOfOptions !== '' && !parseUnits(numberOfOptions, decimals).gt(0)) ||
    !pricePerOption.gt(0) ||
    (numberOfOptions !== '' &&
      optionBalance
        .sub(parseUnits(numberOfOptions, decimals))
        .sub(feeAmount)
        .lt(0))
  const fillBtnDisabled =
    !isApproved ||
    orderBtnDisabled ||
    (numberOfOptions !== '' &&
      optionBalance
        .sub(parseUnits(numberOfOptions, decimals))
        .sub(feeAmount)
        .lt(0))
  const approveBtnDisabled =
    isApproved ||
    (numberOfOptions !== '' && !parseUnits(numberOfOptions, decimals).gt(0)) // No optionBalance.sub(numberOfOptions).lt(0) condition as a user should be able to approve any amount they want

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
              id="amount"
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
              onChange={(e) => handleNumberOfOptions(e.target.value)}
            />
            <Typography variant="h5" color="text.secondary" textAlign="right">
              Max Sell Amount:
              <Typography variant="h5" sx={{ display: 'inline' }}>
                {' '}
                {toExponentialOrNumber(
                  Number(
                    formatUnits(
                      optionBalance.sub(
                        optionBalance
                          .mul(parseUnits(TRADING_FEE.toString(), decimals))
                          .div(collateralTokenUnit)
                      ),
                      decimals
                    )
                  )
                )}{' '}
                {params.tokenType.toUpperCase()}
              </Typography>
              <Button
                variant="text"
                color="secondary"
                size="small"
                sx={{ pb: theme.spacing(1) }}
                onClick={() => {
                  handleNumberOfOptions(
                    formatUnits(
                      optionBalance.sub(
                        optionBalance
                          .mul(parseUnits(TRADING_FEE.toString(), decimals))
                          .div(collateralTokenUnit)
                      ),
                      decimals
                    )
                  )
                }}
              >
                {'('}
                Max
                {')'}
              </Button>
            </Typography>
          </Box>
          <TextField
            id="price-per-token"
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
                id="expiry-time-period"
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
              You Receive
            </Typography>
            <Typography variant="h3">
              {toExponentialOrNumber(Number(formatUnits(youReceive, decimals)))}{' '}
              {tokenSymbol}
            </Typography>
          </Stack>
          <Collapse in={balanceAlert} sx={{ mt: theme.spacing(2) }}>
            <Alert
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setBalanceAlert(false)
                  }}
                >
                  {'X'}
                </IconButton>
              }
              sx={{ mb: 2 }}
            >
              Insufficient balance
            </Alert>
          </Collapse>
          <Collapse in={orderBookAlert} sx={{ mt: theme.spacing(2) }}>
            <Alert
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setOrderBookAlert(false)
                  }}
                >
                  {'X'}
                </IconButton>
              }
              sx={{ mb: 2 }}
            >
              No Bids in orderbook
            </Alert>
          </Collapse>
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
              {params.tokenType.toUpperCase()}
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
              {params.tokenType.toUpperCase()}
            </Typography>
          </Stack>
        </Card>
      </form>
    </Box>
  )
}

export default SellOrder
