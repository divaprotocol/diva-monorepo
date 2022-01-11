import { Box } from '@mui/material'
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
  const biggestTokenAmount = Math.max(longTokenAmount, shortTokenAmount)
  const largestCollateral = Math.max(
    collateralBalanceLong,
    collateralBalanceShort
  )

  const collateralBalanceFractionShort =
    collateralBalanceShort / largestCollateral
  const collateralBalanceFractionLong =
    collateralBalanceLong / largestCollateral

  const short: LineSeriesPoint[] = [
    {
      x: start,
      y:
        (biggestTokenAmount / shortTokenAmount) *
        (collateralBalanceFractionLong + collateralBalanceFractionShort),
    },
    {
      x: floor,
      y:
        (biggestTokenAmount / shortTokenAmount) *
        (collateralBalanceFractionLong + collateralBalanceFractionShort),
    },
    {
      x: strike,
      y:
        (biggestTokenAmount / shortTokenAmount) *
        collateralBalanceFractionShort,
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
      y: (biggestTokenAmount / longTokenAmount) * collateralBalanceFractionLong,
    },
    {
      x: cap,
      y:
        (biggestTokenAmount / longTokenAmount) *
        (collateralBalanceFractionLong + collateralBalanceFractionShort),
    },
    {
      x: cap + padding,
      y:
        (biggestTokenAmount / longTokenAmount) *
        (collateralBalanceFractionLong + collateralBalanceFractionShort),
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
        style={{ fontSize: 12 }}
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
