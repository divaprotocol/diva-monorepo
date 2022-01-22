import { Box, Typography, useTheme } from '@mui/material'
import { useLayoutEffect, useRef, useState } from 'react'
import {
  XYPlot,
  XAxis,
  YAxis,
  LineSeries,
  LineSeriesPoint,
  DiscreteColorLegend,
} from 'react-vis'

export function PayoffProfile(props: {
  floor: number
  cap: number
  inflection: number
  hasError?: boolean
  collateralBalanceShort: number
  collateralBalanceLong: number
  longTokenAmount: number
  shortTokenAmount: number
}) {
  const {
    floor,
    cap,
    inflection: strike,
    longTokenAmount,
    shortTokenAmount,
    hasError,
    collateralBalanceShort,
    collateralBalanceLong,
  } = props
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

  useLayoutEffect(() => {
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

  const lineSeriesStyle: any = { strokeWidth: '3px' }

  if (hasError) lineSeriesStyle.stroke = theme.palette.error.main

  return (
    <Box pb={3} ref={ref}>
      <Box ref={ref} pr={1}>
        <XYPlot
          width={width}
          height={300}
          style={{
            fill: 'none',
            fontFamily: theme.typography.fontFamily,
            paddingRight: theme.spacing(4),
            fontSize: theme.typography.caption.fontSize,
            fontWeight: theme.typography.fontWeightLight,
            stroke: theme.palette.text.disabled,
            padding: theme.spacing(2),
          }}
          animation
        >
          <XAxis
            tickValues={[floor, strike, cap]}
            style={{ stroke: theme.palette.text.disabled }}
          />
          <YAxis style={{ stroke: theme.palette.text.disabled }} />
          <LineSeries style={lineSeriesStyle} data={short} />
          <LineSeries style={lineSeriesStyle} data={long} />
        </XYPlot>
      </Box>
      <Box
        sx={{
          '.rv-discrete-color-legend-item__title': {
            color: theme.palette.text.secondary,
          },
          display: 'flex',
          justifyContent: 'end',
          '.rv-discrete-color-legend-item': {
            paddingRight: 0,
            paddingLeft: theme.spacing(3),
          },
        }}
      >
        <DiscreteColorLegend
          orientation="horizontal"
          items={[
            {
              title: 'Long',
              color: theme.palette.primary.main,
            },
            {
              title: 'Short',
              color: theme.palette.secondary.main,
            },
          ]}
        />
      </Box>
    </Box>
  )
}
