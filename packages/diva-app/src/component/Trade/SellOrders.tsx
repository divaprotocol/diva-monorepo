import { useState, useEffect } from 'react'
import { useAppSelector } from '../../Redux/hooks'
import { useConnectionContext } from '../../hooks/useConnectionContext'
import { setResponseBuy, setResponseSell } from '../../Redux/TradeOption'
import 'styled-components'
import styled from 'styled-components'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import { get0xOpenOrders } from '../../DataService/OpenOrders'
import { getDateTime } from '../../Util/Dates'
import { getExpiryMinutesFromNow } from '../../Util/Dates'
import { Pool } from '../../lib/queries'
import { formatUnits } from 'ethers/lib/utils'
import { selectChainId, selectUserAddress } from '../../Redux/appSlice'
import { useDispatch } from 'react-redux'

const PageDiv = styled.div`
  width: 100%;
`

function mapOrderData(
  records: [],
  option: Pool,
  optionTokenAddress: string,
  account: string
) {
  const orderbook: any = records.map((record: any) => {
    const order = record.order
    const orderMaker = order.maker
    const metaData = record.metaData
    if (account === orderMaker) {
      const makerToken = order.makerToken
      const tokenAddress = optionTokenAddress.toLowerCase()
      const orderType = makerToken === tokenAddress ? 'SELL' : 'BUY'
      let nbrOptions = 0
      let pricePerOption = 0
      let payReceive = 0

      if (makerToken === tokenAddress) {
        const takerAmount = formatUnits(
          order.takerAmount,
          option.collateralToken.decimals
        )
        const makerAmount = formatUnits(
          order.makerAmount,
          option.collateralToken.decimals
        )
        const remainingTakerAmount = formatUnits(
          metaData.remainingFillableTakerAmount,
          option.collateralToken.decimals
        )
        const askAmount = Number(takerAmount) / Number(makerAmount)

        if (remainingTakerAmount == makerAmount) {
          nbrOptions = Number(makerAmount)
        } else {
          nbrOptions = Number(remainingTakerAmount) / askAmount
        }
        payReceive = Number(remainingTakerAmount)
        pricePerOption = askAmount
      } else {
        const takerAmount = formatUnits(
          order.takerAmount,
          option.collateralToken.decimals
        )
        const makerAmount = formatUnits(
          order.makerAmount.toString(),
          option.collateralToken.decimals
        )
        const remainingTakerAmount = formatUnits(
          metaData.remainingFillableTakerAmount,
          option.collateralToken.decimals
        )
        if (remainingTakerAmount < takerAmount) {
          nbrOptions = Number(remainingTakerAmount)
        } else {
          nbrOptions = Number(takerAmount)
        }
        payReceive = Number(makerAmount)
        pricePerOption = Number(payReceive) / Number(takerAmount)
      }
      const expiry = getDateTime(order.expiry)
      const expiryMins =
        Math.floor(getExpiryMinutesFromNow(order.expiry) / 60) > 0
          ? Math.floor(getExpiryMinutesFromNow(order.expiry) / 60) +
            'h ' +
            (getExpiryMinutesFromNow(order.expiry) % 60) +
            'm'
          : getExpiryMinutesFromNow(order.expiry) + 'm'
      const orders = {
        id: orderType + records.indexOf(record as never),
        orderType: orderType,
        nbrOptions: nbrOptions,
        payReceive: payReceive,
        pricePerOption:
          pricePerOption.toFixed(4) + ' ' + option.collateralToken.symbol,
        expiry: expiry,
        expiryMins: expiryMins,
        orderHash: metaData.orderHash,
      }
      return orders
    }
  })
  return orderbook
}

export default function SellOrders(props: {
  option: Pool
  tokenAddress: string
  exchangeProxy: string
}) {
  const option = props.option
  const optionTokenAddress = props.tokenAddress
  let responseSell = useAppSelector((state) => state.tradeOption.responseSell)
  const dispatch = useDispatch()
  const [orders, setOrders] = useState([])
  const chainId = useAppSelector(selectChainId)
  const { provider } = useConnectionContext()
  const address = useAppSelector(selectUserAddress)

  const componentDidMount = async () => {
    const orderBook: any = []
    if (responseSell.length === 0) {
      const rSell = await get0xOpenOrders(
        optionTokenAddress,
        option.collateralToken.id,
        chainId,
        provider,
        props.exchangeProxy
      )
      if (rSell.length > 0) {
        responseSell = rSell
        dispatch(setResponseSell(responseSell))
      }
    }

    const orderBookSell = mapOrderData(
      responseSell,
      option,
      optionTokenAddress,
      address
    )

    if (orderBookSell.length > 0) {
      orderBookSell.forEach((order: any) => {
        if (order) {
          orderBook.push(order)
        }
      })
    }

    setOrders(orderBook)
  }

  useEffect(() => {
    if (responseSell.length === 0) {
      componentDidMount()
    }
  }, [])

  useEffect(() => {
    if (responseSell.length > 0) {
      componentDidMount()
    }
    return () => {
      if (responseSell.length > 0) {
        dispatch(setResponseSell([]))
        dispatch(setResponseBuy([]))
      }
    }
  }, [responseSell.length])

  return (
    <PageDiv>
      <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell align="center">Quantity</TableCell>
              <TableCell align="center">Price</TableCell>
              <TableCell align="center">Expires in</TableCell>
              <TableCell align="center">Buy</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order: any, index: number) => {
                const labelId = `enhanced-table-${index}`
                return (
                  <TableRow key={index} hover>
                    <TableCell align="center">
                      <Box>
                        <Typography variant="subtitle1">
                          {order.nbrOptions === 0
                            ? '-'
                            : order.nbrOptions.toFixed(4)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box>
                        <Typography variant="subtitle1">
                          {order.pricePerOption}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell
                      component="th"
                      id={labelId}
                      scope="row"
                      align="center"
                    >
                      <Box>
                        <Typography variant="subtitle1" color="#8e8e8e" noWrap>
                          {order.expiryMins}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="subtitle1">
                          <Button variant="outlined" size="small">
                            Buy
                          </Button>
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  None
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </PageDiv>
  )
}
