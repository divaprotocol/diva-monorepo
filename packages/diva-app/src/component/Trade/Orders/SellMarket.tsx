import React, { useState } from 'react'
import { useEffect } from 'react'
import Button from '@mui/material/Button'
import AddIcon from '@mui/icons-material/Add'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import { LabelStyle } from './UiStyles'
import { LabelGrayStyle } from './UiStyles'
import { LabelStyleDiv } from './UiStyles'
import { FormDiv } from './UiStyles'
import { FormInput } from './UiStyles'
import { RightSideLabel } from './UiStyles'
import { CreateButtonWrapper } from './UiStyles'
import { ExpectedRateInfoText } from './UiStyles'
import Web3 from 'web3'
import { Pool } from '../../../lib/queries'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { BigNumber } from '@0x/utils'
import { sellMarketOrder } from '../../../Orders/SellMarket'
// eslint-disable-next-line @typescript-eslint/no-var-requires
import ERC20_ABI from '@diva/contracts/abis/erc20.json'
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from 'ethers/lib/utils'
import { getComparator, stableSort, totalDecimals } from './OrderHelper'
import { useAppDispatch, useAppSelector } from '../../../Redux/hooks'
import { get0xOpenOrders } from '../../../DataService/OpenOrders'
import { FormLabel, Stack, Tooltip } from '@mui/material'
import { useParams } from 'react-router-dom'
import { selectChainId, selectUserAddress } from '../../../Redux/appSlice'
import { BigNumber as BigENumber } from '@ethersproject/bignumber/lib/bignumber'
import {
  setBreakEven,
  setIntrinsicValue,
  setMaxPayout,
  setMaxYield,
} from '../../../Redux/Stats'
import { getUnderlyingPrice } from '../../../lib/getUnderlyingPrice'
import { calcPayoffPerToken } from '../../../Util/calcPayoffPerToken'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const web3 = new Web3(Web3.givenProvider)

