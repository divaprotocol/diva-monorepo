import { GridColDef, GridRowModel } from '@mui/x-data-grid/x-data-grid'
import PoolsTable, { PayoffCell } from '../PoolsTable'
import { formatUnits } from 'ethers/lib/utils'
import { getDateTime } from '../../Util/Dates'
import { generatePayoffChartData } from '../../Graphs/DataGenerator'
import { useQuery } from 'react-query'
import { Pool, queryMarkets } from '../../lib/queries'
import { request } from 'graphql-request'
import { config, createdByFilterAddressForMarket } from '../../constants'
import { useWallet } from '@web3-ui/hooks'
import { BigNumber } from 'ethers'
import { GrayText } from '../Trade/Orders/UiStyles'
import React, { useEffect, useState } from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import styled from '@emotion/styled'
import { CoinIconPair } from '../CoinIcon'

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
  const [value, setValue] = useState(0)
  const [mainPools, setMainPools] = useState<Pool[]>([])
  const [otherPools, setOtherPools] = useState<Pool[]>([])
  const [pools, setPools] = useState<Pool[]>([])
  const [page, setPage] = useState(0)

  const { isLoading, data } = useQuery<{ pools: Pool[] }>(
    `pools-${chainId}`,
    async () => {
      let res: Pool[] = []
      if (chainId != null) {
        let lastId = '0'
        let lastRes: Pool[]
        while (lastRes == null || lastRes.length > 0) {
          const result = await request(
            config[chainId as number].divaSubgraph,
            queryMarkets(lastId)
          )

          if (result.pools.length > 0)
            lastId = result.pools[result.pools?.length - 1].id

          lastRes = result.pools
          res = res.concat(lastRes)
        }
      }
      return { pools: res }
    }
  )

  useEffect(() => {
    const updatePools = async () => {
      const poolsData = data?.pools || ([] as Pool[])

      const mainPoolsData = poolsData.filter(
        (p) => p.createdBy === createdByFilterAddressForMarket
      )
      const otherPoolsData = poolsData.filter(
        (p) => p.createdBy !== createdByFilterAddressForMarket
      )

      setMainPools(mainPoolsData)
      setOtherPools(otherPoolsData)
      setPools(mainPoolsData)
    }
    updatePools()
  }, [data?.pools])

  useEffect(() => {
    if (value === 0) setPools(mainPools)
    if (value === 1) setPools(otherPools)
  }, [value])

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
      Cap: formatUnits(val.cap),
      Expiry: getDateTime(val.expiryTime),
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
      <Container>
        <Tabs value={value} onChange={handleChange} variant="standard">
          <Tab label="Main" />
          <Tab label="Other" />
        </Tabs>
      </Container>
      <PoolsTable
        columns={columns}
        rows={filteredRows}
        page={page}
        rowCount={filteredRows.length}
        onPageChange={(page) => setPage(page)}
      />
    </>
  )
}

const Container = styled.div`
  position: absolute;
  left: 70px;
  top: 80px;
`
