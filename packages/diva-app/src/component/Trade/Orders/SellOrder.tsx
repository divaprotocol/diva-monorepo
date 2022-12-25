import React, { useState, useEffect, FormEvent } from 'react'
import {
  Box,
  Button,
  Card,
  Checkbox,
  FormControlLabel,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import AddIcon from '@mui/icons-material/Add'
import { BigNumber } from 'ethers'
import Web3 from 'web3'
import { TRADING_FEE } from '../../../constants'
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks'
import { selectUserAddress } from '../../../Redux/appSlice'
import ERC20_ABI from '../../../abi/ERC20ABI.json'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useParams } from 'react-router-dom'
import { toExponentialOrNumber } from '../../../Util/utils'
import { sellLimitOrder } from '../../../Orders/SellLimit'
import { setResponseSell } from '../../../Redux/TradeOption'
import { sellMarketOrder } from '../../../Orders/SellMarket'
import { LoadingButton } from '@mui/lab'
import { Pool } from '../../../lib/queries'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
import {
  setBreakEven,
  setIntrinsicValue,
  setMaxPayout,
  setMaxYield,
} from '../../../Redux/Stats'
import {
  calcBreakEven,
  calcPayoffPerToken,
} from '../../../Util/calcPayoffPerToken'
import { useConnectionContext } from '../../../hooks/useConnectionContext'

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

