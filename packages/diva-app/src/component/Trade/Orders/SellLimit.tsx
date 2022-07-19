import React, { FormEvent, useState } from 'react'
import { useEffect } from 'react'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import { FormLabel, MenuItem, Stack, Tooltip } from '@mui/material'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import { sellLimitOrder } from '../../../Orders/SellLimit'
import { ExpectedRateInfoText, LabelStyle } from './UiStyles'
import { LabelGrayStyle } from './UiStyles'
import { LabelStyleDiv } from './UiStyles'
import { FormDiv } from './UiStyles'
import { FormInput } from './UiStyles'
import { RightSideLabel } from './UiStyles'
import { CreateButtonWrapper } from './UiStyles'
import { LimitOrderExpiryDiv } from './UiStyles'
import { useStyles } from './UiStyles'
import { Pool } from '../../../lib/queries'
import { toExponentialOrNumber } from '../../../Util/utils'
import Web3 from 'web3'
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { formatEther, formatUnits, parseUnits } from 'ethers/lib/utils'
import ERC20_ABI from '@diva/contracts/abis/erc20.json'
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
import { BigNumber } from 'ethers'
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { useParams } from 'react-router-dom'
import { selectUserAddress } from '../../../Redux/appSlice'
import {
  setBreakEven,
  setIntrinsicValue,
  setMaxYield,
  setMaxPayout,
} from '../../../Redux/Stats'
import {
  calcPayoffPerToken,
  calcBreakEven,
} from '../../../Util/calcPayoffPerToken'
import { setResponseSell } from '../../../Redux/TradeOption'
import CheckIcon from '@mui/icons-material/Check'
const web3 = new Web3(Web3.givenProvider)
const ZERO = BigNumber.from(0)

