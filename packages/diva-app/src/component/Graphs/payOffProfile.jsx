import { useRef, useEffect, useState, useLayoutEffect } from 'react'
import { useTheme } from '@mui/material'
import * as d3 from 'd3'

export function PayoffProfile(props) {
  const ref = useRef()
  const {
    floor,
    cap,
    inflection: strike,
    gradient,
    hasError,
    longDirection,
    collateralToken,
    referenceAsset,
  } = props

  const padding = cap * 0.1
  const start = Math.max(floor - padding, 0)

  const maxPayoutLong = 1
  const maxPayoutShort = 1
  const theme = useTheme()
  const tickValues = [0, 1 - gradient, 0.5, gradient, 1]

  const getShortenedRefAsset = (referenceAsset) => {
    if (referenceAsset != null && referenceAsset.length >= 10) {
      const begining = referenceAsset.slice(0, 10)

      return `${begining}...`
    } else return referenceAsset
  }
  const refenAsst = getShortenedRefAsset(referenceAsset)
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
      y: 1 - gradient,
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
      y: gradient,
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
  const longdata = long.map(({ x, y }) => ({
    x: parseFloat(x),
    y: parseFloat(y),
  }))
  const [chartWidth, setWidth] = useState(400)
  const [axisLabel, setAxisLabel] = useState('')
  const domainMin = d3.min(longdata, function (d) {
    return d.x
  })

  const domainMax = d3.max(longdata, function (d) {
    return d.x
  })

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
    const svg = d3.select(ref.current)
    svg
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
    svg.selectAll('rect').data(longdata)
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
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick text').attr('dy', 10))

    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(longdata, function (d) {
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
          .tickValues(tickValues)
          .ticks(4)
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
      .data([longdata])
      .attr('d', longLine)
      .style('fill', 'none')
      .style('stroke', '#1976D2')
      .style('opacity', function () {
        if (longDirection == true || longDirection == undefined) {
          return 1
        } else {
          return 0
        }
      })
      .style('stroke-width', '3px')
      .attr('class', 'line')
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
      .style('opacity', function () {
        if (longDirection == true) {
          return 0
        } else {
          return 1
        }
      })
      .style('stroke-width', '3px')
      .attr('class', 'line')

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
      .style('opacity', function () {
        if (longDirection == true) {
          return 0
        } else {
          return 1
        }
      })
    svg
      .append('text')
      .attr('x', width - 25)
      .attr('y', height + 40)
      .text('Short')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')
      .style('opacity', function () {
        if (longDirection == true) {
          return 0
        } else {
          return 1
        }
      })

    svg
      .append('rect')
      .attr('x', width - 80)
      .attr('y', height + 20)
      .attr('width', 25)
      .attr('height', 3)
      .style('fill', '#1976D2')
      .style('opacity', function () {
        if (longDirection == true || longDirection == undefined) {
          return 1
        } else {
          return 0
        }
      })

    svg
      .append('text')
      .attr('x', width - 80)
      .attr('y', height + 40)
      .text('Long')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')
      .style('opacity', function () {
        if (longDirection == true || longDirection == undefined) {
          return 1
        } else {
          return 0
        }
      })

    //mouse hover

    const mouseHoverEffect = () => {
      const mouseG = svg.append('g').attr('class', 'mouse-over-effects')

      mouseG
        .append('path')
        .attr('class', 'mouse-line')
        .style('stroke', 'grey')
        .style('stroke-width', '1px')
        .style('opacity', '0')

      const lines = document.getElementsByClassName('line')
      const mousePerLine = mouseG
        .data([long])
        .append('g')
        .attr('class', 'mouse-per-line')
      const mousePerLineShort = mouseG
        .data([short])
        .append('g')
        .attr('class', 'mouse-per-line')
      mousePerLineShort
        .append('circle')
        .attr('r', function () {
          if (longDirection == true) {
            return 0
          } else {
            return 7
          }
        })
        .style('stroke', 'black')
        .style('fill', '#90CAF9')
        .style('stroke-width', '2px')

      mousePerLine
        .append('circle')
        .attr('r', function () {
          if (longDirection == true || longDirection == undefined) {
            return '7'
          } else {
            return '0'
          }
        })
        .style('stroke', 'black')
        .style('fill', '#1976D2')
        .style('stroke-width', '2px')

      const tooltipBoxWidth = 215
      const tooltipBoxHeight = 55
      const tooltipPerLine = mouseG
        .data([long])
        .append('g')
        .attr('class', 'tooltip-per-line')

      tooltipPerLine
        .append('rect')
        .attr('class', 'tooltip')
        .attr('width', tooltipBoxWidth)
        .attr('height', tooltipBoxHeight)
        .attr('x', 10)
        .attr('y', 0)
        .attr('rx', 4)
        .attr('ry', 4)
        .style('fill', 'none')
        .style('opacity', '0')

      tooltipPerLine
        .append('text')
        .attr('x', 18)
        .attr('y', -5)
        .attr('font-size', '14')
        .text(refenAsst + ' at Expiry:')

      tooltipPerLine
        .append('text')
        .attr('class', 'tooltip-underlying')
        .attr('text-anchor', 'end')
        .attr('x', tooltipBoxWidth)
        .attr('y', -5)
        .attr('font-size', '14')

      mousePerLine
        .append('text')
        .attr('transform', 'translate(10,3)')
        .attr('font-size', function () {
          if (longDirection == true || longDirection == undefined) {
            return '14'
          } else {
            return '0'
          }
        })
      mousePerLineShort
        .append('text')
        .attr('transform', 'translate(10,3)')
        .attr('font-size', function () {
          if (longDirection == true) {
            return 0
          } else {
            return 14
          }
        })

      tooltipPerLine
        .append('text')
        .attr('class', 'topRow')
        .attr('transform', 'translate(10,3)')

      tooltipPerLine
        .append('text')
        .attr('class', 'bottomRow')
        .attr('transform', 'translate(10,30)')

      var mouseover = function () {
        d3.select('.mouse-line').style('opacity', '1')
        d3.selectAll('.mouse-per-line circle').style('opacity', '1')
        d3.selectAll('.tooltip-pper-line rect').style('opacity', '1')
        d3.selectAll('.tooltip-per-line text').style('opacity', '1')
        d3.selectAll('.mouse-per-line text').style('opacity', '1')
      }

      var mouseout = function () {
        d3.select('.mouse-line').style('opacity', '0')
        d3.selectAll('.mouse-per-line circle').style('opacity', '0')
        d3.selectAll('.mouse-per-line text').style('opacity', '0')
        d3.selectAll('.tooltip-pper-line rect').style('opacity', '0')
        d3.selectAll('.tooltip-per-line text').style('opacity', '0')
      }
      var formatDecimalComma = d3.format(',.2f')

      const yPos = function (d, i, m, l) {
        var beginning = 0,
          end = lines[i].getTotalLength(),
          target = null,
          pos = null

        //eslint-disable-next-line
    while (true) {
          target = Math.floor((beginning + end) / 2)
          pos = l[i].getPointAtLength(target)
          if ((target === end || target === beginning) && pos.x !== m) {
            break
          }
          if (pos.x > m) end = target
          else if (pos.x < m) beginning = target
          else break
        }
        return pos
      }

      var mousemove = function (event) {
        var mouse = d3.pointer(event)
        d3.select('.mouse-line').attr('d', function () {
          var d = 'M' + mouse[0] + ',' + height
          d += ' ' + mouse[0] + ',' + 10
          return d
        })

        d3.selectAll('.mouse-per-line').attr('transform', function (d, i) {
          var pos = yPos(d, i, mouse[0], lines)
          d3.select(this)
            .select('text')
            .text(formatDecimalComma(y.invert(pos.y).toFixed(2)))
          return 'translate(' + mouse[0] + ',' + pos.y + ')'
        })

        d3.selectAll('.tooltip-per-line').attr('transform', function (d, i) {
          var xValue = x.invert(mouse[0])

          d3.select(this)
            .select('.tooltip-underlying')
            .text(formatDecimalComma(xValue.toFixed(2)))

          return (
            'translate(' + (mouse[0] - tooltipBoxWidth * 0.55) + ',' + 0 + ')'
          )
        })
      }

      mouseG
        .append('svg:rect')
        .attr('width', width * 0.98)
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', mouseout)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
    }

    mouseHoverEffect()
  }
  useEffect(() => {
    draw()
  }, [props, long, cap, strike, floor, collateralToken, longDirection])

  return (
    <div>
      <svg ref={ref}></svg>
    </div>
  )
}