const web3 = new Web3(Web3.givenProvider)
const ZERO = BigNumber.from(0)
const feeMultiplier = (1 + TRADING_FEE).toString()

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
  const { getWeb3JsProvider, provider } = useConnectionContext()
  const [Web3Provider, setWeb3Provider] = useState<Web3>()
  const web3 = new Web3(Web3Provider as any)
  const [checked, setChecked] = useState(true)
  const [numberOfOptions, setNumberOfOptions] = React.useState(ZERO) // User input field
  const [pricePerOption, setPricePerOption] = React.useState(ZERO) // User input field
  const [feeAmount, setFeeAmount] = React.useState(ZERO) // User input field
  const [avgExpectedRate, setAvgExpectedRate] = React.useState(ZERO)
  const [youReceive, setYouReceive] = React.useState(ZERO)
  const [expiry, setExpiry] = React.useState(5)
  const [existingBuyLimitOrders, setExistingBuyLimitOrders] = React.useState([])
  const [
    existingSellLimitOrdersAmountUser,
    setExistingSellLimitOrdersAmountUser,
  ] = React.useState(ZERO)

  const [isApproved, setIsApproved] = React.useState(false)
  const [approveLoading, setApproveLoading] = React.useState(false)
  const [fillLoading, setFillLoading] = React.useState(false)
  const [orderBtnDisabled, setOrderBtnDisabled] = React.useState(true)
  const [allowance, setAllowance] = React.useState(ZERO)
  const [remainingAllowance, setRemainingAllowance] = React.useState(ZERO)
  const [optionBalance, setOptionBalance] = React.useState(ZERO)

  const option = props.option
  const exchangeProxy = props.exchangeProxy
  const tokenSymbol = option.collateralToken.symbol
  const makerToken = checked ? props.tokenAddress : option.collateralToken.id
  const takerToken = checked ? option.collateralToken.id : props.tokenAddress
  const makerTokenContract = new web3.eth.Contract(ERC20_ABI as any, makerToken)
  const takerTokenContract =
    takerToken != null && new web3.eth.Contract(ERC20_ABI as any, takerToken)
  const usdPrice = props.usdPrice
  const decimals = option.collateralToken.decimals
  const collateralTokenUnit = parseUnits('1', decimals)
  const userAddress = useAppSelector(selectUserAddress)
  const params: { tokenType: string } = useParams()
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const dispatch = useAppDispatch()
  const isLong = window.location.pathname.split('/')[2] === 'long'
  const responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  let responseSell = useAppSelector((state) => state.tradeOption.responseSell)

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3JsProvider()
      setWeb3Provider(web3)
    }
    init()
  }, [getWeb3JsProvider])

  const handleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
  }
  const handleNumberOfOptions = (value: string) => {
    const nbrOptions = parseUnits(value, decimals)
    setNumberOfOptions(nbrOptions)
    if (value != '' && checked) {
      if (nbrOptions.gt(0) && pricePerOption.gt(0)) {
        const youReceive = pricePerOption
          .mul(numberOfOptions)
          .div(collateralTokenUnit)
        setYouReceive(youReceive)
      }
    } else if (value != '') {
      const feeAmount = nbrOptions
        .mul(parseUnits(TRADING_FEE.toString(), decimals))
        .div(collateralTokenUnit)
      setFeeAmount(feeAmount)

      // Disable fill order button if nbrOptions incl. fee exceeds user's wallet balance
      if (optionBalance.sub(nbrOptions).sub(feeAmount).lt(0)) {
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
      setNumberOfOptions(ZERO)
      setOrderBtnDisabled(true)
      setFeeAmount(ZERO)
    }
  }

  const handlePricePerOption = (value: string) => {
    if (value !== '') {
      const pricePerOption = parseUnits(value, decimals)
      setPricePerOption(pricePerOption)
      if (pricePerOption.gt(0)) {
        if (numberOfOptions.gt(0)) {
          const youReceive = pricePerOption
            .mul(numberOfOptions)
            .div(collateralTokenUnit)
          setYouReceive(youReceive)
        }
      } else {
        // In case invalid/empty value pricePerOption
        setPricePerOption(ZERO)
        // Disable btn if approval is positive & number of options entered
      }
    } else {
      setYouReceive(ZERO)
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
    setNumberOfOptions(ZERO)
    setPricePerOption(ZERO)

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
      // Remaining allowance - nbrOptions <= 0
      setApproveLoading(true)
      if (numberOfOptions.gt(0) && checked) {
        // Calculate required allowance amount for position token (expressed as an integer with 18 decimals).
        const amountToApprove = allowance
          .add(numberOfOptions)
          .sub(remainingAllowance)
          .add(BigNumber.from(100)) // Adding a buffer of 10 to make sure that there will be always sufficient approval

        // Set allowance. Returns 'undefined' if rejected by user.
        const approveResponse = await props.approve(
          amountToApprove,
          makerTokenContract,
          exchangeProxy,
          userAddress
        )

        if (approveResponse !== 'undefined') {
          const collateralAllowance = BigNumber.from(approveResponse)
          const remainingAllowance = BigNumber.from(collateralAllowance).sub(
            existingSellLimitOrdersAmountUser
          )

          setRemainingAllowance(remainingAllowance)
          setAllowance(collateralAllowance)
          setIsApproved(true)
          setApproveLoading(false)
          alert(
            `Allowance for ${toExponentialOrNumber(
              Number(formatUnits(collateralAllowance, decimals))
            )} ${params.tokenType.toUpperCase()} tokens successfully set.`
          )
        } else {
          setApproveLoading(false)
        }
      } else if (numberOfOptions.gt(0)) {
        // Calculate required allowance amount for position token assuming 1% fee (expressed as an integer with 18 decimals).
        // NOTE: The assumption that the maximum fee is 1% may not be valid in the future as market makers start posting orders with higher fees.
        // In the worst case, the amountToApprove will be too small due to fees being higher than 1% and the fill transaction may fail.
        // TODO: Exclude orders that have a fee higher than 1% from the orderbook so that users will not get screwed.
        const amountToApprove = allowance
          .add(numberOfOptions)
          .add(feeAmount)
          .sub(remainingAllowance)
          .add(BigNumber.from(100)) // Adding a buffer of 100 to make sure that there will be always sufficient approval

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
          )

          setRemainingAllowance(remainingAllowance)
          setAllowance(optionAllowance)
          setIsApproved(true)
          setApproveLoading(false)
          alert(
            `Allowance for ${toExponentialOrNumber(
              Number(formatUnits(optionAllowance, decimals))
            )} ${params.tokenType.toUpperCase()} tokens successfully set (includes allowance for 1% fee payment).`
          )
        } else {
          setApproveLoading(false)
        }
      }
    } else if (checked) {
      // Remaining allowance - nbrOptions > 0
      setFillLoading(true)
      const orderData = {
        maker: userAddress,
        provider: provider,
        isBuy: false,
        nbrOptions: numberOfOptions,
        collateralDecimals: decimals,
        makerToken: makerToken,
        takerToken: takerToken,
        limitPrice: pricePerOption,
        orderExpiry: expiry,
        chainId: props.chainId,
        exchangeProxy: exchangeProxy,
        poolId: option.id,
      }
      console.log('Maker Token in Sell Limit:', makerToken)
      console.log('Taker Token in Sell Limit:', takerToken)
      console.log('User Address', userAddress)
      console.log('decimals', decimals)
      console.log('avgExpectedRate', Number(avgExpectedRate))
      console.log('chainId', props.chainId)
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
      // Remaining allowance - nbrOptions - feeAmount > 0

      setFillLoading(true)
      const orderData = {
        taker: userAddress,
        provider: provider,
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
        if (!(orderFillStatus == undefined)) {
          // On fill order success ...

          // Wait for 4 secs for 0x to update orders, then handle order book display
          await new Promise((resolve) => setTimeout(resolve, 4000))

          // Reset inputs and state variables
          await props.handleDisplayOrder()
          Array.from(document.querySelectorAll('input')).forEach(
            (input) => (input.value = '')
          )
          setNumberOfOptions(ZERO)
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
  // TODO: Outsource this function into a separate file as it's the same across Buy/Sell Limit/Market
  const getOptionsInWallet = async (makerAccount: string) => {
    const allowance = await (checked ? makerTokenContract.methods : takerTokenContract.methods)
      .allowance(makerAccount, exchangeProxy)
      .call()
    const balance = await (checked ? makerTokenContract.methods : takerTokenContract.methods)
      .balanceOf(makerAccount)
      .call()
    return {
      balance: BigNumber.from(balance),
      allowance: BigNumber.from(allowance),
    }
  }
  //This will fetch the BUY Limit Order in order to perform the Sell Market Order
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
          .mul(collateralTokenUnit)
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
/* 
        // Get Buy Limit orders which the user is going to fill during the Sell Market operation
        if (responseBuy.length > 0) {
          getBuyLimitOrders().then((orders) => {
            setExistingBuyLimitOrders(orders)
          })
        }

  */       // Get the user's (taker) existing Sell Limit orders which block some of the user's allowance
        getTotalSellLimitOrderAmountUser(userAddress).then((amount) => {
          const remainingAmount = val.allowance.sub(amount) // May be negative if user manually revokes allowance but should go back to zero if 0x orders are refreshed and reflect the actually fillable amount
          setExistingSellLimitOrdersAmountUser(amount)
          setRemainingAllowance(remainingAmount)
        })
      })
    }
  }, [responseSell, userAddress, Web3Provider])

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
          const remainingAmount = val.allowance.sub(amount) // May be negative if user manually revokes allowance but should go back to zero if 0x orders are refreshed and reflect the actually fillable amount
          setExistingSellLimitOrdersAmountUser(amount)
          setRemainingAllowance(remainingAmount)
        })
      })
    }
  }, [responseBuy, responseSell, userAddress, Web3Provider, checked])

  //UseEffect function to fetch average price for the SELL Market Order
  useEffect(() => {
    // Calculate average price
    if (numberOfOptions.gt(0) && existingBuyLimitOrders.length > 0) {
      // If user has entered an input into the Number field and there are existing Buy Limit orders to fill in the orderbook...

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
            .div(collateralTokenUnit) // result has <= 18 decimals
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
      // Calculate average price to pay excluding 1% fee (result is expressed as an integer with collateral token decimals (<= 18))
      cumulativeAvgRate = cumulativeMaker
        .mul(collateralTokenUnit) // scaling for high precision integer math
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
    pricePerOption,
    usdPrice,
    existingSellLimitOrdersAmountUser,
    userAddress,
  ])
  useEffect(() => {
    if (remainingAllowance.sub(numberOfOptions).lte(0)) {
      setIsApproved(false)
    } else if (remainingAllowance.sub(numberOfOptions).sub(feeAmount).lte(0)) {
      setIsApproved(false)
    } else {
      setIsApproved(true)
    }
  }, [remainingAllowance, numberOfOptions, userAddress])
  const createBtnDisabled =
    !isApproved ||
    !numberOfOptions.gt(0) ||
    !pricePerOption.gt(0) ||
    optionBalance.sub(numberOfOptions).lt(0)
  const fillBtnDisabled =
    !isApproved ||
    orderBtnDisabled ||
    optionBalance.sub(numberOfOptions).sub(feeAmount).lt(0)
  const approveBtnDisabled = isApproved || !numberOfOptions.gt(0) // No optionBalance.sub(numberOfOptions).lt(0) condition as a user should be able to approve any amount they want

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
              Balance :
              <Typography variant="h4" sx={{ display: 'inline' }}>
                {' '}
                {toExponentialOrNumber(
                  Number(formatUnits(optionBalance, decimals))
                )}{' '}
                {tokenSymbol}{' '}
              </Typography>
              <Button
                variant="text"
                color="secondary"
                onClick={() => {
                  if (optionBalance != null) {
                    setNumberOfOptions(optionBalance)
                  }
                }}
              >
                {' ('}
                Max
                {')'}
              </Button>
            </Typography>
          </Box>
          <TextField
            id="price-per-token"
            label={`Price per ${params.tokenType.toUpperCase()} token`}
            type="text"
            sx={{ width: '100%' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ color: '#929292' }}>
                  {tokenSymbol}
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
          <TextField
            id="You Receive"
            label="You Receive"
            type="number"
            disabled
            sx={{ width: '100%', mb: theme.spacing(6) }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ color: '#929292' }}>
                  {tokenSymbol}
                </InputAdornment>
              ),
            }}
            InputLabelProps={{
              shrink: true,
            }}
            value={toExponentialOrNumber(
              Number(formatUnits(youReceive, decimals))
            )}
          />
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
              Fees
            </Typography>
            <Typography variant="h4">3.10 dUSD</Typography>
          </Stack>
          <Stack
            direction="row"
            justifyContent="space-between"
            mt={theme.spacing(1)}
          >
            <Typography variant="h5" color="text.secondary" textAlign="right">
              Remaining Allowance
            </Typography>
            <Typography variant="h4">
              {Number(formatUnits(remainingAllowance, decimals)) < 0.00000000001
                ? 0
                : toExponentialOrNumber(
                    Number(formatUnits(remainingAllowance, decimals))
                  )}
            </Typography>
          </Stack>
        </Card>
      </form>
    </Box>
  )
}

export default SellOrder