export default function SellMarket(props: {
  option: Pool
  handleDisplayOrder: () => any
  tokenAddress: string
  exchangeProxy: string
  chainId: number
}) {
  const responseBuy = useAppSelector((state) => state.tradeOption.responseBuy)
  let responseSell = useAppSelector((state) => state.tradeOption.responseSell)
  const chainId = useAppSelector(selectChainId)
  const option = props.option
  const optionTokenAddress = props.tokenAddress
  const [numberOfOptions, setNumberOfOptions] = React.useState(0.0)
  const [avgExpectedRate, setAvgExpectedRate] = React.useState(0.0)
  const [youReceive, setYouReceive] = React.useState(0.0)
  const [existingBuyLimitOrders, setExistingBuyLimitOrders] = React.useState([])
  const [isApproved, setIsApproved] = React.useState(false)
  const [remainingApprovalAmount, setRemainingApprovalAmount] =
    React.useState(0.0)
  const [existingOrdersAmount, setExistingOrdersAmount] = React.useState(0.0)
  const [allowance, setAllowance] = React.useState(0.0)
  // eslint-disable-next-line prettier/prettier
  const exchangeProxyAddress = props.exchangeProxy
  const [walletBalance, setWalletBalance] = React.useState(0)
  const takerToken = props.tokenAddress
  const takerTokenContract = new web3.eth.Contract(ERC20_ABI as any, takerToken)
  const params: { tokenType: string } = useParams()

  const [usdPrice, setUsdPrice] = useState('')
  const maxPayout = useAppSelector((state) => state.stats.maxPayout)
  const dispatch = useAppDispatch()

  const isLong = window.location.pathname.split('/')[2] === 'long'
  const handleNumberOfOptions = (value: string) => {
    if (value !== '') {
      const nbrOptions = parseFloat(value)
      setNumberOfOptions(nbrOptions)
    } else {
      setYouReceive(0.0)
    }
  }

  const approveSellAmount = async (amount) => {
    const amountBigNumber = parseUnits(amount.toString())
    await takerTokenContract.methods
      .approve(exchangeProxyAddress, amountBigNumber)
      .send({ from: makerAccount })

    const allowance = await takerTokenContract.methods
      .allowance(makerAccount, exchangeProxyAddress)
      .call()
    return allowance
  }

  const handleOrderSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isApproved) {
      if (numberOfOptions > 0) {
        const amount = Number(
          (allowance + numberOfOptions).toFixed(
            totalDecimals(allowance, numberOfOptions)
          )
        )

        let approvedAllowance = await approveSellAmount(amount)
        approvedAllowance = Number(
          formatUnits(approvedAllowance.toString(), 18)
        )
        const remainingApproval = Number(
          (approvedAllowance - existingOrdersAmount).toFixed(
            totalDecimals(approvedAllowance, existingOrdersAmount)
          )
        )
        setRemainingApprovalAmount(remainingApproval)
        setAllowance(allowance)
        setIsApproved(true)
        alert(
          'Total allowance ' +
            approvedAllowance +
            ` for ${params.tokenType} successfully set`
        )
      } else {
        alert('please enter positive balance for approval')
      }
    } else {
      if (walletBalance > 0) {
        const totalAmount = numberOfOptions + existingOrdersAmount
        if (numberOfOptions > remainingApprovalAmount) {
          if (totalAmount > walletBalance) {
            alert('Not sufficiant balance')
          } else {
            const additionalApproval = Number(
              (numberOfOptions - remainingApprovalAmount).toFixed(
                totalDecimals(numberOfOptions, remainingApprovalAmount)
              )
            )
            if (
              confirm(
                'options to sell exceeds approval limit, do you want to approve additional ' +
                  additionalApproval +
                  ' to complete this order?'
              )
            ) {
              let newAllowance = Number(
                (additionalApproval + allowance).toFixed(
                  totalDecimals(additionalApproval, allowance)
                )
              )
              newAllowance = await approveSellAmount(newAllowance)
              newAllowance = Number(formatUnits(newAllowance.toString(), 18))
              setRemainingApprovalAmount(newAllowance)
              setAllowance(newAllowance)
            } else {
              //TBD discuss this case
              setIsApproved(true)
              console.log('nothing done')
            }
          }
        } else {
          const orderData = {
            maker: makerAccount,
            provider: web3,
            isBuy: false,
            nbrOptions: numberOfOptions,
            collateralDecimals: option.collateralToken.decimals,
            makerToken: optionTokenAddress,
            takerToken: option.collateralToken.id,
            ERC20_ABI: ERC20_ABI,
            avgExpectedRate: avgExpectedRate,
            existingLimitOrders: existingBuyLimitOrders,
            chainId: chainId,
          }
          sellMarketOrder(orderData).then((orderFillStatus: any) => {
            let orderFilled = false
            if (!(orderFillStatus == undefined)) {
              if (!('logs' in orderFillStatus)) {
                alert('order could not be filled')
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
                      return
                    } else {
                      alert('Order could not be filled')
                    }
                  }
                })
              }
            } else {
              alert('order could not be filled')
            }
            if (orderFilled) {
              alert('Order successfully filled')
            }
          })
        }
      } else {
        alert('No ' + params.tokenType.toUpperCase() + ' avaible to sell')
      }
    }
  }

  const makerAccount = useAppSelector(selectUserAddress)

  const getOptionsInWallet = async () => {
    let allowance = await takerTokenContract.methods
      .allowance(makerAccount, exchangeProxyAddress)
      .call()
    let balance = await takerTokenContract.methods
      .balanceOf(makerAccount)
      .call()
    balance = Number(formatUnits(balance.toString(), 18))
    allowance = Number(formatUnits(allowance.toString(), 18))
    return {
      balance: balance,
      account: makerAccount,
      approvalAmount: allowance,
    }
  }

  const getBuyLimitOrders = async () => {
    const orders: any = []
    responseBuy.forEach((data: any) => {
      const order = JSON.parse(JSON.stringify(data.order))
      const makerAmount = Number(
        formatUnits(order.makerAmount, option.collateralToken.decimals)
      )
      const takerAmount = Number(formatUnits(order.takerAmount))
      const expectedRate = (makerAmount / takerAmount).toFixed(
        totalDecimals(makerAmount, takerAmount)
      )
      order['expectedRate'] = expectedRate
      order['remainingFillableTakerAmount'] =
        data.metaData.remainingFillableTakerAmount
      orders.push(order)
    })
    const sortOrder = 'desOrder'
    const orderBy = 'expectedRate'
    const sortedOrders = stableSort(orders, getComparator(sortOrder, orderBy))
    if (sortedOrders.length) {
      const bestRate = sortedOrders[0].expectedRate
      setAvgExpectedRate(Number(bestRate))
    }

    return sortedOrders
  }

  const getMakerOrdersTotalAmount = async (maker) => {
    let existingOrderAmount = new BigNumber('0')
    if (responseSell.length == 0) {
      //Double check the any limit orders exists
      const rSell: any = await get0xOpenOrders(
        optionTokenAddress,
        option.collateralToken.id,
        chainId
      )
      responseSell = rSell
    }
    responseSell.forEach((data: any) => {
      const order = data.order
      if (maker == order.maker) {
        const metaData = data.metaData
        const remainingTakerAmount = new BigNumber(
          metaData.remainingFillableTakerAmount.toString()
        )
        if (remainingTakerAmount == order.makerAmount) {
          existingOrderAmount = existingOrderAmount.plus(order.makerAmount)
        } else {
          const makerAmount = new BigNumber(order.makerAmount)
          const takerAmount = new BigNumber(order.takerAmount)
          const askAmount = takerAmount.dividedBy(makerAmount)
          const quantity = remainingTakerAmount.dividedBy(askAmount)
          existingOrderAmount = existingOrderAmount.plus(quantity)
        }
      }
    })
    return Number(formatUnits(existingOrderAmount.toString(), 18))
  }

  useEffect(() => {
    getOptionsInWallet().then((val) => {
      !Number.isNaN(val.balance)
        ? setWalletBalance(Number(val.balance))
        : setWalletBalance(0)
      setAllowance(val.approvalAmount)
      setRemainingApprovalAmount(val.approvalAmount)
      val.approvalAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      if (responseBuy.length > 0) {
        getBuyLimitOrders().then((orders) => {
          setExistingBuyLimitOrders(orders)
        })
      }
      getMakerOrdersTotalAmount(val.account).then((amount) => {
        setExistingOrdersAmount(amount)
        const remainingAmount = Number(
          (val.approvalAmount - amount).toFixed(
            totalDecimals(val.approvalAmount, amount)
          )
        )
        setRemainingApprovalAmount(remainingAmount)
        remainingAmount <= 0 ? setIsApproved(false) : setIsApproved(true)
      })
    })
  }, [responseBuy, responseSell])

  useEffect(() => {
    if (numberOfOptions > 0 && existingBuyLimitOrders.length > 0) {
      let count = numberOfOptions
      let cumulativeAvg = 0
      let cumulativeTaker = 0
      let cumulativeMaker = 0
      existingBuyLimitOrders.forEach((order: any) => {
        const makerAmount = Number(
          formatUnits(order.makerAmount, option.collateralToken.decimals)
        )
        const takerAmount = Number(formatUnits(order.takerAmount))
        const expectedRate = Number(
          (makerAmount / takerAmount).toFixed(
            totalDecimals(makerAmount, takerAmount)
          )
        )
        if (count > 0) {
          if (count <= takerAmount) {
            const orderTotalAmount = Number(
              (expectedRate * count).toFixed(totalDecimals(expectedRate, count))
            )
            cumulativeMaker = cumulativeMaker + orderTotalAmount
            cumulativeTaker = cumulativeTaker + count
            count = 0
          } else {
            cumulativeTaker = cumulativeTaker + takerAmount
            cumulativeMaker = cumulativeMaker + makerAmount
            count = count - takerAmount
          }
        }
      })
      cumulativeAvg = Number(
        (cumulativeMaker / cumulativeTaker).toFixed(
          totalDecimals(cumulativeMaker, cumulativeTaker)
        )
      )
      if (cumulativeAvg > 0) {
        const avg = cumulativeAvg
        setAvgExpectedRate(avg)
        const youReceive = avg * numberOfOptions
        setYouReceive(youReceive)
      }
    }
  }, [numberOfOptions])

  useEffect(() => {
    getUnderlyingPrice(option.referenceAsset).then((data) => {
      if (data != null) setUsdPrice(data)
    })
  }, [option.referenceAsset])

  useEffect(() => {
    if (usdPrice != '') {
      const { payoffPerLongToken, payoffPerShortToken } = calcPayoffPerToken(
        BigENumber.from(option.floor),
        BigENumber.from(option.inflection),
        BigENumber.from(option.cap),
        BigENumber.from(option.collateralBalanceLongInitial),
        BigENumber.from(option.collateralBalanceShortInitial),
        option.statusFinalReferenceValue === 'Open' &&
          parseUnits(usdPrice).gt(0)
          ? parseUnits(usdPrice)
          : BigENumber.from(option.finalReferenceValue),
        BigENumber.from(option.supplyInitial),
        option.collateralToken.decimals
      )
      if (avgExpectedRate > 0 && !isNaN(avgExpectedRate)) {
        dispatch(
          setMaxYield(
            parseFloat(
              formatEther(
                parseEther(maxPayout)
                  .mul(parseEther('1'))
                  .div(parseEther(String(avgExpectedRate)))
              )
            ).toFixed(2) + 'x'
          )
        )
      } else {
        dispatch(setMaxYield('n/a'))
      }
      if (isLong) {
        if (!isNaN(avgExpectedRate)) {
          const be1 = parseEther(String(avgExpectedRate))
            .mul(
              BigENumber.from(option.inflection).sub(
                BigENumber.from(option.floor)
              )
            )
            .mul(BigENumber.from(option.supplyInitial))
            .div(
              BigENumber.from(option.collateralBalanceLongInitial).mul(
                parseUnits('1', 18 - option.collateralToken.decimals)
              )
            )
            .div(parseEther('1'))
            .add(BigENumber.from(option.floor))

          const be2 = parseEther(String(avgExpectedRate))
            .mul(BigENumber.from(option.supplyInitial))
            .div(parseEther('1'))
            .sub(
              BigENumber.from(option.collateralBalanceLongInitial).mul(
                parseUnits('1', 18 - option.collateralToken.decimals)
              )
            )
            .mul(
              BigENumber.from(option.cap).sub(
                BigENumber.from(option.inflection)
              )
            )
            .div(
              BigENumber.from(option.collateralBalanceShortInitial).mul(
                parseUnits('1', 18 - option.collateralToken.decimals)
              )
            )
            .add(BigENumber.from(option.inflection))
          if (
            parseEther(String(avgExpectedRate)).gte(
              BigENumber.from(option.collateralBalanceLongInitial)
                .mul(parseUnits('1', option.collateralToken.decimals))
                .div(
                  BigENumber.from(option.collateralBalanceLongInitial).add(
                    BigENumber.from(option.collateralBalanceShortInitial)
                  )
                )
            )
          ) {
            dispatch(setBreakEven(formatEther(be2)))
          } else {
            dispatch(setBreakEven(formatEther(be1)))
          }
        }
        if (
          option.statusFinalReferenceValue === 'Open' &&
          parseFloat(usdPrice) == 0
        ) {
          dispatch(setIntrinsicValue('n/a'))
        } else {
          dispatch(setIntrinsicValue(formatEther(payoffPerLongToken)))
        }
        dispatch(
          setMaxPayout(
            formatEther(
              BigENumber.from(option.collateralBalanceLongInitial)
                .add(BigENumber.from(option.collateralBalanceShortInitial))
                .mul(parseUnits('1', 18 - option.collateralToken.decimals))
                .mul(parseEther('1'))
                .div(BigENumber.from(option.supplyInitial))
            )
          )
        )
      } else {
        if (!isNaN(avgExpectedRate) && avgExpectedRate != 0) {
          const be1 = parseEther(String(avgExpectedRate))
            .mul(BigENumber.from(option.supplyInitial))
            .div(parseEther('1'))
            .sub(
              BigENumber.from(option.collateralBalanceShortInitial).mul(
                parseUnits('1', 18 - option.collateralToken.decimals)
              )
            )
            .mul(
              BigENumber.from(option.inflection).sub(
                BigENumber.from(option.floor)
              )
            )
            .div(
              BigENumber.from(option.collateralBalanceLongInitial).mul(
                parseUnits('1', 18 - option.collateralToken.decimals)
              )
            )
            .sub(BigENumber.from(option.inflection))
            .mul(BigENumber.from('-1'))

          const be2 = parseEther(String(avgExpectedRate))
            .mul(BigENumber.from(option.supplyInitial))
            .div(
              BigENumber.from(option.collateralBalanceShortInitial).mul(
                parseUnits('1', 18 - option.collateralToken.decimals)
              )
            )
            .mul(
              BigENumber.from(option.cap).sub(
                BigENumber.from(option.inflection)
              )
            )
            .div(parseEther('1'))
            .sub(BigENumber.from(option.cap))
            .mul(BigENumber.from('-1'))

          if (
            parseEther(String(avgExpectedRate)).gte(
              BigENumber.from(option.collateralBalanceLongInitial)
                .mul(parseUnits('1', option.collateralToken.decimals))
                .div(
                  BigENumber.from(option.collateralBalanceLongInitial).add(
                    BigENumber.from(option.collateralBalanceShortInitial)
                  )
                )
            )
          ) {
            dispatch(setBreakEven(formatEther(be1)))
          } else {
            dispatch(setBreakEven(formatEther(be2)))
          }
        }
        if (
          option.statusFinalReferenceValue === 'Open' &&
          parseFloat(usdPrice) == 0
        ) {
          dispatch(setIntrinsicValue('n/a'))
        } else {
          dispatch(setIntrinsicValue(formatEther(payoffPerShortToken)))
        }
        dispatch(
          setMaxPayout(
            formatEther(
              BigENumber.from(option.collateralBalanceLongInitial)
                .add(BigENumber.from(option.collateralBalanceShortInitial))
                .mul(parseUnits('1', 18 - option.collateralToken.decimals))
                .mul(parseEther('1'))
                .div(BigENumber.from(option.supplyInitial))
            )
          )
        )
      }
    }
  }, [option, avgExpectedRate, usdPrice])
  return (
    <div>
      <form onSubmit={handleOrderSubmit}>
        <FormDiv>
          <LabelStyleDiv>
            <Stack>
              <LabelStyle>Number </LabelStyle>
              <FormLabel sx={{ color: 'Gray', fontSize: 8, paddingTop: 0.7 }}>
                Remaining allowance: {remainingApprovalAmount}
              </FormLabel>
            </Stack>
          </LabelStyleDiv>
          <FormLabel
            sx={{
              color: 'Gray',
              fontSize: 8,
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
              <Tooltip title={ExpectedRateInfoText}>
                <InfoIcon />
              </Tooltip>
            </Stack>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 8, paddingTop: 0.7 }}>
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
              <FormLabel sx={{ color: 'Gray', fontSize: 8, paddingTop: 0.7 }}>
                {option.collateralToken.symbol + ' '}
              </FormLabel>
              <FormLabel>{youReceive.toFixed(4)}</FormLabel>
            </Stack>
          </RightSideLabel>
        </FormDiv>
        <FormDiv>
          <LabelStyleDiv>
            <LabelGrayStyle>Wallet Balance</LabelGrayStyle>
          </LabelStyleDiv>
          <RightSideLabel>
            <Stack direction={'row'} justifyContent="flex-end" spacing={1}>
              <FormLabel sx={{ color: 'Gray', fontSize: 8, paddingTop: 0.7 }}>
                {params.tokenType.toUpperCase() + ' '}
              </FormLabel>
              <FormLabel>{walletBalance.toFixed(4)}</FormLabel>
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
            disabled={existingBuyLimitOrders.length > 0 ? false : true}
          >
            {isApproved ? 'Fill Order' : 'Approve'}
          </Button>
        </Box>
      </form>
    </div>
  )
}
