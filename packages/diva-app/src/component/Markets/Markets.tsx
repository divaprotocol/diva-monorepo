import { GridColDef, GridRowModel } from '@mui/x-data-grid'
import PoolsTable, { PayoffCell } from '../PoolsTable'
import { formatUnits, formatEther } from 'ethers/lib/utils'
import { getDateTime, getExpiryMinutesFromNow } from '../../Util/Dates'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { BigNumber } from 'ethers'
import { GrayText } from '../Trade/Orders/UiStyles'
import React, { useState } from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import styled from '@emotion/styled'
import { CoinIconPair } from '../CoinIcon'
import { selectMainPools, selectOtherPools } from '../../Redux/appSlice'
import { useAppSelector } from '../../Redux/hooks'
import { Box, Tooltip } from '@mui/material'
import { ShowChartOutlined } from '@mui/icons-material'

export const ExpiresInCell = (props: any) => {
  const expTimestamp = new Date(props.row.Expiry).getTime()
  const expDate = new Date(props.row.Expiry).toLocaleDateString()
  const minUntilExp = getExpiryMinutesFromNow(expTimestamp / 1000)
  if (minUntilExp > 0) {
    return minUntilExp === 1 ? (
      <Tooltip placement="top-end" title={props.row.Expiry}>
        <span className="table-cell-trucate">{'<1m'}</span>
      </Tooltip>
    ) : (
      <Tooltip placement="top-end" title={expDate}>
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
  } else {
    return (
      <Tooltip placement="top-end" title={expDate}>
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
  { field: 'Inflection', align: 'right', headerAlign: 'right', type: 'number' },
  { field: 'Cap', align: 'right', headerAlign: 'right', type: 'number' },
  {
    field: 'Expiry',
    minWidth: 170,
    align: 'right',
    headerAlign: 'right',
    type: 'dateTime',
    headerName: 'Expires in',
    renderCell: (props) => <ExpiresInCell {...props} />,
  },
  { field: 'Sell', align: 'right', headerAlign: 'right' },
  { field: 'Buy', align: 'right', headerAlign: 'right' },
  { field: 'MaxYield', align: 'right', headerAlign: 'right' },
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
  const [value, setValue] = useState(0)
  const [page, setPage] = useState(0)
  const mainPools = useAppSelector(selectMainPools)
  const otherPools = useAppSelector(selectOtherPools)

  const pools = value === 0 ? mainPools : otherPools

  const handleChange = (event: any, newValue: any) => {
    setValue(newValue)
  }
  const rows: GridRowModel[] = pools.reduce((acc, val) => {
    const expiryTime = new Date(parseInt(val.expiryTime) * 1000)
    const fallbackPeriod = expiryTime.setMinutes(
      expiryTime.getMinutes() + 24 * 60 + 5
    )
    const unchallengedPeriod = expiryTime.setMinutes(
      expiryTime.getMinutes() + 5 * 24 * 60 + 5
    )
    const challengedPeriod = expiryTime.setMinutes(
      expiryTime.getMinutes() + 2 * 24 * 60 + 5
    )
    let status = val.statusFinalReferenceValue

    if (val.statusFinalReferenceValue === 'Open') {
      if (Date.now() > fallbackPeriod && Date.now() < unchallengedPeriod) {
        status = 'Fallback'
      } else if (Date.now() > unchallengedPeriod) {
        status = 'Confirmed*'
      } else {
        status = val.statusFinalReferenceValue
      }
    } else if (
      val.statusFinalReferenceValue === 'Challenged' &&
      Date.now() > challengedPeriod
    ) {
      status = 'Confirmed*'
    }
    const shared = {
      Icon: val.referenceAsset,
      Underlying: val.referenceAsset,
      Floor: formatUnits(val.floor),
      Inflection: formatUnits(val.inflection),
      Cap: formatUnits(val.cap),
      Expiry: getDateTime(val.expiryTime),
      Sell: 'TBD',
      Buy: 'TBD',
      MaxYield: 'TBD',
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
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalance),
              val.collateralToken.decimals
            )
          ).toFixed(4) +
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
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalance),
              val.collateralToken.decimals
            )
          ).toFixed(4) +
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
  const filteredRows = rows.filter(
    (v) => v.Status && !v.Status.startsWith('Confirmed')
  )
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
        sx={{
          height: 'calc(100% - 6em)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Tabs value={value} onChange={handleChange} variant="standard">
          <Tab label="Main" />
          <Tab label="Other" />
        </Tabs>
        <PoolsTable
          columns={columns}
          rows={filteredRows}
          page={page}
          rowCount={filteredRows.length}
          onPageChange={(page) => setPage(page)}
        />
      </Box>
    </>
  )
}
