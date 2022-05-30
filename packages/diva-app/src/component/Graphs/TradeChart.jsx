// Payoff chart for DIVA Markets page
// Sources:
// * Chart: https://bl.ocks.org/d3noob/402dd382a51a4f6eea487f9a35566de0
// * D3 in React: https://youtu.be/YKDIsXA4OAc

import React, { Component } from 'react'
import * as d3 from 'd3'

class DIVATradeChart extends Component {
  // export default function DIVATradeChart {

  // }
  constructor(props) {
    super(props)
    this.myRef = React.createRef()
  }

  componentDidMount() {
    const { data, w, h, refAsset, payOut, isLong, breakEven } = this.props
    const optionTypeText = isLong ? 'LONG' : 'SHORT'
    // Set the dimensions and margins of the graph
    // var margin = {top: 50, right: 20, bottom: 30, left: 50},
    var margin = { top: 15, right: 2, bottom: 20, left: 20 },
      width = w - margin.left - margin.right,
      height = h - margin.top - margin.bottom

    // Append the svg object to the reference element of the page
    // Appends a 'group' element to 'svg'
    // Moves the 'group' element to the top left margin
    var svg = d3
      .select(this.myRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('overflow', 'visible')
      .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    //Text Label on the Top left corner i.e Payout per Long token (in WAGMI18)
    const labelWidth = 30
    const labelHeight = 10
    svg
      .append('text')
      .attr('width', labelWidth)
      .attr('height', labelHeight)
      .attr('x', 5)
      .attr('y', 15)
      .style('padding', 10)
      .style('text-align', 'left')
      .style('fill', 'white')
      .text(' Payout per ' + optionTypeText + ' token (' + 'in ' + payOut + ')')

    // Add X axis
    const x = d3
      .scaleLinear()
      .domain(
        d3.extent(data, function (d) {
          return d.x
        })
      )
      .range([0, width])
    svg
      .append('g')
      .attr('class', 'xAxisG')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x).tickSize(0)) // .tickSize to remove the ticks at the ends

    // Remove axis labels
    d3.selectAll('.tick').remove()

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
    svg.append('g').attr('class', 'yAxisG')

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
      .datum(data) // or data([data])
      .attr('class', 'line')
      .attr('d', valueline)

    // Format line
    d3.select('.line')
      .style('fill', 'none')
      .style('stroke', 'grey')
      .style('stroke-width', '5px')

    // Format x axis
    d3.select('.xAxisG path')
      .style('stroke', '#B8B8B8')
      .style('stroke-width', '3px')

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
      .style('stroke-width', '2px')
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
      .text(refAsset + ' at Expiry:')

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
      d3.selectAll('.tooltip-per-line rect').style('opacity', '1')
      d3.selectAll('.tooltip-per-line text').style('opacity', '1')
    }

    var mouseout = function () {
      d3.select('.mouse-line').style('opacity', '0')
      d3.selectAll('.mouse-per-line circle').style('opacity', '0')
      d3.selectAll('.tooltip-per-line rect').style('opacity', '0')
      d3.selectAll('.tooltip-per-line text').style('opacity', '0')
    }

    const greenColorCode = '#07CAA7'
    const redColorCode = '#F77F99'

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
          return y.invert(pos.y) >= breakEven ? greenColorCode : redColorCode
        })

      d3.select('.mouse-per-line circle').style('fill', function (d, i) {
        var pos = yPos(d, i, mouse[0], lines)
        return y.invert(pos.y) >= breakEven ? greenColorCode : redColorCode
      })

      d3.select('.tooltip-per-line .tooltip-payout').style(
        'fill',
        function (d, i) {
          var pos = yPos(d, i, mouse[0], lines)
          return y.invert(pos.y) >= breakEven ? greenColorCode : redColorCode
        }
      )

      d3.select('.line').style('stroke', function (d, i) {
        var pos = yPos(d, i, mouse[0], lines)
        return y.invert(pos.y) >= breakEven ? greenColorCode : redColorCode
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

  render() {
    return <div ref={this.myRef}></div>
  }
}

export default DIVATradeChart
