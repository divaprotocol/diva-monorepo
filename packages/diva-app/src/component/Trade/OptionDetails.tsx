import { useEffect, useState } from 'react'
import styled from 'styled-components'
import { getDateTime, userTimeZone } from '../../Util/Dates'
import { Box, Stack, Tooltip, Typography } from '@mui/material'
import { Pool } from '../../lib/queries'
import { formatUnits } from 'ethers/lib/utils'
import { useWhitelist } from '../../hooks/useWhitelist'
import CheckCircleSharpIcon from '@mui/icons-material/CheckCircleSharp'
import WarningAmberSharpIcon from '@mui/icons-material/WarningAmberSharp'
import { BigNumber } from 'ethers'
import { useAppSelector } from '../../Redux/hooks'

export default function OptionDetails({
  pool,
}: {
  pool: Pool
  isLong: boolean
}) {
  //Instead of calling redux to get selected option at each component level
  //we can call at root component of trade that is underlying and pass as porps
  //to each child component.
  const dataSource = useWhitelist()
  const [dataSourceName, setDataSourceName] = useState('')
  const [checkIcon, setCheckIcon] = useState(true)
  const [binary, setBinary] = useState(false)
  const [linear, setLinear] = useState(false)
  const intrinsicValue = useAppSelector((state) => state.stats.intrinsicValue)
  const maxYield = useAppSelector((state) => state.stats.maxYield)
  const [isMaxYield, setMaxYield] = useState(false)
  useEffect(() => {
    if (pool.cap === pool.floor) {
      setBinary(true)
      setLinear(false)
    } else if (
      BigNumber.from(pool.inflection).eq(
        BigNumber.from(pool.floor)
          .add(BigNumber.from(pool.cap))
          .div(BigNumber.from('2'))
      )
    ) {
      setBinary(false)
      setLinear(true)
    }
  }, [pool])

  useEffect(() => {
    const dataName = dataSource?.dataProviders?.find(
      (dataName: { id: string }) => dataName?.id == pool?.dataProvider
    )
    if (dataName?.name != null) {
      setDataSourceName(dataName?.name)
      setCheckIcon(true)
    } else {
      setDataSourceName('Unknown')
      setCheckIcon(false)
    }
  }, [dataSource.dataProviders, pool.dataProvider])

  useEffect(() => {
    if (maxYield != 'n/a') {
      setMaxYield(true)
    } else {
      setMaxYield(false)
    }
  }, [maxYield])

  return (
    <Stack direction="row" mt="15px" spacing={3}>
      <Stack direction="column">
        <Typography variant="h4" fontWeight="normal" color="gray" pl="15px">
          Created at
        </Typography>
        <Tooltip
          title={
            getDateTime(pool.createdAt).slice(11, 19) + ' ' + userTimeZone()
          }
          arrow
        >
          <Typography fontSize="20px" pl="15px" color="white">
            {getDateTime(pool.createdAt).slice(0, 10)}
          </Typography>
        </Tooltip>
      </Stack>
      <Stack direction="column">
        <Typography variant="h4" fontWeight="normal" color="gray" pl="15px">
          Expires at
        </Typography>
        <Tooltip
          title={
            getDateTime(pool.expiryTime).slice(11, 19) + ' ' + userTimeZone()
          }
          arrow
        >
          <Typography fontSize="20px" pl="15px" color="white">
            {getDateTime(pool.expiryTime).slice(0, 10)}
          </Typography>
        </Tooltip>
      </Stack>
      {binary ? (
        <Stack direction="column">
          <Typography variant="h4" fontWeight="normal" color="gray" pl="15px">
            Payoff Type
          </Typography>
          <Typography fontSize="20px" pl="15px" color="white">
            Binary
          </Typography>
        </Stack>
      ) : linear ? (
        <Stack direction="column">
          <Typography variant="h4" fontWeight="normal" color="gray" pl="15px">
            Payoff Type
          </Typography>
          <Typography fontSize="20px" pl="15px" color="white">
            Linear
          </Typography>
        </Stack>
      ) : (
        <Stack direction="column">
          <Typography variant="h4" fontWeight="normal" color="gray" pl="15px">
            Payoff Type
          </Typography>
          <Typography fontSize="20px" pl="15px" color="white">
            Custom
          </Typography>
        </Stack>
      )}
      <Stack direction="column">
        <Typography variant="h4" fontWeight="normal" color="gray" pl="15px">
          Data Provider
        </Typography>
        <Stack direction="row" alignItems="center">
          <Tooltip title={pool.dataProvider} arrow>
            <Typography fontSize="20px" pl="15px" color="white">
              {dataSourceName}
            </Typography>
          </Tooltip>
          {checkIcon ? (
            <Tooltip
              title="Trusted data provider from the DIVA whitelist."
              arrow
            >
              <CheckCircleSharpIcon
                sx={{
                  paddingLeft: 1,
                }}
                color="success"
                fontSize="inherit"
              />
            </Tooltip>
          ) : (
            <Tooltip
              title="Data provider is NOT part of DIVA's whitelist."
              arrow
            >
              <WarningAmberSharpIcon
                sx={{
                  paddingLeft: 1,
                }}
                color="warning"
                fontSize="inherit"
              />
            </Tooltip>
          )}
        </Stack>
      </Stack>
      <Stack direction="column">
        <Typography variant="h4" fontWeight="normal" color="gray" pl="15px">
          Collateral
        </Typography>
        <Stack direction="row" alignItems="center">
          <Tooltip title={pool.collateralToken.id} arrow placement="bottom">
            <Typography fontSize="20px" pl="15px" color="white">
              {Number(
                formatUnits(
                  pool.collateralBalance,
                  pool.collateralToken.decimals
                )
              ).toFixed(2) + ' '}
            </Typography>
          </Tooltip>
          <Typography fontSize="20px" color="gray" pl="10px">
            {pool.collateralToken.symbol}
          </Typography>
        </Stack>
      </Stack>
      <Stack direction="column">
        <Typography variant="h4" fontWeight="normal" color="gray" pl="15px">
          Intrinsic Value
        </Typography>
        <Stack direction="row" alignItems="center">
          <Typography fontSize="20px" pl="15px" color="white">
            {intrinsicValue != 'n/a'
              ? parseFloat(intrinsicValue).toFixed(2) + ' '
              : 'n/a'}
          </Typography>
          <Typography fontSize="20px" color="gray" pl="10px">
            {intrinsicValue != 'n/a' ? pool.collateralToken.symbol : ''}
          </Typography>
        </Stack>
      </Stack>
      <Stack direction="column">
        <Typography variant="h4" fontWeight="normal" color="gray" pl="15px">
          Max yield
        </Typography>
        {isMaxYield ? (
          <Typography fontSize="20px" color="primary" pl="15px">
            {maxYield}
          </Typography>
        ) : (
          <Typography fontSize="20px" pl="15px" color="white">
            n/a
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}
