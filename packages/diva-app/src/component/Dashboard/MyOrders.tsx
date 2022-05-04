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
import { SideMenu } from './SideMenu'
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

  function getDataOrders(userOrders: any) {
    const dataOrders = []
    const records = userOrders
    records.forEach((record) => {
      const order = record.order
      const metaData = record.metaData
      const sellOrderPool = trimPools.filter(
        (token) => token.collateralToken.id === order.takerToken
      )
      const buyOrderPool = trimPools.filter(
        (token) => token.collateralToken.id === order.makerToken
      )
      let type = ''
      let quantity = 0
      let price = 0
      let payReceive = 0
      let poolId = ''
      let underlying = ''
      let position = ''
      let symbol = ''
      if (sellOrderPool.length > 0) {
        type = 'Sell'
        poolId = sellOrderPool[0].id
        underlying = sellOrderPool[0].underlying
        if (order.makerToken == sellOrderPool[0].shortToken.id) {
          position = 'short'
          symbol = sellOrderPool[0].shortToken.symbol
        } else {
          if (order.makerToken == sellOrderPool[0].longToken.id) {
            position = 'long'
            symbol = sellOrderPool[0].longToken.symbol
          }
        }
        const decimals = sellOrderPool[0].collateralToken.decimals
        const takerAmount = formatUnits(order.takerAmount, decimals)
        const makerAmount = formatUnits(order.makerAmount)
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
        price = payReceive / quantity
      }
      if (buyOrderPool.length > 0) {
        type = 'Buy'
        poolId = buyOrderPool[0].id
        underlying = buyOrderPool[0].underlying
        if (order.takerToken == buyOrderPool[0].shortToken.id) {
          position = 'short'
          symbol = buyOrderPool[0].shortToken.symbol
        } else {
          if (order.takerToken == buyOrderPool[0].longToken.id) {
            position = 'long'
            symbol = buyOrderPool[0].longToken.symbol
          }
        }
        const decimals = buyOrderPool[0].collateralToken.decimals
        const takerAmount = formatUnits(order.takerAmount)
        const makerAmount = formatUnits(order.makerAmount, decimals)
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
      }
      const dataOrder = {
        id: type + records.indexOf(record as never),
        poolId: poolId,
        position: position,
        symbol: symbol,
        underlying: underlying,
        orderType: type,
        nbrOptions: quantity,
        price: price,
        payReceive: payReceive,
        expiry: getDateTime(order.expiry),
        expiryMins: getExpiryMinutesFromNow(order.expiry) + ' mins',
        orderHash: metaData.orderHash,
      }
      dataOrders.push(dataOrder)
    })
    return dataOrders
  }

  async function cancelOrder(order, chainId) {
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
        maxHeight: 'calc(100% - 6em)',
      }}
      spacing={6}
      paddingTop={2}
      paddingRight={6}
    >
      <>
        <SideMenu />
        <Stack height="100%" width="80%">
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
              placeholder="Filter asset"
              aria-label="Filter asset"
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
                              {order.orderType}
                            </Typography>
                            <Typography variant="caption" noWrap>
                              {order.expiry}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="subtitle1">
                              {order.nbrOptions}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="subtitle1">
                              {order.price.toFixed(2)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="subtitle1">
                              {order.payReceive.toFixed(2)}
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
                                onClick={() =>
                                  cancelOrder(dataOrders[index], chainId)
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
                    <TableCell colSpan={5} align="center">
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
