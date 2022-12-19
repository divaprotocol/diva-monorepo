import React, { useState } from 'react'
import { useEffect } from 'react'
import AddIcon from '@mui/icons-material/Add'
import InfoIcon from '@mui/icons-material/InfoOutlined'
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
import ERC20_ABI from '../../../abi/ERC20ABI.json'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
import { Box, Container, FormLabel, Stack, Tooltip } from '@mui/material'
import { useParams } from 'react-router-dom'
import { selectUserAddress } from '../../../Redux/appSlice'
import { BigNumber } from 'ethers'
import {
  setBreakEven,
  setIntrinsicValue,
  setMaxPayout,
  setMaxYield,
} from '../../../Redux/Stats'
import { TRADING_FEE } from '../../../constants'
import {
  calcPayoffPerToken,
  calcBreakEven,
} from '../../../Util/calcPayoffPerToken'
import CheckIcon from '@mui/icons-material/Check'
import { LoadingButton } from '@mui/lab'
import { useConnectionContext } from '../../../hooks/useConnectionContext'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ZERO = BigNumber.from(0)
const feeMultiplier = (1 + TRADING_FEE).toString()

export default function BuyMarket(props: {
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
  const [Web3Provider, setWeb3Provider] = useState<Web3>()

  const responseSell = useAppSelector((state) => state.tradeOption.responseSell)
  let responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  const { getWeb3JsProvider, provider } = useConnectionContext()

  const web3 = new Web3(Web3Provider as any)

  useEffect(() => {
    const init = async () => {
      const web3 = await getWeb3JsProvider()
      setWeb3Provider(web3)
    }
    init()
  }, [getWeb3JsProvider])

  const userAddress = useAppSelector(selectUserAddress)

  const option = props.option
  const exchangeProxy = props.exchangeProxy
  const makerToken = props.tokenAddress
  const takerToken = option.collateralToken.id
  const takerTokenContract =
    takerToken != null && new web3.eth.Contract(ERC20_ABI as any, takerToken)
  const usdPrice = props.usdPrice
  const decimals = option.collateralToken.decimals
  const collateralTokenUnit = parseUnits('1', decimals)

  const [numberOfOptions, setNumberOfOptions] = React.useState(ZERO) // User input field
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
  const [approveLoading, setApproveLoading] = React.useState(false)
  const [fillLoading, setFillLoading] = React.useState(false)
  const [orderBtnDisabled, setOrderBtnDisabled] = React.useState(true)
  const [allowance, setAllowance] = React.useState(ZERO)
  const [remainingAllowance, setRemainingAllowance] = React.useState(ZERO)
  // eslint-disable-next-line prettier/prettier
  const [collateralBalance, setCollateralBalance] = React.useState(ZERO)

  const params: { tokenType: string } = useParams()
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const dispatch = useAppDispatch()
  const isLong = window.location.pathname.split('/')[2] === 'long'

  const handleNumberOfOptions = (value: string) => {
    if (value !== '') {
      const nbrOptions = parseUnits(value, decimals)
      setNumberOfOptions(nbrOptions)

      // Disable fill order button if youPay amount (incl. fees) exceeds user's wallet balance
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

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      // Remaining allowance - youPay (incl. fee) <= 0
      setApproveLoading(true)

      if (numberOfOptions.gt(0)) {
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
    } else {
      // Remaining allowance - youPay (incl. fee) > 0

      setFillLoading(true)
      const orderData = {
        taker: userAddress,
        provider: provider,
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
  const getCollateralInWallet = async (takerAccount: string) => {
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

  // Check how many existing Buy Limit orders the user has outstanding in the orderbook.
  // Note that in Buy Limit, the makerToken is the collateral token which is the relevant token for approval.
  // As remainingFillableMakerAmount is not directly available, it has to be backed out from remainingFillableTakerAmount, takerAmount and makerAmount
  // TODO: Outsource this function into OpenOrders.ts, potentially integrate into getUserOrders function
  const getTotalBuyLimitOrderAmountUser = async (maker) => {
    let existingOrdersAmount = ZERO
    if (responseBuy.length == 0) {
      // Double check if any limit orders exists
      const rBuy: any = await get0xOpenOrders(
        takerToken,
        makerToken,
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
        const takerAmount = BigNumber.from(order.takerAmount) // position token
        const makerAmount = BigNumber.from(order.makerAmount) // collateral token

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

        // Get the user's (taker) existing Buy Limit orders which block some of the user's allowance
        getTotalBuyLimitOrderAmountUser(userAddress).then((amount) => {
          const remainingAmount = val.allowance.sub(amount) // May be negative if user manually revokes allowance but should go back to zero if 0x orders are refreshed and reflect the actually fillable amount
          setExistingBuyLimitOrdersAmountUser(amount)
          setRemainingAllowance(remainingAmount)
        })
      })
    }
  }, [responseSell, responseBuy, userAddress, Web3Provider])

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
    if (avgExpectedRate.gt(0)) {
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

    if (!avgExpectedRate.eq(0)) {
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
  }, [option, avgExpectedRate, usdPrice, userAddress])

  useEffect(() => {
    if (remainingAllowance.sub(youPay).gt(0)) {
      setIsApproved(true)
    }
    if (remainingAllowance.sub(youPay).lte(0)) {
      setIsApproved(false)
    }
  }, [remainingAllowance, youPay, userAddress])

  const fillBtnDisabled =
    !isApproved || orderBtnDisabled || collateralBalance.sub(youPay).lt(0)
  const approveBtnDisabled = isApproved || youPay.lte(0) // No collateralBalance.sub(youPay).lt(0) condition as a user should be able to approve any amount they want

  return (
    <Box height="100%">
      <form onSubmit={handleOrderSubmit}>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>Number</LabelStyle>
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
            <Stack>
              <LabelStyle>You Pay (incl. 1% fee) </LabelStyle>
              <FormLabel sx={{ color: 'Gray', fontSize: 11, paddingTop: 0.7 }}>
                Remaining allowance:{' '}
                {Number(formatUnits(remainingAllowance, decimals)) <
                0.00000000001
                  ? 0
                  : toExponentialOrNumber(
                      Number(formatUnits(remainingAllowance, decimals))
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
                  Number(formatUnits(collateralBalance, decimals))
                )}
              </FormLabel>
            </Stack>
          </RightSideLabel>
        </FormDiv>
        <CreateButtonWrapper />
        <Container sx={{ marginBottom: 2 }}>
          <Stack direction={'row'} spacing={1}>
            <LoadingButton
              variant="contained"
              sx={{ width: '50%', height: '45px' }}
              loading={approveLoading}
              color="primary"
              size="large"
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
              size="large"
              startIcon={<AddIcon />}
              type="submit"
              value="Submit"
              disabled={fillBtnDisabled}
            >
              {'Fill'}
            </LoadingButton>
          </Stack>
        </Container>
      </form>
    </Box>
  )
}
