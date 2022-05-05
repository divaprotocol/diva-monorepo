import { TabContext, TabList, TabPanel } from '@mui/lab'
import { Box, Tab, Tabs, useTheme } from '@mui/material'
import { GridColDef, DataGrid } from '@mui/x-data-grid'
import { formatDistance } from 'date-fns'
import { formatUnits } from 'ethers/lib/utils'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Order, Pool } from '../../lib/queries'
import {
  fetchOrders,
  selectOrdersByTokens,
  selectOrderView,
  selectPool,
  selectTokenInfo,
  setIsBuy,
} from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { getShortenedAddress } from '../../Util/getShortenedAddress'

const RenderPriceCell = ({ order }: { order: Order }) => {
  const params: { poolId: string; tokenType: string } = useParams()
  const pool = useAppSelector((state) => selectPool(state, params.poolId))
  const theme = useTheme()
  const orderKey = `${params.poolId}/${params.tokenType}`
  const { isBuy } = useAppSelector(selectOrderView(orderKey))
  const price = (
    parseFloat(order.makerAmount) / parseFloat(order.takerAmount)
  ).toFixed(2)

  const symbol = pool?.collateralToken.name

  return (
    <Box
      sx={{
        display: 'flex',
        verticalAlign: 'middle',
        justifyContent: 'center',
      }}
    >
      <b>{price}</b>
      <span
        style={{
          verticalAlign: 'middle',
          fontSize: '0.95em',
          marginTop: theme.spacing(0.1),
          maxWidth: '150px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginLeft: theme.spacing(0.3),
          color: theme.palette.grey[400],
        }}
      >
        {symbol}
      </span>
    </Box>
  )
}

const RenderQuantityCell = (props) => {
  const params: { poolId: string; tokenType: string } = useParams()
  const orderKey = `${params.poolId}/${params.tokenType}`
  const { isBuy } = useAppSelector(selectOrderView(orderKey))

  const token = isBuy ? props.row.makerToken : props.row.takerToken
  const tokenAmount = isBuy ? props.row.makerAmount : props.row.takerAmount

  const tokenInfo = useAppSelector(selectTokenInfo(token))
  return <>{formatUnits(tokenAmount, tokenInfo.decimals)}</>
}

const dataGridColumns: GridColDef<Order>[] = [
  {
    field: 'Quantity',
    align: 'left',
    renderCell: (params) => <RenderQuantityCell {...params} />,
  },
  {
    field: 'price',
    align: 'left',
    flex: 1,
    renderCell: (params) => <RenderPriceCell order={params.row} />,
  },
  {
    field: 'Expires In',
    align: 'left',
    flex: 1,
    renderCell: (params) => {
      const date = new Date(Number(params.row.expiry + '000'))
      return formatDistance(date, new Date(), { addSuffix: true })
    },
  },
  {
    field: 'User',
    align: 'left',
    renderCell: (params) => getShortenedAddress(params.row.maker),
    flex: 1,
  },
  {
    field: ' ',
    align: 'right',
    renderCell: () => {
      return 'Buy or sell'
    },
  },
]

const Orders = ({
  takerToken,
  pool,
  makerToken,
}: {
  pool: Pool
  takerToken: string
  makerToken: string
}) => {
  const orders = useAppSelector(selectOrdersByTokens(makerToken, takerToken))
  const dispatch = useDispatch()

  useEffect(() => {
    if (pool != null) {
      dispatch(
        fetchOrders({
          takerToken,
          makerToken,
        })
      )
    }
  }, [dispatch, makerToken, pool, takerToken])

  return (
    <DataGrid
      columns={dataGridColumns}
      pagination
      rows={orders}
      sx={{
        height: '100%',
        width: '100%',
      }}
    />
  )
}

export function OrderView() {
  const params: { poolId: string; tokenType: string } = useParams()
  const pool = useAppSelector((state) => selectPool(state, params.poolId))
  const isLong = params.tokenType === 'long'
  const url = `${params.poolId}/${params.tokenType}`
  const poolToken = isLong ? pool.longToken.id : pool.shortToken.id
  const collateralToken = pool?.collateralToken.id
  const dispatch = useDispatch()

  const orderView = useAppSelector(selectOrderView(url))

  const value = orderView?.isBuy ? 'buy' : 'sell'

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    dispatch(
      setIsBuy({ value: newValue === 'buy' ? true : false, orderViewKey: url })
    )
  }

  return (
    <Box sx={{ width: '100%', typography: 'body1', maxHeight: '100%' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab label="Buy" value="buy" />
            <Tab label="Sell" value="sell" />
          </TabList>
        </Box>
        <TabPanel
          value="buy"
          sx={{ paddingX: 0, height: '100%', minHeight: '300px' }}
        >
          <Orders
            pool={pool}
            makerToken={poolToken}
            takerToken={collateralToken}
          />
        </TabPanel>
        <TabPanel
          value="sell"
          sx={{ paddingX: 0, height: '100%', minHeight: '300px' }}
        >
          {' '}
          <Orders
            pool={pool}
            makerToken={collateralToken}
            takerToken={poolToken}
          />
        </TabPanel>
      </TabContext>
    </Box>
  )
}