export default function SellLimit(props: {
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
  let responseSell = useAppSelector((state) => state.tradeOption.responseSell)

  const userAddress = useAppSelector(selectUserAddress)

  const option = props.option
  const exchangeProxy = props.exchangeProxy
  const makerToken = props.tokenAddress
  const takerToken = option.collateralToken.id
  const makerTokenContract = new web3.eth.Contract(ERC20_ABI as any, makerToken)
  const usdPrice = props.usdPrice
  const decimals = option.collateralToken.decimals
  const positionTokenUnit = parseUnits('1')
  const collateralTokenUnit = parseUnits('1', decimals)

  const classes = useStyles()

  const [numberOfOptions, setNumberOfOptions] = React.useState(ZERO) // User input field
  const [pricePerOption, setPricePerOption] = React.useState(ZERO) // User input field
  const [youReceive, setYouReceive] = React.useState(ZERO)
  const [expiry, setExpiry] = React.useState(5)
  const [
    existingSellLimitOrdersAmountUser,
    setExistingSellLimitOrdersAmountUser,
  ] = React.useState(ZERO)

  const [isApproved, setIsApproved] = React.useState(false)
  const [allowance, setAllowance] = React.useState(ZERO)
  const [remainingAllowance, setRemainingAllowance] = React.useState(ZERO)
  const [optionBalance, setOptionBalance] = React.useState(ZERO)

  const params: { tokenType: string } = useParams()
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const dispatch = useAppDispatch()
  const isLong = window.location.pathname.split('/')[2] === 'long'

  const handleNumberOfOptions = (value: string) => {
    if (value !== '') {
      const nbrOptions = parseUnits(value)
      if (nbrOptions.gt(0)) {
        setNumberOfOptions(nbrOptions)
        if (isApproved === false) {
          // Activate button for approval
        } else {
          if (pricePerOption.gt(0)) {
            const youReceive = pricePerOption
              .mul(numberOfOptions)
              .div(positionTokenUnit)
            setYouReceive(youReceive)
          }
        }
      }
    } else {
      setYouReceive(ZERO)
      setNumberOfOptions(ZERO)
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
            .div(positionTokenUnit)
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

  const handleExpirySelection = (event: SelectChangeEvent<number>) => {
    event.preventDefault()
    setExpiry(
      typeof event.target.value === 'string'
        ? parseInt(event.target.value)
        : event.target.value
    )
  }
  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      // Approved amount is 0 ...

      if (numberOfOptions.gt(0)) {
        // Calculate required allowance amount for position token (expressed as an integer with 18 decimals).
        const amountToApprove = allowance
          .add(numberOfOptions)
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

          alert(
            `Allowance for ${toExponentialOrNumber(
              Number(formatUnits(collateralAllowance))
            )} ${params.tokenType.toUpperCase()} tokens successfully set.`
          )
        }
      }
    } else {
      // Approved amount is > 0 ...

      if (optionBalance.gt(0)) {
        // User owns position tokens ...

        // TODO: Consider refactoring the if clauses a bit
        if (numberOfOptions.gt(remainingAllowance)) {
          // Entered position token amount exceeds remaining allowance ...

          // Get total amount of position tokens that the user wants to sell (incl. the user's existing Sell Limit orders)
          const totalSellAmount = numberOfOptions.add(
            existingSellLimitOrdersAmountUser
          )

          if (totalSellAmount.gt(optionBalance)) {
            // User has not enough position tokens to sell ...

            alert('Insufficient position token balance')
          } else {
            // Calculate additional allowance required to executed the Sell Limit order
            const additionalAllowance = numberOfOptions.sub(remainingAllowance)
            if (
              confirm(
                'The entered amount exceeds your current remaining allowance. Click OK to increase your allowance by ' +
                  toExponentialOrNumber(
                    Number(formatUnits(additionalAllowance))
                  ) +
                  ' ' +
                  params.tokenType.toUpperCase() +
                  ' tokens. Click CREATE ORDER after the allowance has been updated.'
              )
            ) {
              const amountToApprove = additionalAllowance
                .add(allowance)
                .add(BigNumber.from(100))

              // Set allowance. Returns 'undefined' if rejected by user.
              const approveResponse = await props.approve(
                amountToApprove,
                makerTokenContract,
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
            maker: userAddress,
            provider: web3,
            isBuy: false,
            nbrOptions: numberOfOptions,
            collateralDecimals: decimals,
            makerToken: makerToken,
            takerToken: takerToken,
            limitPrice: pricePerOption,
            orderExpiry: expiry,
            chainId: props.chainId,
            exchangeProxy: exchangeProxy,
          }
          sellLimitOrder(orderData)
            .then(async (response) => {
              if (response?.status === 200) {
                //need to invalidate cache order response since orderbook is updated
                dispatch(setResponseSell([]))
                await new Promise((resolve) => setTimeout(resolve, 2000))
                await props.handleDisplayOrder()
                handleFormReset()
              }
            })
            .catch(function (error) {
              console.error(error)
            })
        }
      } else {
        alert(
          'No ' + params.tokenType.toUpperCase() + ' tokens available to sell.'
        )
      }
    }
  }

  // TODO: Outsource this function into a separate file as it's the same across Buy/Sell Limit/Market
  const getOptionsInWallet = async (makerAccount) => {
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

  // Check how many existing Sell Limit orders the user has outstanding in the orderbook.
  // Note that in Sell Limit, the makerToken is the collateral token which is the relevant token for approval.
  // TODO: Outsource this function into OpenOrders.ts, potentially integrate into getUserOrders function
  const getTotalSellLimitOrderAmountUser = async (maker) => {
    let existingOrdersAmount = ZERO
    if (responseSell.length == 0) {
      // Double check any limit orders exists
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
    console.log({ userAddress })
    if (userAddress != null) {
      console.log('fetch options in wallet')
      getOptionsInWallet(userAddress).then((val) => {
        // Use values returned from getOptionsInWallet to initialize variables
        setOptionBalance(val.balance)
        setAllowance(val.allowance)
        console.log('getOptionsInWallet', val.allowance, val.allowance.lte(0))
        val.allowance.lte(0) ? setIsApproved(false) : setIsApproved(true)

        // Get the user's (maker) existing Sell Limit orders which block some of the user's allowance
        getTotalSellLimitOrderAmountUser(userAddress).then((amount) => {
          const remainingAmount = val.allowance.sub(amount) // May be negative if user manually revokes allowance
          setExistingSellLimitOrdersAmountUser(amount)
          setRemainingAllowance(remainingAmount)
          console.log(formatEther(amount), 'amount')
          console.log(formatEther(remainingAmount), 'remainingAmount')
          remainingAmount.lte(0) ? setIsApproved(false) : setIsApproved(true)
        })
      })
    }
  }, [responseSell])

  useEffect(() => {
    // if (allowance.sub(youReceive).lte(0)) {
    //   setIsApproved(true)
    // }
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
    } else {
      dispatch(setMaxYield('n/a'))
    }

    let breakEven: number | string

    if (!pricePerOption.eq(0)) {
      breakEven = calcBreakEven(
        pricePerOption,
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
              .mul(parseUnits('1'))
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
              .mul(parseUnits('1'))
              .div(BigNumber.from(option.supplyInitial))
          )
        )
      )
    }
  }, [
    allowance,
    option,
    pricePerOption,
    usdPrice,
    existingSellLimitOrdersAmountUser,
  ])

  useEffect(() => {
    if (remainingAllowance.sub(numberOfOptions).lte(0)) {
      setIsApproved(false)
    } else {
      setIsApproved(true)
    }
  }, [remainingAllowance, numberOfOptions])

  const _orderBtnDisabled =
    !numberOfOptions.gt(0) || !pricePerOption.gt(0) || !isApproved

  const _approveBtnDisabled = !numberOfOptions.gt(0) || isApproved

  return (
    <div>
      <form onSubmit={handleOrderSubmit}>
        <FormDiv>
          <LabelStyleDiv>
            <Stack>
              <LabelStyle>Number</LabelStyle>
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
          <FormInput
            type="text"
            onChange={(event) => handleNumberOfOptions(event.target.value)}
          />
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelStyle>Price</LabelStyle>
          </LabelStyleDiv>
          <FormLabel
            sx={{
              color: 'Gray',
              fontSize: 11,
              paddingTop: 2,
              paddingRight: 1.5,
              width: '60px',
            }}
          >
            {option.collateralToken.symbol +
              '/' +
              params.tokenType.toUpperCase() +
              ' '}
          </FormLabel>
          <FormInput
            width={'37%'}
            type="text"
            onChange={(event) => handlePricePerOption(event.target.value)}
          />
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
            <LabelGrayStyle>Wallet Balance</LabelGrayStyle>
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
        <FormDiv>
          <LabelStyleDiv>
            <Stack direction={'row'} spacing={0.5}>
              <FormLabel sx={{ color: 'White' }}>Order Expires in</FormLabel>
              <Tooltip
                title={<React.Fragment>{ExpectedRateInfoText}</React.Fragment>}
                sx={{ color: 'Gray', fontSize: 2 }}
              >
                <InfoIcon style={{ fontSize: 15, color: 'grey' }} />
              </Tooltip>
            </Stack>
          </LabelStyleDiv>
          <LimitOrderExpiryDiv>
            <FormControl className={classes.formControl}>
              <Select
                value={expiry}
                onChange={(event) => handleExpirySelection(event)}
                displayEmpty
                className={classes.selectEmpty}
                inputProps={{ 'aria-label': 'Without label' }}
              >
                <MenuItem value={5}>
                  <LabelGrayStyle>5 Minutes</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={10}>
                  <LabelGrayStyle>10 Minutes</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={20}>
                  <LabelGrayStyle>20 Minutes</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={30}>
                  <LabelGrayStyle>30 Minutes</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={60}>
                  <LabelGrayStyle>1 Hour</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={60 * 4}>
                  <LabelGrayStyle>4 Hours</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={60 * 12}>
                  <LabelGrayStyle>12 Hours</LabelGrayStyle>
                </MenuItem>
                <MenuItem value={60 * 24}>
                  <LabelGrayStyle>1 Day</LabelGrayStyle>
                </MenuItem>
              </Select>
            </FormControl>
          </LimitOrderExpiryDiv>
        </FormDiv>
        <CreateButtonWrapper />
        <Box marginLeft={3} marginBottom={2}>
          <Stack direction={'row'} spacing={1}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              startIcon={<CheckIcon />}
              type="submit"
              value="Submit"
              disabled={_approveBtnDisabled}
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
              disabled={_orderBtnDisabled}
            >
              {'Create Order'}
            </Button>
          </Stack>
        </Box>
      </form>
    </div>
  )
}
