import {
  Box,
  Button,
  Stack,
  InputAdornment,
  Input,
  Divider,
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import DeleteIcon from '@mui/icons-material/Delete'
import { formatUnits } from 'ethers/lib/utils'
import React, { useState, useEffect, useMemo } from 'react'
import { getOrderDetails, getUserOrders } from '../../DataService/OpenOrders'
import { cancelLimitOrder } from '../../Orders/CancelLimitOrder'
import {
  fetchPositionTokens,
  selectChainId,
  selectPools,
  selectRequestStatus,
  selectUserAddress,
} from '../../Redux/appSlice'
import { useAppDispatch, useAppSelector } from '../../Redux/hooks'
import { getDateTime, getExpiryMinutesFromNow } from '../../Util/Dates'
import { Search } from '@mui/icons-material'
import { CoinIconPair } from '../CoinIcon'
import { useHistory } from 'react-router-dom'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { GrayText, GreenText, RedText } from '../Trade/Orders/UiStyles'
import { makeStyles } from '@mui/styles'
import { ExpiresInCell } from '../Markets/Markets'
import DropDownFilter from '../PoolsTableFilter/DropDownFilter'
import ToggleFilter from '../PoolsTableFilter/ToggleFilter'
import ButtonFilter from '../PoolsTableFilter/ButtonFilter'

export function MyOrders() {
  const chainId = useAppSelector(selectChainId)
  const makerAccount = useAppSelector(selectUserAddress)
  const [dataOrders, setDataOrders] = useState([])
  const [page, setPage] = useState(0)
  const [loadingValue, setLoadingValue] = useState(false)
  const pools = useAppSelector((state) => selectPools(state))
  const poolsRequestStatus = useAppSelector(selectRequestStatus('app/pools'))
  const [underlyingButtonLabel, setUnderlyingButtonLabel] =
    useState('Underlying')
  const [search, setSearch] = useState('')
  const [buyClicked, setBuyClicked] = useState(false)
  const [sellClicked, setSellClicked] = useState(false)
  const history = useHistory()
  const dispatch = useAppDispatch()
  const useStyles = makeStyles({
    root: {
      '&.MuiDataGrid-root .MuiDataGrid-cell:focus': {
        outline: 'none',
      },
    },
  })
  const handleUnderLyingInput = (e) => {
    setSearch(e.target.value)
    setUnderlyingButtonLabel(
      e.target.value === '' ? 'Underlying' : e.target.value
    )
  }
  const filterBuyOrders = () => {
    if (buyClicked) {
      setBuyClicked(false)
    } else {
      setBuyClicked(true)
    }
  }
  const filterSellOrders = () => {
    if (sellClicked) {
      setSellClicked(false)
    } else {
      setSellClicked(true)
    }
  }
  useEffect(() => {
    dispatch(fetchPositionTokens({ page }))
  }, [dispatch, page])
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
    setLoadingValue(true)
    //get the order details in current form from 0x before cancelling it.
    const cancelOrder = await getOrderDetails(orderHash, chainId)
    cancelLimitOrder(cancelOrder, chainId).then(function (
      cancelOrderResponse: any
    ) {
      const log = cancelOrderResponse?.logs?.[0]
      if (log != null && log.event == 'OrderCancelled') {
        alert('Order successfully canceled')
        /* setLoadingValue(false) */
        //update myOrders table
        componentDidMount()
      } else {
        /* setLoadingValue(false) */
        alert('order could not be canceled')
      }
      setLoadingValue(false)
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
      renderCell: (cell) => cell.value.toFixed(4),
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
        <LoadingButton
          variant="outlined"
          startIcon={<DeleteIcon />}
          size="small"
          loading={loadingValue}
          onClick={(event) => cancelOrder(event, cell.value, chainId)}
        >
          Cancel
        </LoadingButton>
      ),
    },
  ]

  const filteredRows = useMemo(() => {
    if (search != null && search.length > 0) {
      if (buyClicked && sellClicked) {
        return dataOrders
      } else if (buyClicked) {
        return dataOrders
          .filter((v) => v.type.includes('BUY'))
          .filter((v) =>
            v.underlying.toLowerCase().includes(search.toLowerCase())
          )
      } else if (sellClicked) {
        return dataOrders
          .filter((v) => v.type.includes('SELL'))
          .filter((v) =>
            v.underlying.toLowerCase().includes(search.toLowerCase())
          )
      } else {
        return dataOrders.filter((v) =>
          v.underlying.toLowerCase().includes(search.toLowerCase())
        )
      }
    } else {
      if (buyClicked && sellClicked) {
        return dataOrders
      } else if (buyClicked) {
        return dataOrders.filter((v) => v.type.includes('BUY'))
      } else if (sellClicked) {
        return dataOrders.filter((v) => v.type.includes('SELL'))
      } else {
        return dataOrders
      }
    }
  }, [search, buyClicked, sellClicked, dataOrders])

  return (
    <Stack
      direction="column"
      sx={{
        height: '100%',
      }}
      spacing={4}
    >
      <Box
        paddingY={2}
        sx={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <DropDownFilter
          id="Underlying Filter"
          DropDownButtonLabel={underlyingButtonLabel}
          InputValue={search}
          onInputChange={handleUnderLyingInput}
        />
        <ButtonFilter
          id="Buy"
          sx={{
            borderRight: 0,
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
          ButtonLabel="Buy"
          onClick={filterBuyOrders}
        />
        <Divider orientation="vertical" />
        <ButtonFilter
          id="Sell"
          sx={{
            borderLeft: 0,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          }}
          ButtonLabel="Sell"
          onClick={filterSellOrders}
        />
      </Box>
      <DataGrid
        className={classes.root}
        rows={filteredRows}
        pagination
        columns={columns}
        loading={poolsRequestStatus !== 'fulfilled'}
        onPageChange={(page) => setPage(page)}
        selectedPoolsView="Table"
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
  )
}
