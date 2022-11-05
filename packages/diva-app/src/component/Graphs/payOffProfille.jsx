import { useRef, useEffect, useState, useLayoutEffect } from 'react'
import { useTheme } from '@mui/material'
import * as d3 from 'd3'

export function PayoffProfile(props) {
  const ref = useRef()
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

  const padding = cap * 0.15
  const start = Math.max(floor - padding, 0)
  const totalCollateral = collateralBalanceLong + collateralBalanceShort

  const maxPayoutLong = totalCollateral / tokenSupply
  const maxPayoutShort = totalCollateral / tokenSupply
  const theme = useTheme()
  const tickVaule = [0, 0.2, 0.4, 0.6, 0.8, 1]

  const short = [
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
  const long = [
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
      x: cap * 1.15,
      y: maxPayoutLong,
    },
  ]
  const [chartWidth, setWidth] = useState(400)
  const [axisLabel, setAxisLabel] = useState('')

  useLayoutEffect(() => {
    const callback = () => {
      const rect = ref.current?.getBoundingClientRect()
      setWidth(rect?.width || 0)
    }
    window.addEventListener('resize', callback)
    callback()
    return () => {
      window.removeEventListener('resize', callback)
    }
  }, [ref.current])

  const chartHeight = 302

  const margin = { top: 10, right: 10, bottom: 30, left: 10 },
    width = chartWidth - margin.left - margin.right,
    height = chartHeight - margin.top - margin.bottom

  useEffect(() => {
    if (collateralToken != undefined) {
      setAxisLabel(collateralToken)
    }
  }, [props.collateralToken])

  const lineSeriesStyle = { strokeWidth: '3px' }

  if (hasError) lineSeriesStyle.stroke = theme.palette.error.main

  const intitalChart = () => {
    const svg = d3
      .select(ref.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('overflow', 'visible')
  }
  useEffect(() => {
    intitalChart()
  }, [])
  const draw = () => {
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()
    svg.selectAll('rect').data(long)
    const domainMin = d3.min(long, function (d) {
      return d.x
    })

    const domainMax = d3.max(long, function (d) {
      return d.x
    })

    const x = d3
      .scaleLinear()
      .domain([domainMin, domainMax])
      .range([width * 0.1, width * 0.98])
    svg
      .append('g')
      .attr('class', 'xAxisG')
      .attr('transform', 'translate(0,' + height + ')')
      .call(
        d3.axisBottom(x).ticks(3).tickSize(0).tickValues([floor, cap, strike])
      )
      .call((g) => g.selectAll('.tick text').attr('dy', 10))

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(long, function (d) {
          return d.y
        }),
      ])
      .range([height, 10])
    svg
      .append('g')
      .attr('class', 'yAxisG')
      .attr('transform', `translate(0)`)
      .call(
        d3
          .axisRight(y)
          .tickSize(width + 2)
          .tickValues(tickVaule)
          .ticks(6)
      )
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll('.tick:not(:first-of-type) line')
          .attr('stroke-opacity', 0.5)
          .style('stroke', '#3393E0')
      )
      .call((g) => g.selectAll('.tick text').attr('x', 4).attr('dy', -4))
    const longLine = d3
      .line()
      .x(function (d) {
        return x(d.x)
      })
      .y(function (d) {
        return y(d.y)
      })
    svg
      .append('path')
      .data([long])
      .attr('d', longLine)
      .style('fill', 'none')
      .style('stroke', '#1976D2')
      .style('stroke-width', '3px')
    const shortLine = d3
      .line()
      .x(function (d) {
        return x(d.x)
      })
      .y(function (d) {
        return y(d.y)
      })
    svg
      .append('path')
      .data([short])
      .attr('d', shortLine)
      .style('fill', 'none')
      .style('stroke', '#90CAF9')
      .style('stroke-width', '3px')

    svg
      .append('text')
      .attr('opacity', function () {
        return axisLabel ? 1 : 0
      })
      .attr('text-anchor', 'start')
      .attr('transform', 'rotate(-90)')
      .attr('y', -margin.left - 10)
      .attr('x', -margin.top - 180)
      .style('font-size', '14px')
      .text('Payout in' + ' ' + axisLabel)

    svg
      .append('rect')
      .attr('x', width - 25)
      .attr('y', height + 20)
      .attr('width', 25)
      .attr('height', 3)
      .style('fill', '#90CAF9')
    svg
      .append('text')
      .attr('x', width - 25)
      .attr('y', height + 40)
      .text('Short')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')

    svg
      .append('rect')
      .attr('x', width - 80)
      .attr('y', height + 20)
      .attr('width', 25)
      .attr('height', 3)
      .style('fill', '#1976D2')

    svg
      .append('text')
      .attr('x', width - 80)
      .attr('y', height + 40)
      .text('Long')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')
  }
  useEffect(() => {
    draw()
  }, [props, long, short, cap, strike, floor, collateralToken])

  return (
    <div>
      <svg ref={ref}></svg>
    </div>
  )
}
