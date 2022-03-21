import { GridColDef, GridRowModel } from '@mui/x-data-grid/x-data-grid'
import PoolsTable, { CoinImage, PayoffCell } from '../PoolsTable'
import { formatUnits } from 'ethers/lib/utils'
import { getDateTime } from '../../Util/Dates'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { useQuery } from 'react-query'
import { Pool, queryPools } from '../../lib/queries'
import { request } from 'graphql-request'
import { config } from '../../constants'
import { useWallet } from '@web3-ui/hooks'
import { BigNumber } from 'ethers'
import { GrayText } from '../Trade/Orders/UiStyles'
import React from 'react'

const columns: GridColDef[] = [
  {
    field: 'Id',
    align: 'left',
    renderHeader: (header) => <GrayText>{header.field}</GrayText>,
    renderCell: (cell) => <GrayText>{cell.value}</GrayText>,
  },
  {
    field: 'Icon',
    align: 'right',
    disableReorder: true,
    disableColumnMenu: true,
    headerName: '',
    renderCell: (cell) => <CoinImage assetName={cell.value} />,
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
  { field: 'Ceiling', align: 'right', headerAlign: 'right', type: 'number' },
  {
    field: 'Expiry',
    minWidth: 170,
    align: 'right',
    headerAlign: 'right',
    type: 'dateTime',
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
  const wallet = useWallet()
  const chainId = wallet?.provider?.network?.chainId || 3
  const query = useQuery<{ pools: Pool[] }>(
    `pools-${chainId}`,
    () =>
      chainId != null &&
      request(config[chainId as number].divaSubgraph, queryPools)
  )
  const pools = query.data?.pools || ([] as Pool[])
  const rows: GridRowModel[] = pools.reduce((acc, val) => {
    const expiryDate = new Date(parseInt(val.expiryDate) * 1000)
    const fallbackPeriod = expiryDate.setMinutes(
      expiryDate.getMinutes() + 24 * 60 + 5
    )
    const unchallengedPeriod = expiryDate.setMinutes(
      expiryDate.getMinutes() + 5 * 24 * 60 + 5
    )
    const challengedPeriod = expiryDate.setMinutes(
      expiryDate.getMinutes() + 2 * 24 * 60 + 5
    )
    let status = val.statusFinalReferenceValue
    if (Date.now() > fallbackPeriod) {
      status = 'Fallback'
    }
    if (
      val.statusFinalReferenceValue === 'Open' &&
      Date.now() > unchallengedPeriod
    ) {
      status = 'Confirmed*'
    } else if (
      val.statusFinalReferenceValue === 'Challenged' &&
      Date.now() > challengedPeriod
    ) {
      status = 'Confirmed*'
    } else {
      status = val.statusFinalReferenceValue
    }
    const shared = {
      Icon: val.referenceAsset,
      Underlying: val.referenceAsset,
      Floor: formatUnits(val.floor),
      Inflection: formatUnits(val.inflection),
      Ceiling: formatUnits(val.cap),
      Expiry: getDateTime(val.expiryDate),
      Sell: 'TBD',
      Buy: 'TBD',
      MaxYield: 'TBD',
    }

    const payOff = {
      Floor: parseInt(val.floor) / 1e18,
      Inflection: parseInt(val.inflection) / 1e18,
      Cap: parseInt(val.cap) / 1e18,
    }

    return [
      ...acc,
      {
        ...shared,
        id: `${val.id}/long`,
        Id: 'L-' + val.id,
        address: val.longToken,
        PayoffProfile: generatePayoffChartData({
          ...payOff,
          IsLong: true,
        }),
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalanceLong).add(
                val.collateralBalanceShort
              ),
              val.collateralDecimals
            )
          ).toFixed(4) +
          ' ' +
          val.collateralSymbol,
        Status: status,
        finalValue:
          val.statusFinalReferenceValue === 'Open'
            ? '-'
            : formatUnits(val.finalReferenceValue),
      },
      {
        ...shared,
        id: `${val.id}/short`,
        Id: 'S-' + val.id,
        address: val.shortToken,
        PayoffProfile: generatePayoffChartData({
          ...payOff,
          IsLong: false,
        }),
        TVL:
          parseFloat(
            formatUnits(
              BigNumber.from(val.collateralBalanceLong).add(
                val.collateralBalanceShort
              ),
              val.collateralDecimals
            )
          ).toFixed(4) +
          ' ' +
          val.collateralSymbol,
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
  return <PoolsTable columns={columns} rows={filteredRows} />
}
