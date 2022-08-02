import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import PoolsTable, { PayoffCell } from '../PoolsTable'
import { formatUnits, formatEther, parseUnits } from 'ethers/lib/utils'
import {
  getDateTime,
  getExpiryMinutesFromNow,
  userTimeZone,
} from '../../Util/Dates'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { BigNumber } from 'ethers'
import { GrayText } from '../Trade/Orders/UiStyles'
import { useEffect, useState } from 'react'
import { CoinIconPair } from '../CoinIcon'
import {
  fetchPools,
  selectPools,
  selectRequestStatus,
  selectUserAddress,
} from '../../Redux/appSlice'
import { useAppDispatch, useAppSelector } from '../../Redux/hooks'
import { Box, Tooltip } from '@mui/material'
import Typography from '@mui/material/Typography'
import { ShowChartOutlined } from '@mui/icons-material'
import { getAppStatus } from '../../Util/getAppStatus'
import { divaGovernanceAddress } from '../../constants'
import { useHistory, useLocation, useParams } from 'react-router-dom'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import DropDownFilter from '../PoolsTableFilter/DropDownFilter'
import ButtonFilter from '../PoolsTableFilter/ButtonFilter'

export const ExpiresInCell = (props: any) => {
  //replaces all occurances of "-" with "/", firefox doesn't support "-" in a date string
  const expTimestamp = new Date(props.row.Expiry.replace(/-/g, '/')).getTime()
  const minUntilExp = getExpiryMinutesFromNow(expTimestamp / 1000)
  if (minUntilExp > 0) {
    if ((minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) > 0) {
      // More than a day
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) +
              'd ' +
              ((minUntilExp % (60 * 24)) - (minUntilExp % 60)) / 60 +
              'h ' +
              (minUntilExp % 60) +
              'm '}
          </span>
        </Tooltip>
      )
    } else if (
      (minUntilExp - (minUntilExp % (60 * 24))) / (60 * 24) === 0 &&
      (minUntilExp - (minUntilExp % 60)) / 60 > 0
    ) {
      // Less than a day but more than an hour
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp - (minUntilExp % 60)) / 60 +
              'h ' +
              (minUntilExp % 60) +
              'm '}
          </span>
        </Tooltip>
      )
    } else if ((minUntilExp - (minUntilExp % 60)) / 60 === 0) {
      // Less than an hour
      return (
        <Tooltip
          placement="top-end"
          title={props.row.Expiry + ', ' + userTimeZone()}
        >
          <span className="table-cell-trucate">
            {(minUntilExp % 60) + 'm '}
          </span>
        </Tooltip>
      )
    }
  } else if (Object.is(0, minUntilExp)) {
    // Using Object.is() to differentiate between +0 and -0
    return (
      <Tooltip
        placement="top-end"
        title={props.row.Expiry + ', ' + userTimeZone()}
      >
        <span className="table-cell-trucate">{'<1m'}</span>
      </Tooltip>
    )
  } else {
    return (
      <Tooltip
        placement="top-end"
        title={props.row.Expiry + ', ' + userTimeZone()}
      >
        <span className="table-cell-trucate">{'-'}</span>
      </Tooltip>
    )
  }
}

