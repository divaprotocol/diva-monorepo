import { useRef, useEffect, useState, useLayoutEffect } from 'react'
import { Box, useTheme } from '@mui/material'
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
  const padding = cap * 0.1
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
      x: cap + padding,
      y: maxPayoutLong,
    },
  ]
  const [width, setWidth] = useState(350)
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

  useEffect(() => {
    setAxisLabel(collateralToken)
  }, [props.collateralToken])

  const lineSeriesStyle = { strokeWidth: '3px' }
  const height = 300

  if (hasError) lineSeriesStyle.stroke = theme.palette.error.main
  useEffect(() => {
    intitalChart()
  }, [])
  const intitalChart = () => {
    const svg = d3.select(ref.current)
    svg.attr('width', width).attr('height', 300).style('overflow', 'visible')
  }
  const draw = () => {
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()
    svg.selectAll('rect').data(long)
    const domainMin = d3.min(long, function (d) {
      return d.x - d.x * 0.2
    })
    const domainMax = d3.max(long, function (d) {
      return d.x + d.x * 0.1
    })
    console.log('domainMax', domainMin)
    const x = d3.scaleLinear().domain([domainMin, domainMax]).range([0, width])
    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(long, function (d) {
          return d.y
        }),
      ])
      .range([height, 60])
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
      .style('stroke', theme.palette.primary.light)
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
      .style('stroke', theme.palette.primary.dark)
      .style('stroke-width', '3px')
    svg
      .append('text')
      .attr('class', 'y label')
      .attr('y', 6)
      .attr('x', 0 - height / 2)
      .attr('dy', '1em')
      .style('text-anchor', 'middle')
      .text('Payout in' + ' ' + axisLabel)
  }
  useEffect(() => {
    draw()
  }, [props, long, short])

  return <svg ref={ref}></svg>
}
