import { Box, Button, Stack, InputAdornment, Input } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { formatUnits } from 'ethers/lib/utils'
import React, { useState, useEffect } from 'react'
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
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { GrayText, GreenText, RedText } from '../Trade/Orders/UiStyles'
import { makeStyles } from '@mui/styles'
import { ExpiresInCell } from '../Markets/Markets'

export function MyOrders() {
  const chainId = useAppSelector(selectChainId)
  const makerAccount = useAppSelector(selectUserAddress)
  const [dataOrders, setDataOrders] = useState([])
  const [page, setPage] = useState(0)
  const pools = useAppSelector((state) => selectPools(state))
  const [search, setSearch] = useState('')
  const history = useHistory()
  const useStyles = makeStyles({
    root: {
      '&.MuiDataGrid-root .MuiDataGrid-cell:focus': {
        outline: 'none',
      },
    },
  })
  const classes = useStyles()
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
    const type = 'BUY'
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
      Id: poolId,
      icon: underlying,
      underlying: underlying,
      quantity: quantity,
      price: price,
      payReceive: payReceive,
      Expiry: getDateTime(order.expiry),
      orderHash: metaData.orderHash,
    }
  }
  function getSellOrderFields(record: any, pool: any) {
    const order = record.order
    const metaData = record.metaData
    const type = 'SELL'
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
      Id: poolId,
      icon: underlying,
      underlying: underlying,
      quantity: quantity,
      price: price,
      payReceive: payReceive,
      Expiry: getDateTime(order.expiry),
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

  async function cancelOrder(event, orderHash, chainId) {
    event.stopPropagation()
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

  const filteredRows =
    search != null && search.length > 0
      ? dataOrders.filter((v) =>
          v.underlying.toLowerCase().includes(search.toLowerCase())
        )
      : dataOrders
  const columns: GridColDef[] = [
    {
      field: 'symbol',
      align: 'left',
      renderHeader: (_header) => <GrayText>{'Asset Id'}</GrayText>,
      renderCell: (cell) => <GrayText>{cell.value}</GrayText>,
    },
    {
      field: 'icon',
      align: 'right',
      headerName: '',
      disableReorder: true,
      disableColumnMenu: true,
      renderCell: (cell) => <CoinIconPair assetName={cell.value} />,
    },
    {
      field: 'underlying',
      align: 'left',
      minWidth: 100,
      headerName: 'Underlying',
    },
    {
      field: 'type',
      align: 'center',
      headerAlign: 'center',
      headerName: 'Type',
      renderCell: (cell) =>
        cell.value === 'BUY' ? (
          <GreenText>{cell.value}</GreenText>
        ) : (
          <RedText>{cell.value}</RedText>
        ),
    },
    {
      field: 'quantity',
      align: 'right',
      headerAlign: 'right',
      headerName: 'Quantity',
      type: 'number',
      renderCell: (cell) => cell.value.toFixed(2),
    },
    {
      field: 'price',
      align: 'right',
      headerAlign: 'right',
      headerName: 'Price',
      type: 'number',
      minWidth: 100,
      renderCell: (cell) => cell.value.toFixed(4),
    },
    {
      field: 'payReceive',
      align: 'right',
      headerAlign: 'right',
      headerName: 'Pay/Receive',
      type: 'number',
      minWidth: 150,
      renderCell: (cell) => cell.value.toFixed(4),
    },
    {
      field: 'Expiry',
      minWidth: 170,
      align: 'right',
      headerAlign: 'right',
      headerName: 'Order Expires In',
      type: 'dateTime',
      renderCell: (props) => <ExpiresInCell {...props} />,
    },
    {
      field: 'orderHash',
      align: 'center',
      headerAlign: 'center',
      headerName: 'Cancel',
      minWidth: 170,
      renderCell: (cell) => (
        <Button
          variant="outlined"
          startIcon={<DeleteIcon />}
          size="small"
          onClick={(event) => cancelOrder(event, cell.value, chainId)}
        >
          Cancel
        </Button>
      ),
    },
  ]
  return (
    <Stack
      direction="row"
      sx={{
        height: '100%',
      }}
      spacing={6}
      paddingRight={6}
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
          <DataGrid
            className={classes.root}
            rows={filteredRows}
            pagination
            columns={columns}
            onPageChange={(page) => setPage(page)}
            page={page}
            onRowClick={(row) => {
              history.push(`../../${row.row.Id}/${row.row.position}`)
            }}
            componentsProps={{
              row: {
                style: {
                  cursor: 'pointer',
                },
              },
            }}
          />
        </Stack>
      </>
    </Stack>
  )
}
