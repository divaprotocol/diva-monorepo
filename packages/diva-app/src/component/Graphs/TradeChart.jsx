import React, { useLayoutEffect, useState } from 'react'
import * as d3 from 'd3'

export default function DIVATradeChart(props) {
  const ref = React.useRef()
  useLayoutEffect(() => {
    let {
      data,
      w, //Width
      h, //Height
      refAsset, //ReferenceAsset
      payOut,
      isLong,
      breakEven,
      currentPrice,
      floor,
      cap,
      mouseHover,
      showBreakEven,
    } = props
    data = data.map(({ x, y }) => ({
      x: parseFloat(x),
      y: parseFloat(y),
    }))

  // }
  constructor(props) {
    super(props)
    this.myRef = React.createRef()
  }

  componentDidMount() {
    const { data, w, h, refAsset, payOut, isLong, breakEven, currentPrice } =
      this.props
    const optionTypeText = isLong ? 'LONG' : 'SHORT'
    const reffeenceAsset = refAsset.slice(0, 8)
    // Set the dimensions and margins of the graph
    var margin = { top: 15, right: 2, bottom: 40, left: 20 },
      width = w - margin.left - margin.right,
      height = h - margin.top - margin.bottom

    console.log('breakEven', breakEven)
    // Append the svg object to the reference element of the page
    // Appends a 'group' element to 'svg'
    // Moves the 'group' element to the top left margin
    var svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('overflow', 'visible')
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    //Text Label on the Top left corner i.e Payout per Long token (in WAGMI18)
    const labelWidth = 30
    const labelHeight = 10
    const blueColorCode = '#3B8DCA'
    const redColorCode = '#F77F99'
    const legendHeight = height + 30
    svg
      .append('text')
      .attr('width', labelWidth)
      .attr('height', labelHeight)
      .attr('x', 5)
      .attr('y', 15)
      .style('padding', 10)
      .style('text-align', 'left')
      .style('fill', '#A4A4A4')
      .text(' Payout per ' + optionTypeText + ' token (' + 'in ' + payOut + ')')

    // legends
    svg
      .append('circle')
      .attr('cx', width * 0.0083)
      .attr('cy', legendHeight)
      .attr('r', 6)
      .style('fill', '#F7931A')
    svg
      .append('circle')
      .attr('cx', width * 0.3)
      .attr('cy', legendHeight)
      .attr('r', function () {
        return cap == floor ? 0 : 6
      })
      .style('fill', '#83BD67')
    svg
      .append('circle')
      .attr('cx', width * 0.58)
      .attr('cy', legendHeight)
      .attr('r', currentPrice ? 6 : 0)
      .style('fill', '#3393E0')
    svg
      .append('circle')
      .attr('cx', width * 0.8)
      .attr('cy', legendHeight)
      .attr('r', showBreakEven && breakEven != 'n/a' ? 6 : 0)
      .style('fill', '#9747FF')
    svg
      .append('text')
      .attr('x', width * 0.033)
      .attr('y', legendHeight)
      .attr('opacity', function () {
        return cap == floor ? 0 : 1
      })
      .text('Floor' + ' ' + '(' + floor + ')')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')
    svg
      .append('text')
      .attr('x', width * 0.033)
      .attr('y', legendHeight)
      .attr('opacity', function () {
        return cap == floor ? 1 : 0
      })
      .text('Inflection' + ' ' + '(' + cap + ')') //Binary payoff
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')
    svg
      .append('text')
      .attr('x', width * 0.32)
      .attr('y', legendHeight)
      .attr('opacity', function () {
        return cap == floor ? 0 : 1
      })
      .text('Cap' + ' ' + '(' + cap + ')')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')
    svg
      .append('text')
      .attr('x', width * 0.6)
      .attr('y', legendHeight)
      .attr('opacity', currentPrice ? 1 : 0)
      .text('Current price' + ' ' + '(' + currentPrice + ')')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')
    svg
      .append('text')
      .attr('x', width * 0.83)
      .attr('y', legendHeight)
      .attr('opacity', showBreakEven && breakEven != 'n/a' ? 1 : 0)
      .text('Break Even' + ' ' + '(' + breakEven + ')')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')

    // Add X axis
    const x = d3
      .scaleLinear()
      .domain([
        d3.min(data, function (d) {
          return d.x
        }),
        // <= currentPrice ? d.x : currentPrice || d.x
        d3.max(data, function (d) {
          return d.x
        }),
      ])
      .range([0, width])
    // Remove X- axis labels
    svg
      .append('g')
      .attr('class', 'xAxisG')
      .attr('transform', 'translate(0,' + height + ')')
      // .call(d3.axisBottom(x).tickSize(0)).call // .tickSize to remove the ticks at the ends
      .call(
        d3
          .axisBottom(x)
          .tickValues([
            breakEven,
            currentPrice,
            d3.max(data, function (d) {
              return d.x
            }),
          ])
          .ticks(3)
      )

    // Add Y axis
    console.log('value', data)
    const y = d3
      .scaleLinear()
      .domain([
        0,
        d3.max(data, function (d) {
          return d.y
        }),
      ])
      .range([height, 60])
    svg
      .append('g')
      .attr('class', 'yAxisG')
      .attr('transform', `translate(${margin.left},0)`)
      .call(
        d3
          .axisRight(y)
          .tickSize(width - margin.left - margin.right)
          .tickValues([
            0,
            data[2].y,
            d3.max(data, function (d) {
              return d.y
            }),
          ])
          .ticks(3)
      )
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll('.tick:not(:first-of-type) line')
          .attr('stroke-opacity', 0.3)
          .style('stroke', '#3393E0')
      )
      .call((g) => g.selectAll('.tick text').attr('x', 4).attr('dy', -4))

    // Add the line
    const valueline = d3
      .line()
      .x(function (d) {
        return x(d.x)
      })
      .y(function (d) {
        return y(d.y)
      })
    svg
      .append('path')
      .data([data]) // or data([data])
      .attr('d', valueline)
      .style('fill', 'none')
      .style('stroke', 'grey')
      .style('stroke-width', '1px')

    // Format x axis
    d3.select('.xAxisG path')
      .style('stroke', '#B8B8B8')
      .style('stroke-width', '0.75px')
    //for Y axis
    // for cuurent price point
    svg
      .append('g')
      .selectAll('dot')
      .data(data)
      .enter()
      .append('circle')
      .filter(function (d) {
        return (d.x = currentPrice)
      })
      .attr('cx', function (d) {
        return x(d.x)
      })
      .attr('cy', function (d) {
        return y(0)
      })
      .attr('r', 5)
      .style('fill', '#1B394F')
    //for break-even point
    svg
      .append('g')
      .selectAll('dot')
      .data(data)
      .enter()
      .append('circle')
      .filter(function (d) {
        return (d.x = breakEven)
      })
      .attr('cx', function (d) {
        return x(d.x)
      })
      .attr('cy', function (d) {
        return y(0)
      })
      .attr('r', 5)
      .style('fill', '#4C0D46')

    // Add mouseover effects
    const mouseG = svg
      .append('g') // corresponds to the first part of focus/focusText in the other example but without the circle/text, this will be added later
      .attr('class', 'mouse-over-effects')

    // This is the black vertical line to follow mouse
    // The values for the path are passed as the "d" attribute later
    mouseG
      .append('path')
      .attr('class', 'mouse-line')
      .style('stroke', 'black')
      .style('stroke-width', '1px')
      .style('opacity', '0')

    const lines = document.getElementsByClassName('line')
    const mousePerLine = mouseG
      .data([data])
      .append('g')
      .selectAll('dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('opacity', showBreakEven && breakEven != 'n/a' ? 1 : 0)
      .filter(function (d) {
        return (d.x = breakEven ? breakEven : null)
      })
      .attr('cx', function (d) {
        return x(d.x)
      })
      .attr('cy', function () {
        return y(0)
      })
      .attr('r', 5)
      .style('fill', '#9747FF')
    // for current price point
    svg
      .append('g')
      .selectAll('dot')
      .data(data)
      .enter()
      .append('circle')
      .filter(function (d) {
        return (d.x = currentPrice ? currentPrice : null)
      })
      .attr('cx', function (d) {
        return x(d.x)
      })
      .attr('cy', function () {
        return y(0)
      })
      .attr('r', 5)
      .style('fill', '#3393E0')
    //for floor point
    svg
      .append('g')
      .selectAll('dot')
      .data(data)
      .enter()
      .append('circle')
      .filter(function (d) {
        return (d.x = floor)
      })
      .attr('cx', function (d) {
        return x(d.x)
      })
      .attr('cy', function () {
        return y(0)
      })
      .attr('r', 5)
      .style('fill', '#F7931A')
    //for cap point
    svg
      .append('g')
      .selectAll('dot')
      .data(data)
      .enter()
      .append('circle')
      .filter(function (d) {
        return cap == floor ? null : (d.x = cap)
      })
      .attr('cx', function (d) {
        return x(d.x)
      })
      .attr('cy', function () {
        return y(0)
      })
      .attr('r', 5)
      .style('fill', '#83BD67')

    const blueColorCode = '#3B8DCA'
    const redColorCode = '#F77F99'

      var mouseout = function () {
        d3.select('.mouse-line').style('opacity', '0')
        d3.selectAll('.mouse-per-line circle').style('opacity', '0')
        d3.selectAll('.tooltip-pper-line rect').style('opacity', '0')
        d3.selectAll('.tooltip-per-line text').style('opacity', '0')
      }
      var formatDecimalComma = d3.format(',.2f') // For more formats check here: http://bl.ocks.org/mstanaland/6106487

      const yPos = function (d, i, m, l) {
        var beginning = 0,
          end = l[i].getTotalLength(),
          target = null,
          pos = null

        // eslint-disable-next-line
      while (true) {
          target = Math.floor((beginning + end) / 2)
          pos = l[i].getPointAtLength(target)
          if ((target === end || target === beginning) && pos.x !== m) {
            break
          }
          if (pos.x > m) end = target
          else if (pos.x < m) beginning = target
          else break //position found
        }
        return pos
      }

      var mousemove = function (event) {
        var mouse = d3.pointer(event)
        d3.select('.mouse-line').attr('d', function () {
          var d = 'M' + mouse[0] + ',' + height
          d += ' ' + mouse[0] + ',' + 60
          return d
        })
        d3.select('.mouse-line').style('stroke', function (d, i) {
          var pos = yPos(d, i, mouse[0], lines)
          return y.invert(pos.y) >= breakEven ? redColorCode : blueColorCode
        })

      d3.select('.mouse-per-line circle').style('fill', function (d, i) {
        var pos = yPos(d, i, mouse[0], lines)
        return y.invert(pos.y) >= breakEven ? redColorCode : blueColorCode
      })

        d3.select('.line').style('stroke', function (d, i) {
          var pos = yPos(d, i, mouse[0], lines)
          return y.invert(pos.y) >= breakEven ? redColorCode : blueColorCode
        }
      )

      d3.select('.line').style('stroke', function (d, i) {
        var pos = yPos(d, i, mouse[0], lines)
        return y.invert(pos.y) >= breakEven ? redColorCode : blueColorCode
      })

          return 'translate(' + mouse[0] + ',' + pos.y + ')'
        })

        d3.selectAll('.tooltip-per-line').attr('transform', function (d, i) {
          var xValue = x.invert(mouse[0])
          var pos = yPos(d, i, mouse[0], lines)

          d3.select(this)
            .select('.tooltip-underlying')
            .text(formatDecimalComma(xValue.toFixed(2)))
          d3.select(this)
            .select('.tooltip-payout')
            .text(formatDecimalComma(y.invert(pos.y).toFixed(2)))
          return (
            'translate(' + (mouse[0] - tooltipBoxWidth * 0.55) + ',' + 0 + ')'
          )
        })
      }
      // Create a rect on top of the svg area to catch mouse movements on canvas (can't catch mouse events on a g element)
      mouseG
        .append('svg:rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .on('mouseout', mouseout)
        .on('mouseover', mouseover)
        .on('mousemove', mousemove)
    }
    if (mouseHover) {
      mouseHoverEffect()
    }
  }, [props.w])

  return <div id="DivaTradeChart" ref={ref}></div>
}
