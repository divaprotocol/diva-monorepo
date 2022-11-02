import { useRef, useEffect, useState } from 'react'
import * as d3 from 'd3'

export default function DIVATradeChart(props) {
  const ref = useRef()
  const svgContainer = useRef(null)
  let {
    data,
    w,
    h,
    refAsset,
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

  const optionTypeText = isLong ? 'LONG' : 'SHORT'
  const reffeenceAsset = refAsset.slice(0, 8)
  const [chartWidth, setChartWidth] = useState(w)
  const [chartHeight, setChartHeight] = useState(h)
  const [isLegendResponsive, setLegendResponsive] = useState(true)

  const getSvgContainerSize = () => {
    const newWidth = svgContainer.current.clientWidth
    setChartWidth(newWidth)
  }

  useEffect(() => {
    getSvgContainerSize()
    window.addEventListener('resize', getSvgContainerSize)
    return () => window.removeEventListener('resize', getSvgContainerSize)
  }, [props.w, props.h])

  useEffect(() => {
    if (chartWidth > 762) {
      setChartHeight(chartWidth * 0.49)
    } else {
      setChartHeight(h)
    }
  }, [chartWidth, h])
  console.log('chartwidth-', chartWidth)
  console.log('chartheight-', chartHeight)

  // Set the dimensions and margins of the graph
  const margin = { top: 15, right: 20, bottom: 40, left: 0 },
    width = chartWidth - margin.left - margin.right,
    height = chartHeight - margin.top - margin.bottom

  const labelWidth = 30
  const labelHeight = 10
  const blueColorCode = '#3B8DCA'
  const redColorCode = '#F77F99'
  const legendHeight = height + 30
  const newLegendHeight = height + 58
  const legendXPos = {
    capCircle: width * 0.3,

    capText: width * 0.33,

    currentCircle: width * 0.55,

    currentText: width * 0.58,

    breakEvenCircle: width * 0.0083,

    breakEvenText: width * 0.033,
  }
  const newlegendXPos = {
    breakEvenCircle: width * 0.54,

    breakEvenText: width * 0.58,
  }
  const mobileViewLegeds = {
    floorCircle: width * 0.0083,

    floorText: width * 0.05,

    capCirlce: width * 0.54,

    capText: width * 0.58,

    currentCircle: width * 0.0083,

    currentText: width * 0.05,
  }

  useEffect(() => {
    if (width <= 445) {
      setLegendResponsive(false)
    } else {
      setLegendResponsive(true)
    }
  }, [chartWidth])

  const intitalChart = () => {
    const svg = d3.select(ref.current)
    svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('overflow', 'visible')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
  }

  useEffect(() => {
    intitalChart()
  }, [chartWidth])
  // Moves the 'group' element to the top left margin
  const draw = () => {
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()
    svg.selectAll('rect').data(data)
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

    // Add X axis
    const domainMin = d3.min(data, function (d) {
      return d.x
    })
    const domainMax = d3.max(data, function (d) {
      return d.x
    })
    const x = d3.scaleLinear().domain([domainMin, domainMax]).range([0, width])
    // Remove X- axis labels
    svg
      .append('rect')
      .attr('transform', 'translate(0,' + height + ')')
      .style('stroke', '#B8B8B8')
      .style('stroke-width', '0.75px')
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
          .tickSize(width)
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

    // // Add the line

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

    // breakEven point
    svg
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
    // // for current price point
    svg
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

    // //for floor point
    svg
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

    // //for cap point
    svg
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

    // legends
    //floorcircle
    svg
      .append('circle')
      .attr('cx', width * 0.0083)
      .attr('cy', legendHeight)
      .attr('r', 6)
      .style('fill', '#F7931A')

    //cap circle
    svg
      .append('circle')
      .attr(
        'cx',
        isLegendResponsive ? legendXPos.capCircle : mobileViewLegeds.capCirlce
      )
      .attr('cy', legendHeight)
      .attr('r', function () {
        return cap == floor ? 0 : 6
      })
      .style('fill', '#83BD67')
    //current Price
    svg
      .append('circle')
      .attr(
        'cx',
        isLegendResponsive
          ? legendXPos.currentCircle
          : mobileViewLegeds.currentCircle
      )
      .attr(
        'cy',
        showBreakEven && isLegendResponsive ? legendHeight : newLegendHeight
      )
      .attr('r', currentPrice ? 6 : 0)
      .style('fill', '#3393E0')
    svg
      .append('circle')
      .attr(
        'cx',
        isLegendResponsive && currentPrice
          ? legendXPos.breakEvenCircle
          : newlegendXPos.breakEvenCircle
      )
      .attr('cy', currentPrice ? newLegendHeight : legendHeight)
      .attr('r', showBreakEven && breakEven != 'n/a' ? 6 : 0)
      .style('fill', '#9747FF')

    //legend Text
    svg
      .append('text')
      .attr('x', showBreakEven ? width * 0.033 : mobileViewLegeds.floorText)
      .attr('y', legendHeight)
      .attr('opacity', function () {
        return cap == floor ? 0 : 1
      })
      .text('Floor' + ' ' + '(' + parseFloat(floor).toFixed(2) + ')')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')

    svg
      .append('text')
      .attr('x', width * 0.033)
      .attr('y', legendHeight)
      .attr('opacity', function () {
        return cap == floor ? 1 : 0
      })
      .text('Inflection' + ' ' + '(' + parseFloat(cap).toFixed(2) + ')') //Binary payoff
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')
    //cap text
    svg
      .append('text')
      .attr(
        'x',
        isLegendResponsive ? legendXPos.capText : mobileViewLegeds.capText
      )
      .attr('y', legendHeight)
      .attr('opacity', function () {
        return cap == floor ? 0 : 1
      })
      .text('Cap' + ' ' + '(' + parseFloat(cap).toFixed(2) + ')')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')

    //current price legend
    svg
      .append('text')
      .attr(
        'x',
        isLegendResponsive
          ? legendXPos.currentText
          : mobileViewLegeds.currentText
      )
      .attr('y', isLegendResponsive ? legendHeight : newLegendHeight)
      .attr('opacity', currentPrice ? 1 : 0)
      .text(
        'Current Value' + ' ' + '(' + parseFloat(currentPrice).toFixed(2) + ')'
      )
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')

    svg
      .append('text')
      .attr(
        'x',
        isLegendResponsive && currentPrice
          ? legendXPos.breakEvenText
          : newlegendXPos.breakEvenText
      )
      .attr('y', currentPrice ? newLegendHeight : legendHeight)
      .attr('opacity', showBreakEven && breakEven != 'n/a' ? 1 : 0)
      .text('Break Even' + ' ' + '(' + parseFloat(breakEven).toFixed(2) + ')')
      .style('font-size', '12px')
      .attr('alignment-baseline', 'middle')

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
        .style('stroke', 'grey')
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
        .style('fill', blueColorCode)
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

        //eslint-disable-next-line
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

        if (isLong) {
          d3.select('.mouse-line').style('stroke', function (d, i) {
            var pos = yPos(d, i, mouse[0], lines)
            return x.invert(pos.x) >= breakEven || breakEven == 'n/a'
              ? blueColorCode
              : redColorCode
          })

          d3.select('.mouse-per-line circle').style('fill', function (d, i) {
            var pos = yPos(d, i, mouse[0], lines)
            return x.invert(pos.x) >= breakEven || breakEven == 'n/a'
              ? blueColorCode
              : redColorCode
          })

          d3.select('.tooltip-per-line .tooltip-payout').style(
            'fill',
            function (d, i) {
              var pos = yPos(d, i, mouse[0], lines)
              return x.invert(pos.x) >= breakEven || breakEven == 'n/a'
                ? blueColorCode
                : redColorCode
            }
          )

          d3.select('.line').style('stroke', function (d, i) {
            var pos = yPos(d, i, mouse[0], lines)
            return x.invert(pos.x) >= breakEven || breakEven == 'n/a'
              ? blueColorCode
              : redColorCode
          })
        } else {
          d3.select('.mouse-line').style('stroke', function (d, i) {
            var pos = yPos(d, i, mouse[0], lines)
            return x.invert(pos.x) <= breakEven || breakEven == 'n/a'
              ? blueColorCode
              : redColorCode
          })

          d3.select('.mouse-per-line circle').style('fill', function (d, i) {
            var pos = yPos(d, i, mouse[0], lines)
            return x.invert(pos.x) <= breakEven || breakEven == 'n/a'
              ? blueColorCode
              : redColorCode
          })

          d3.select('.tooltip-per-line .tooltip-payout').style(
            'fill',
            function (d, i) {
              var pos = yPos(d, i, mouse[0], lines)
              return x.invert(pos.x) <= breakEven || breakEven == 'n/a'
                ? blueColorCode
                : redColorCode
            }
          )

          d3.select('.line').style('stroke', function (d, i) {
            var pos = yPos(d, i, mouse[0], lines)
            return x.invert(pos.x) <= breakEven || breakEven == 'n/a'
              ? blueColorCode
              : redColorCode
          })
        }

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
  }
  useEffect(() => {
    draw()
  }, [
    props.currentPrice,
    props.breakEven,
    props.w,
    isLegendResponsive,
    chartWidth,
  ])

  return (
    <div ref={svgContainer} className="line-chart">
      <svg ref={ref}></svg>
    </div>
  )
}
