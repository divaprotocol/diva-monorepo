import { Box, useTheme } from '@mui/material'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  XYPlot,
  ChartLabel,
  XAxis,
  YAxis,
  LineSeries,
  LineSeriesPoint,
  DiscreteColorLegend,
  HorizontalGridLines,
} from 'react-vis'

export function PayoffProfile(props: {
  floor: number
  cap: number
  inflection: number
  hasError?: boolean
  collateralBalanceShort: number
  collateralBalanceLong: number
  tokenSupply: number
  collateralToken: string
}) {
  const {
    floor,
    cap,
    inflection: strike,
    tokenSupply,
    hasError,
    collateralBalanceShort,
    collateralBalanceLong,
    collateralToken,
  } = props
  const padding = cap * 0.1
  const start = Math.max(floor - padding, 0)
  const totalCollateral = collateralBalanceLong + collateralBalanceShort

  const maxPayoutLong = totalCollateral / tokenSupply
  const maxPayoutShort = totalCollateral / tokenSupply
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
      y: collateralBalanceShort / tokenSupply,
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
      y: collateralBalanceLong / tokenSupply,
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
  const [axisLabel, setAxisLabel] = useState('')

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

  useEffect(() => {
    setAxisLabel(collateralToken)
  }, [props.collateralToken])

  const lineSeriesStyle: any = { strokeWidth: '3px' }

  if (hasError) lineSeriesStyle.stroke = theme.palette.error.main

  return (
    <Box pb={3} ref={ref}>
      <Box
        ref={ref}
        pr={1}
        sx={{
          '.rv-xy-plot__axis__title': {
            fill: '#3393E0',
            fontSize: '14px',
          },
        }}
      >
        <XYPlot
          width={width}
          height={300}
          style={{
            fill: 'none',
            paddingRight: theme.spacing(4),
            stroke: theme.palette.text.disabled,
            padding: theme.spacing(2),
            overflow: 'visible',
          }}
          animation
        >
          <YAxis
            hideLine
            tickSize={0}
            tickTotal={6}
            style={{
              text: {
                stroke: 'none',
                fill: '#949494',
                transform: 'translate(-20px, -10px)',
              },
            }}
          />
          <ChartLabel
            text="Y Axis"
            className="alt-y-label"
            includeMargin={false}
            xPercent={0.06}
            yPercent={0.06}
            style={{
              transform: 'rotate(-90)',
              textAnchor: 'end',
            }}
          />
          <LineSeries style={lineSeriesStyle} data={short} />
          <LineSeries style={lineSeriesStyle} data={long} />
          <HorizontalGridLines
            width={width}
            left={0}
            style={{
              stroke: '#3393E0',
              strokeWidth: '1px',
            }}
          />
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
