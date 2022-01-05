import { Box } from '@mui/material'
import { XYPlot, XAxis, YAxis, LineSeries, LineSeriesPoint } from 'react-vis'

export function PayoffProfile({
  floor,
  cap,
  strike,
}: {
  floor: number
  cap: number
  strike: number
  longTokenAmount: number
  shortTokenAmount: number
}) {
  const padding = cap * 0.1
  const fullLength = cap - floor
  const strikeLength = strike - floor
  const inflectionPoint = strikeLength / fullLength
  const start = Math.max(floor - padding, 0)

  const short: LineSeriesPoint[] = [
    {
      x: start,
      y: 1,
    },
    {
      x: floor,
      y: 1,
    },
    {
      x: strike,
      y: inflectionPoint,
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
      y: inflectionPoint,
    },
    {
      x: cap,
      y: 1,
    },
    {
      x: cap + padding,
      y: 1,
    },
  ]

  return (
    <Box pb={3}>
      <h3>Payoff Profile</h3>
      <XYPlot
        width={396}
        height={300}
        fill={'none'}
        style={{ fontSize: 12 }}
        animation
      >
        <XAxis tickValues={[floor, strike, cap]} />
        <YAxis />
        <LineSeries style={{ fill: 'none' }} data={short} />
        <LineSeries style={{ fill: 'none' }} data={long} />
      </XYPlot>
    </Box>
  )
}
