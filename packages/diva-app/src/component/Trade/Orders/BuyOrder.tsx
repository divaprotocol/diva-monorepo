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
import { LoadingButton } from '@mui/lab'
import { BigNumber } from 'ethers'
import Web3 from 'web3'
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
  const [Web3Provider, setWeb3Provider] = useState<Web3>()
  const web3 = new Web3(Web3Provider as any)
  const { getWeb3JsProvider, provider } = useConnectionContext()
  const [collateralBalance, setCollateralBalance] = useState(ZERO)
  const [checked, setChecked] = useState(false)
  const [numberOfOptions, setNumberOfOptions] = useState(ZERO) // User input field
  const [pricePerOption, setPricePerOption] = useState(ZERO) // User input field
  const [expiry, setExpiry] = useState(5) //Expiry Time
  const [avgExpectedRate, setAvgExpectedRate] = useState(ZERO) //Price Per long/short Token
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
  const makerTokenContract = new web3.eth.Contract(ERC20_ABI as any, makerToken)
  const takerTokenContract =
    takerToken != null && new web3.eth.Contract(ERC20_ABI as any, takerToken)
  const collateralTokenUnit = parseUnits('1', decimals)
  const usdPrice = props.usdPrice
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const dispatch = useAppDispatch()
  const params: { tokenType: string } = useParams()
  const isLong = window.location.pathname.split('/')[2] === 'long'
  let responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  const responseSell = useAppSelector((state) => state.tradeOption.responseSell)

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3JsProvider()
      setWeb3Provider(web3)
    }
    init()
  }, [getWeb3JsProvider, provider])

  const handleChecked = (event: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
  }
  const handleNumberOfOptions = (value: string) => {
    const nbrOptions = parseUnits(value, decimals)
    console.log('Number of option', nbrOptions)
    setNumberOfOptions(nbrOptions)
    if (value !== '' && checked) {
      if (pricePerOption.gt(0) && nbrOptions.gt(0)) {
        const youPay = pricePerOption.mul(nbrOptions).div(collateralTokenUnit)
        setYouPay(youPay)
      }
    } else if (value !== '') {
      if (collateralBalance.sub(youPay).lt(0)) {
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
      setNumberOfOptions(ZERO)
      setOrderBtnDisabled(true)
    }
  }

  const handlePricePerOption = (value: string) => {
    if (value !== '') {
      const pricePerOption = parseUnits(value, decimals)
      setPricePerOption(pricePerOption)
      if (numberOfOptions.gt(0) && pricePerOption.gt(0)) {
        const youPay = numberOfOptions
          .mul(pricePerOption)
          .div(collateralTokenUnit)
        setYouPay(youPay)
      }
    } else {
      setYouPay(ZERO)
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
    setYouPay(ZERO)

    const allowance = await makerTokenContract.methods
      .allowance(userAddress, exchangeProxy)
      .call()

    const remainingAllowance = BigNumber.from(allowance).sub(
      existingBuyLimitOrdersAmountUser
    )
    setRemainingAllowance(remainingAllowance)
  }

  const handleOrderSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      // Remaining allowance - youPay (incl. fee) <= 0
      setApproveLoading(true)
      if (numberOfOptions.gt(0) && checked) {
        // Calculate required allowance amount for collateral token (expressed as an integer with collateral token decimals (<= 18)).
        const amountToApprove = allowance
          .add(youPay)
          .sub(remainingAllowance)
          .add(BigNumber.from(100))

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
            `Allowance for ${toExponentialOrNumber(
              Number(formatUnits(collateralAllowance, decimals))
            )} ${option.collateralToken.symbol} tokens successfully set.`
          )
        } else {
          setApproveLoading(false)
        }
      } else if (numberOfOptions.gt(0)) {
        // Calculate required allowance amount for collateral token assuming 1% fee (expressed as an integer with collateral token decimals (<= 18)).
        // NOTE: The assumption that the maximum fee is 1% may not be valid in the future as market makers start posting orders with higher fees.
        // In the worst case, the amountToApprove will be too small due to fees being higher than 1% and the fill transaction may fail.
        // TODO: Exclude orders that have a fee higher than 1% from the orderbook so that users will not get screwed.
        const amountToApprove = allowance
          .add(youPay) // youPay is already including fee, hence no feeMultiplier needed in that case
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
          const collateralAllowance = BigNumber.from(approveResponse)
          const remainingAllowance = collateralAllowance.sub(
            existingBuyLimitOrdersAmountUser
          )

          setRemainingAllowance(remainingAllowance)
          setAllowance(collateralAllowance)
          setIsApproved(true)
          setApproveLoading(false)
          alert(
            `Allowance for ${toExponentialOrNumber(
              Number(formatUnits(collateralAllowance, decimals))
            )} ${option.collateralToken.symbol} tokens successfully set.`
          )
        } else {
          setApproveLoading(false)
        }
      }
    } else if (checked) {
      // Remaining allowance - youPay > 0
      setFillLoading(true)
      const orderData = {
        maker: userAddress,
        provider: provider,
        isBuy: true,
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
      console.log('Order Data:', orderData)
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
      // Remaining allowance - youPay (incl. fee) > 0

      setFillLoading(true)
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
        if (!(orderFillStatus === undefined)) {
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
          setYouPay(ZERO)
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
  const getCollateralInWallet = async (makerAccount: string) => {
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
  //It will be executed on the BuyMarket Order
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
          .mul(collateralTokenUnit)
          .div(makerAmount) // result has collateral token decimals
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
  console.log('Average rate', avgExpectedRate)
  // Check how many existing Buy Limit orders the user has outstanding in the orderbook.
  // Note that in Buy Limit, the makerToken is the collateral token which is the relevant token for approval.
  // TODO: Outsource this function into OpenOrders.ts, potentially integrate into getUserOrders function
  const getTotalBuyLimitOrderAmountUser = async (maker) => {
    let existingOrdersAmount = ZERO
    if (responseBuy.length == 0) {
      // Double check any limit orders exists
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
      getCollateralInWallet(userAddress).then(async (val) => {
        // Use values returned from getCollateralInWallet to initialize variables
        setCollateralBalance(val.balance)
        setAllowance(val.allowance)

        // Get Sell Limit orders which the user is going to fill during the Buy Market operation
        if (responseSell.length > 0) {
          getSellLimitOrders().then((orders) => {
            setExistingSellLimitOrders(orders)
          })
        }
        // Get the user's (maker) existing Buy Limit orders which block some of the user's allowance
        getTotalBuyLimitOrderAmountUser(userAddress).then((amount) => {
          const remainingAmount = val.allowance.sub(amount) // May be negative if user manually revokes allowance
          setExistingBuyLimitOrdersAmountUser(amount)
          setRemainingAllowance(remainingAmount)
        })
      })
    }
  }, [responseBuy, responseSell, userAddress, Web3Provider])
  //useEffect Function for the buyMarket Order

  useEffect(() => {
    // Calculate average price
    if (numberOfOptions.gt(0) && existingSellLimitOrders.length > 0) {
      // If user has entered an input into the Number field and there are existing Sell Limit orders to fill in the orderbook...

      // User input (numberOfOptions) corresponds to the maker token in Sell Limit.
      let makerAmountToFill = numberOfOptions // 18 decimals

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
        console.log('Expected Rate', expectedRate)
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
              .div(collateralTokenUnit)
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
        .mul(collateralTokenUnit) // scaling for high precision integer math
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
      if (numberOfOptions.eq(0)) {
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
    if (remainingAllowance.sub(youPay).lte(0)) {
      setIsApproved(false)
    } else {
      setIsApproved(true)
    }
  }, [remainingAllowance, youPay, userAddress])

  const createBtnDisabled =
    !isApproved || youPay.lte(0) || collateralBalance.sub(youPay).lt(0)
  const fillBtnDisabled =
    !isApproved || orderBtnDisabled || collateralBalance.sub(youPay).lt(0)
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
                  Number(formatUnits(collateralBalance, decimals))
                )}{' '}
                {tokenSymbol}{' '}
              </Typography>
              <Button
                variant="text"
                color="secondary"
                onClick={() => {
                  if (collateralBalance != null) {
                    setNumberOfOptions(collateralBalance)
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
            id="outlined-number"
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
          <TextField
            id="outlined-number"
            label="You Pay (Inc. fees)"
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
            value={toExponentialOrNumber(Number(formatUnits(youPay, decimals)))}
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

export default BuyOrder
