import { Box, useTheme } from '@mui/material'
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
  tokenSupply: number
}) {
  const {
    floor,
    cap,
    inflection: strike,
    hasError,
    collateralBalanceShort,
    collateralBalanceLong,
  } = props
  console.log('props', props)
  const padding = cap * 0.1
  const start = Math.max(floor - padding, 0)
  const end = Number(cap) + padding
  const gradient =
    collateralBalanceLong / (collateralBalanceLong + collateralBalanceShort)

  const maxPayoutLong = 1
  const maxPayoutShort = 1
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
      y: 1 - gradient,
    },
    {
      x: cap,
      y: 0,
    },
    {
      x: end,
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
      y: gradient,
    },
    {
      x: cap,
      y: maxPayoutLong,
    },
    {
      x: end,
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
              color: theme.palette.primary.light,
            },
            {
              title: 'Short',
              color: theme.palette.primary.dark,
            },
          ]}
        />
      </Box>
    </Box>
  )
}