const columns: GridColDef[] = [
  {
    field: 'Id',
    align: 'left',
    renderHeader: (header) => <GrayText>{'Asset Id'}</GrayText>,
    renderCell: (cell) => <GrayText>{cell.value}</GrayText>,
  },
  {
    field: 'Icon',
    align: 'right',
    disableReorder: true,
    disableColumnMenu: true,
    headerName: '',
    width: 70,
    renderCell: (cell) => <CoinIconPair assetName={cell.value} />,
  },
  {
    field: 'Underlying',
    minWidth: 150,
    flex: 1,
  },
  {
    field: 'PayoffProfile',
    headerName: 'Payoff Profile',
    disableReorder: true,
    disableColumnMenu: true,
    minWidth: 120,
    renderCell: (cell) => <PayoffCell data={cell.value} />,
  },
  { field: 'Floor', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Cap', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Inflection', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Gradient', align: 'right', headerAlign: 'right', type: 'number' },
  {
    field: 'Expiry',
    minWidth: 170,
    align: 'right',
    headerAlign: 'right',
    type: 'dateTime',
    headerName: 'Expires in',
    renderCell: (props) => <ExpiresInCell {...props} />,
  },
  {
    field: 'Sell',
    align: 'right',
    headerAlign: 'right',
    renderHeader: (header) => <GrayText>{'Sell'}</GrayText>,
    renderCell: (cell) => (
      <Typography color="dimgray" fontSize={'0.875rem'}>
        {cell.value}
      </Typography>
    ),
  },
  {
    field: 'Buy',
    align: 'right',
    headerAlign: 'right',
    renderHeader: (header) => <GrayText>{'Buy'}</GrayText>,
    renderCell: (cell) => (
      <Typography color="dimgray" fontSize={'0.875rem'}>
        {cell.value}
      </Typography>
    ),
  },
  {
    field: 'MaxYield',
    align: 'right',
    headerAlign: 'right',
    renderHeader: (header) => <GrayText>{'MaxYield'}</GrayText>,
    renderCell: (cell) => (
      <Typography color="dimgray" fontSize={'0.875rem'}>
        {cell.value}
      </Typography>
    ),
  },
  {
    field: 'Status',
    align: 'right',
    headerAlign: 'right',
  },
  {
    field: 'TVL',
    align: 'right',
    headerAlign: 'right',
    minWidth: 200,
  },
]

export default function Markets() {
  const history = useHistory()
  const currentAddress = history.location.pathname.split('/')
  const [page, setPage] = useState(0)
  const pools = useAppSelector(selectPools)
  const poolsRequestStatus = useAppSelector(selectRequestStatus('app/pools'))
  const dispatch = useAppDispatch()
  const params = useParams() as { creatorAddress: string; status: string }
  const [createdBy, setCreatedBy] = useState(params.creatorAddress)
  const [creatorButtonLabel, setCreatorButtonLabel] = useState(
    getShortenedAddress(currentAddress[2])
  )
  const [underlyingButtonLabel, setUnderlyingButtonLabel] =
    useState('Underlying')
  const [search, setSearch] = useState(null)
  const [expiredPoolClicked, setExpiredPoolClicked] = useState(false)

  const handleCreatorInput = (e) => {
    setCreatedBy(e.target.value)
    setCreatorButtonLabel(
      e.target.value === '' ? 'Creator' : getShortenedAddress(e.target.value)
    )
  }

  const handleUnderLyingInput = (e) => {
    setSearch(e.target.value)
    setUnderlyingButtonLabel(
      e.target.value === '' ? 'UnderLying' : e.target.value
    )
  }
  const handleExpiredPools = () => {
    if (expiredPoolClicked) {
      setExpiredPoolClicked(false)
    } else {
      setExpiredPoolClicked(true)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(fetchPools({ page, createdBy }))
    }, 300)

    return () => clearTimeout(timeout)
  }, [createdBy, dispatch, history, page])

  useEffect(() => {
    const timeout = setTimeout(() => {
      history.replace(`/markets/${createdBy || ''}`)
    }, 100)

    return () => clearTimeout(timeout)
  }, [createdBy, history])

  const rows: GridRowModel[] = pools.reduce((acc, val) => {
    const { status } = getAppStatus(
      val.expiryTime,
      val.statusTimestamp,
      val.statusFinalReferenceValue,
      val.finalReferenceValue,
      val.inflection
    )
    const shared = {
      Icon: val.referenceAsset,
      Underlying: val.referenceAsset,
      Floor: formatUnits(val.floor),
      Inflection: formatUnits(val.inflection),
      Cap: formatUnits(val.cap),
      Expiry: getDateTime(val.expiryTime),
      Sell: '-',
      Buy: '-',
      MaxYield: '-',
    }

    const payOff = {
      CollateralBalanceLong: Number(
        formatUnits(
          val.collateralBalanceLongInitial,
          val.collateralToken.decimals
        )
      ),
      CollateralBalanceShort: Number(
        formatUnits(
          val.collateralBalanceShortInitial,
          val.collateralToken.decimals
        )
      ),
      Floor: Number(formatEther(val.floor)),
      Inflection: Number(formatEther(val.inflection)),
      Cap: Number(formatEther(val.cap)),
      TokenSupply: Number(formatEther(val.supplyInitial)), // Needs adjustment to formatUnits() when switching to the DIVA Protocol 1.0.0 version
    }
    // console.log(
    //   BigNumber.from(val.collateralBalanceLongInitial)
    //     .mul(parseUnits('1', val.collateralToken.decimals))
    //     .div(
    //       BigNumber.from(val.collateralBalanceLongInitial).add(
    //         BigNumber.from(val.collateralBalanceShortInitial)
    //       )
    //     )
    // )
    return [
      ...acc,
      {
        ...shared,
        id: `${val.id}/long`,
        Id: 'L' + val.id,
        address: val.longToken,
        PayoffProfile: generatePayoffChartData({
          ...payOff,
          IsLong: true,
        }),
        Gradient: Number(
          formatUnits(
            BigNumber.from(val.collateralBalanceLongInitial)
              .mul(parseUnits('1', val.collateralToken.decimals))
              .div(
                BigNumber.from(val.collateralBalanceLongInitial).add(
                  BigNumber.from(val.collateralBalanceShortInitial)
                )
              ),
            val.collateralToken.decimals
          )
        ).toFixed(2),
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalance),
              val.collateralToken.decimals
            )
          ).toFixed(2) +
          ' ' +
          val.collateralToken.symbol,
        Status: status,
        finalValue:
          val.statusFinalReferenceValue === 'Open'
            ? '-'
            : formatUnits(val.finalReferenceValue),
      },
      {
        ...shared,
        id: `${val.id}/short`,
        Id: 'S' + val.id,
        address: val.shortToken,
        PayoffProfile: generatePayoffChartData({
          ...payOff,
          IsLong: false,
        }),
        Gradient: Number(
          formatUnits(
            BigNumber.from(val.collateralBalanceShortInitial)
              .mul(parseUnits('1', val.collateralToken.decimals))
              .div(
                BigNumber.from(val.collateralBalanceLongInitial).add(
                  BigNumber.from(val.collateralBalanceShortInitial)
                )
              ),
            val.collateralToken.decimals
          )
        ).toFixed(2),
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalance),
              val.collateralToken.decimals
            )
          ).toFixed(2) +
          ' ' +
          val.collateralToken.symbol,
        Status: status,
        finalValue:
          val.statusFinalReferenceValue === 'Open'
            ? '-'
            : formatUnits(val.finalReferenceValue),
      },
    ]
  }, [] as GridRowModel[])

  const filteredRows =
    search != null && search.length > 0
      ? expiredPoolClicked
        ? rows.filter((v) => {
            v.Status.includes('Open')
          })
        : rows.filter((v) =>
            v.Underlying.toLowerCase().includes(search.toLowerCase())
          )
      : rows

  return (
    <>
      <Box
        paddingX={6}
        sx={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <ShowChartOutlined
          style={{ fontSize: 34, padding: 20, paddingRight: 10 }}
        />
        <h2> Markets</h2>
      </Box>
      <Box
        paddingX={6}
        paddingY={2}
        sx={{
          display: 'flex',
          flexDirection: 'row',
        }}
      >
        <DropDownFilter
          id="Creator Filter"
          DropDownButtonLabel={
            history.location.pathname === `/markets/`
              ? 'Creator'
              : creatorButtonLabel
          }
          InputValue={createdBy}
          onInputChange={handleCreatorInput}
          MenuItemLabel="Diva Governance"
          onMenuItemClick={() => {
            setCreatedBy(divaGovernanceAddress)
            setCreatorButtonLabel(getShortenedAddress(divaGovernanceAddress))
          }}
        />
        <DropDownFilter
          id="Underlying Filter"
          DropDownButtonLabel={underlyingButtonLabel}
          InputValue={search}
          onInputChange={handleUnderLyingInput}
        />
        <ButtonFilter
          id="Hide expired pools"
          ButtonColor="#ffffff"
          ButtonLabel="Hide Expired Pools"
          onClick={handleExpiredPools}
        />
      </Box>
      <Box
        paddingX={6}
        sx={{
          height: 'calc(100% - 6em)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <PoolsTable
          columns={columns}
          rows={rows && filteredRows}
          rowCount={8000}
          page={page}
          loading={poolsRequestStatus === 'pending'}
          onPageChange={(page) => setPage(page)}
          isViewToggle={true}
        />
      </Box>
    </>
  )
}
