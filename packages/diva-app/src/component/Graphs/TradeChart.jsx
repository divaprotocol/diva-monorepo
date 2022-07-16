// Payoff chart for DIVA Markets page
// Sources:
// * Chart: https://bl.ocks.org/d3noob/402dd382a51a4f6eea487f9a35566de0
// * D3 in React: https://youtu.be/YKDIsXA4OAc

import React, { useLayoutEffect } from 'react'
import * as d3 from 'd3'

export default function DIVATradeChart(props) {
  const ref = React.useRef()
  useLayoutEffect(() => {
    const {
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
    } = props
    const optionTypeText = isLong ? 'LONG' : 'SHORT'
    const reffeenceAsset = refAsset.slice(0, 8)
    // Set the dimensions and margins of the graph
    var margin = { top: 15, right: 2, bottom: 20, left: 20 },
      width = w - margin.left - margin.right,
      height = h - margin.top - margin.bottom

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
      .attr('cx', 5)
      .attr('cy', h)
      .attr('r', 6)
      .style('fill', '#F7931A')
    svg
      .append('circle')
      .attr('cx', 150)
      .attr('cy', h)
      .attr('r', function () {
        return cap == floor ? 0 : 6
      })
      .style('fill', '#83BD67')
    svg
      .append('circle')
      .attr('cx', 300)
      .attr('cy', h)
      .attr('r', currentPrice ? 6 : 0)
      .style('fill', '#3393E0')
    svg
      .append('text')
      .attr('x', 20)
      .attr('y', h)
      .attr('opacity', function () {
        return cap == floor ? 0 : 1
      })
      .text('Floor' + ' ' + '(' + floor + ')')
      .style('font-size', '15px')
      .attr('alignment-baseline', 'middle')
    svg
      .append('text')
      .attr('x', 20)
      .attr('y', h)
      .attr('opacity', function () {
        return cap == floor ? 1 : 0
      })
      .text('Inflection' + ' ' + '(' + cap + ')') //Binary payoff
      .style('font-size', '15px')
      .attr('alignment-baseline', 'middle')
    svg
      .append('text')
      .attr('x', 165)
      .attr('y', h)
      .attr('opacity', function () {
        return cap == floor ? 0 : 1
      })
      .text('Cap' + ' ' + '(' + cap + ')')
      .style('font-size', '15px')
      .attr('alignment-baseline', 'middle')
    svg
      .append('text')
      .attr('x', 315)
      .attr('y', h)
      .attr('opacity', currentPrice ? 1 : 0)
      .text('Current price' + ' ' + '(' + currentPrice + ')')
      .style('font-size', '15px')
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
      .range([0, width - margin.left - margin.right])
    // Remove X- axis labels
    svg
      .append('g')
      .attr('class', 'xAxisG')
      .attr('transform', 'translate(0,' + height + ')')
    // Add Y axis
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
      .attr('transform', `translate(0)`)
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
          .attr('stroke-opacity', 0.5)
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
      .style('stroke', function () {
        return mouseHover ? 'grey' : blueColorCode
      })
      .style('stroke-width', '4px')
      .attr('class', function () {
        return mouseHover ? 'line' : null
      })

    // Format x axis
    d3.select('.xAxisG path')
      .style('stroke', '#B8B8B8')
      .style('stroke-width', '0.75px')
    //for Y axis
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
        return (d.x = cap)
      })
      .attr('cx', function (d) {
        return x(d.x)
      })
      .attr('cy', function () {
        return y(0)
      })
      .attr('r', 5)
      .style('fill', '#83BD67')

    // Add mouseover effects
    const mouseHoverEffect = () => {
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
        .attr('class', 'mouse-per-line')

      const tooltipPerLine = mouseG
        .data([data])
        .append('g')
        .attr('class', 'tooltip-per-line')

      // Create the circle that travels along the curve of chart
      mousePerLine
        .append('circle')
        .attr('r', 7)
        .style('stroke', 'white')
        .style('fill', 'white')
        .style('stroke-width', '2px')
        .style('opacity', '0')

      const tooltipBoxWidth = 215
      const tooltipBoxHeight = 55

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
        .attr('y', 40)
        .attr('font-size', '14')
        .text(reffeenceAsset + '...' + ' at Expiry:')

      tooltipPerLine
        .append('text')
        .attr('class', 'tooltip-underlying')
        .attr('text-anchor', 'end')
        .attr('x', tooltipBoxWidth)
        .attr('y', 40)
        .attr('font-size', '14')

      tooltipPerLine
        .append('text')
        .attr('x', 18)
        .attr('y', 55)
        .attr('font-size', '14')
        .text(' Payout:')

      tooltipPerLine
        .append('text')
        .attr('class', 'tooltip-payout')
        .attr('text-anchor', 'end')
        .attr('x', tooltipBoxWidth)
        .attr('y', 55)
        .attr('font-weight', 'bold')
        .attr('font-size', '14')

      // Create the text that travels along the curve of chart and the position relative to the mouse location
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
      }

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
        d3.select('.mouse-line')
          .attr('d', function () {
            var d = 'M' + mouse[0] + ',' + height
            d += ' ' + mouse[0] + ',' + 60
            return d
          })
          .style('stroke', function (d, i) {
            var pos = yPos(d, i, mouse[0], lines)
            return x.invert(pos.x) >= breakEven ? blueColorCode : redColorCode
          })

        d3.select('.mouse-per-line circle').style('fill', function (d, i) {
          var pos = yPos(d, i, mouse[0], lines)
          return x.invert(pos.x) >= breakEven ? blueColorCode : redColorCode
        })

        d3.select('.tooltip-per-line .tooltip-payout').style(
          'fill',
          function (d, i) {
            var pos = yPos(d, i, mouse[0], lines)
            return x.invert(pos.x) >= breakEven ? blueColorCode : redColorCode
          }
        )

        d3.select('.line').style('stroke', function (d, i) {
          var pos = yPos(d, i, mouse[0], lines)
          return x.invert(pos.x) >= breakEven ? blueColorCode : redColorCode
        })

        d3.selectAll('.mouse-per-line').attr('transform', function (d, i) {
          var pos = yPos(d, i, mouse[0], lines)

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
