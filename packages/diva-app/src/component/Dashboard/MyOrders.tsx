import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Typography,
  Button,
  Stack,
  InputAdornment,
  Input,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import TableContainer from '@mui/material/TableContainer'
import { formatUnits } from 'ethers/lib/utils'
import { useState, useEffect } from 'react'
import { getOrderDetails, getUserOrders } from '../../DataService/OpenOrders'
import { cancelLimitOrder } from '../../Orders/CancelLimitOrder'
import {
  selectChainId,
  selectPools,
  selectUserAddress,
} from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { getDateTime, getExpiryMinutesFromNow } from '../../Util/Dates'
import { Search } from '@mui/icons-material'
import { CoinIconPair } from '../CoinIcon'
import { useHistory } from 'react-router-dom'

export function MyOrders() {
  const chainId = useAppSelector(selectChainId)
  const makerAccount = useAppSelector(selectUserAddress)
  const [dataOrders, setDataOrders] = useState([])
  const pools = useAppSelector((state) => selectPools(state))
  const [search, setSearch] = useState('')
  const history = useHistory()
  const trimPools = pools.map((pool) => {
    return {
      id: pool.id,
      collateralToken: pool.collateralToken,
      underlying: pool.referenceAsset,
      shortToken: pool.shortToken,
      longToken: pool.longToken,
    }
  })

  function getBuyOrderFields(record: any, pool: any) {
    const order = record.order
    const metaData = record.metaData
    const type = 'Buy'
    const poolId = pool.id
    const underlying = pool.underlying
    const decimals = pool.collateralToken.decimals
    const takerAmount = formatUnits(order.takerAmount)
    const makerAmount = formatUnits(order.makerAmount, decimals)
    let quantity = 0
    let price = 0
    let payReceive = 0
    const remainingTakerAmount = formatUnits(
      metaData.remainingFillableTakerAmount
    )
    if (remainingTakerAmount < takerAmount) {
      quantity = Number(remainingTakerAmount)
    } else {
      quantity = Number(takerAmount)
    }
    payReceive = Number(makerAmount)
    price = Number(payReceive) / Number(takerAmount)
    return {
      type: type,
      poolId: poolId,
      underlying: underlying,
      quantity: quantity,
      price: price,
      payReceive: payReceive,
      expiry: getDateTime(order.expiry),
      expiryMins: getExpiryMinutesFromNow(order.expiry) + ' mins',
      orderHash: metaData.orderHash,
    }
  }
  function getSellOrderFields(record: any, pool: any) {
    const order = record.order
    const metaData = record.metaData
    const type = 'Sell'
    const poolId = pool.id
    const underlying = pool.underlying
    const decimals = pool.collateralToken.decimals
    const takerAmount = formatUnits(order.takerAmount, decimals)
    const makerAmount = formatUnits(order.makerAmount)
    let quantity = 0
    let price = 0
    let payReceive = 0
    const remainingTakerAmount = formatUnits(
      metaData.remainingFillableTakerAmount,
      decimals
    )
    const askAmount = Number(takerAmount) / Number(makerAmount)
    if (remainingTakerAmount == takerAmount) {
      quantity = Number(makerAmount)
    } else {
      quantity = Number(remainingTakerAmount) / askAmount
    }
    payReceive = Number(remainingTakerAmount)
    price = askAmount
    return {
      type: type,
      poolId: poolId,
      underlying: underlying,
      quantity: quantity,
      price: price,
      payReceive: payReceive,
      expiry: getDateTime(order.expiry),
      expiryMins: getExpiryMinutesFromNow(order.expiry) + ' mins',
      orderHash: metaData.orderHash,
    }
  }

  function getDataOrders(userOrders: any) {
    const dataOrders = []
    const records = userOrders
    records.forEach((record) => {
      const order = record.order
      const sellOrderShort = trimPools.filter(
        (token) => token.shortToken.id === order.makerToken
      )
      const sellOrderLong = trimPools.filter(
        (token) => token.longToken.id === order.makerToken
      )
      const buyOrderShort = trimPools.filter(
        (token) => token.shortToken.id === order.takerToken
      )
      const buyOrderLong = trimPools.filter(
        (token) => token.longToken.id === order.takerToken
      )
      if (sellOrderShort.length > 0) {
        const fields = getSellOrderFields(record, sellOrderShort[0])
        const shortFields = {
          id: 'short' + records.indexOf(record as never),
          position: 'short',
          symbol: sellOrderShort[0].shortToken.symbol,
        }
        dataOrders.push({ ...fields, ...shortFields })
      }
      if (sellOrderLong.length > 0) {
        const fields = getSellOrderFields(record, sellOrderLong[0])
        const longFields = {
          id: 'long' + records.indexOf(record as never),
          position: 'long',
          symbol: sellOrderLong[0].longToken.symbol,
        }
        dataOrders.push({ ...fields, ...longFields })
      }
      if (buyOrderShort.length > 0) {
        const fields = getBuyOrderFields(record, buyOrderShort[0])
        const shortFields = {
          id: 'short' + records.indexOf(record as never),
          position: 'short',
          symbol: buyOrderShort[0].shortToken.symbol,
        }
        dataOrders.push({ ...fields, ...shortFields })
      }
      if (buyOrderLong.length > 0) {
        const fields = getBuyOrderFields(record, buyOrderLong[0])
        const longFields = {
          id: 'long' + records.indexOf(record as never),
          position: 'long',
          symbol: buyOrderLong[0].longToken.symbol,
        }
        dataOrders.push({ ...fields, ...longFields })
      }
    })
    return dataOrders
  }

  async function cancelOrder(event, order, chainId) {
    event.stopPropagation()
    const orderHash = order.orderHash
    //get the order details in current form from 0x before cancelling it.
    const cancelOrder = await getOrderDetails(orderHash, chainId)
    cancelLimitOrder(cancelOrder, chainId).then(function (
      cancelOrderResponse: any
    ) {
      const log = cancelOrderResponse?.logs?.[0]
      if (log != null && log.event == 'OrderCancelled') {
        alert('Order successfully canceled')
        //update myOrders table
        componentDidMount()
      } else {
        alert('order could not be canceled')
      }
    })
  }

  const componentDidMount = async () => {
    const userOrders = await getUserOrders(makerAccount, chainId)
    const dataOrders = getDataOrders(userOrders)
    setDataOrders(dataOrders)
  }

  useEffect(() => {
    componentDidMount()
  }, [])

  function openTrade(order: any) {
    history.push(`../../${order.poolId}/${order.position}`)
  }

  return (
    <Stack
      direction="row"
      sx={{
        height: '100%',
      }}
      spacing={6}
    >
      <>
        <Stack height="100%" width="100%">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'end',
              flexDirection: 'column',
              paddingBottom: '1em',
            }}
          >
            <Input
              value={search}
              placeholder="Filter underlying"
              aria-label="Filter underlying"
              onChange={(e) => setSearch(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              }
            />
          </Box>
          <TableContainer component={Paper}>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  <TableCell align="left">Asset Id</TableCell>
                  <TableCell align="left">Underlying</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="center">Price</TableCell>
                  <TableCell align="center">Pay/Receive</TableCell>
                  <TableCell align="left">Cancel</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataOrders.length > 0 ? (
                  dataOrders.map((order: any, index: number) => {
                    const labelId = `enhanced-table-${index}`
                    return (
                      <TableRow
                        key={index}
                        hover
                        onClick={() => openTrade(order)}
                      >
                        <TableCell align="left">
                          <Box>
                            <Typography variant="subtitle1">
                              {order.symbol}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="left">
                          <Stack direction={'row'}>
                            <Stack direction={'row'} paddingRight={'0.5em'}>
                              <CoinIconPair assetName={order.underlying} />
                            </Stack>
                            <Typography variant="subtitle1">
                              {order.underlying}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell
                          component="th"
                          id={labelId}
                          scope="row"
                          align="left"
                        >
                          <Box>
                            <Typography variant="subtitle1">
                              {order.type}
                            </Typography>
                            <Typography variant="caption" noWrap>
                              {order.expiry}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="subtitle1">
                              {order.quantity === 0
                                ? '-'
                                : order.quantity.toFixed(2)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="subtitle1">
                              {order.price.toFixed(4)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="subtitle1">
                              {order.quantity === 0
                                ? '-'
                                : order.payReceive.toFixed(4)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="left">
                          <Box>
                            <Typography variant="subtitle1">
                              <Button
                                variant="outlined"
                                startIcon={<DeleteIcon />}
                                size="small"
                                onClick={(event) =>
                                  cancelOrder(event, dataOrders[index], chainId)
                                }
                              >
                                Cancel
                              </Button>
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      None
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Stack>
      </>
    </Stack>
  )
}
