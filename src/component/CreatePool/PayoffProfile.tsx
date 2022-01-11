import { Box, useTheme } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { XYPlot, XAxis, YAxis, LineSeries, LineSeriesPoint } from 'react-vis'

export function PayoffProfile({
  floor,
  cap,
  inflection: strike,
  longTokenAmount,
  shortTokenAmount,
  collateralBalanceShort,
  collateralBalanceLong,
}: {
  floor: number
  cap: number
  inflection: number
  collateralBalanceShort: number
  collateralBalanceLong: number
  longTokenAmount: number
  shortTokenAmount: number
}) {
  const padding = cap * 0.1
  const start = Math.max(floor - padding, 0)
  const totalCollateral = collateralBalanceLong + collateralBalanceShort

  const maxPayoutLong = totalCollateral / longTokenAmount
  const maxPayoutShort = totalCollateral / shortTokenAmount
  const theme = useTheme()

  const short: LineSeriesPoint[] = [
    {
      x: start,
      y: maxPayoutShort,
    },
    {
      x: floor,
      y: maxPayoutShort,
    },
    {
      x: strike,
      y: collateralBalanceShort / shortTokenAmount,
    },
    {
      x: cap,
      y: 0,
    },
    {
      x: cap + padding,
      y: 0,
    },
  ]

  const long: LineSeriesPoint[] = [
    {
      x: start,
      y: 0,
    },
    {
      x: floor,
      y: 0,
    },
    {
      x: strike,
      y: collateralBalanceLong / longTokenAmount,
    },
    {
      x: cap,
      y: maxPayoutLong,
    },
    {
      x: cap + padding,
      y: maxPayoutLong,
    },
  ]
  const ref = useRef<HTMLElement>()
  const [width, setWidth] = useState(300)

  useEffect(() => {
    if (ref.current != null) {
      const callback = () => {
        const rect = ref.current?.getBoundingClientRect()
        setWidth(rect?.width || 0)
      }
      window.addEventListener('resize', callback)
      callback()
      return () => {
        window.removeEventListener('resize', callback)
      }
    }
  }, [ref.current])

  return (
    <Box pb={3} ref={ref}>
      <XYPlot
        width={width}
        height={300}
        fill={'none'}
        style={{ fontSize: 12, padding: theme.spacing(2) }}
        animation
      >
        <XAxis tickValues={[floor, strike, cap]} />
        <YAxis />
        <LineSeries style={{ fill: 'none', strokeWidth: '3px' }} data={short} />
        <LineSeries style={{ fill: 'none', strokeWidth: '3px' }} data={long} />
      </XYPlot>
    </Box>
  )
}
