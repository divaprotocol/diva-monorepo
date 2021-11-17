import { useD3 } from '../../hooks/useD3.js'
import React, { useEffect, useState } from 'react'
import * as d3 from 'd3'
import { generatePayoffChartData } from '../../Graphs/DataGenerator.js'

function MarketChart(option) {
  console.log(option)

  const [myData, setMyData] = useState(option)

  const ref = useD3(
    Object.keys(option).length === 0
      ? () => <svg />
      : (svg) => {
          const height = myData.targetHeight
          const width = myData.targetWidth
          const data = generatePayoffChartData(myData.data)

          const x = d3
            .scaleLinear()
            .domain(
              d3.extent(data, function (d) {
                return d.x
              })
            )
            .range([0, width])

          const y = d3
            .scaleLinear()
            .domain([
              0,
              d3.max(data, function (d) {
                return d.y
              }),
            ])
            .range([height, 0])

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
            .datum(data)
            .attr('class', 'line')
            .attr('stroke', function () {
              return myData.isLong ? 'steelblue' : 'orange'
            }) // conditional formatting
            .attr('fill', 'none')
            .attr('stroke-width', '1px')
            .attr('d', valueline)
        }
    // [myData.length]
  )

  useEffect(() => {
    return () => {
      setMyData({})
    }
  }, [])
  return (
    <svg
      ref={ref}
      style={{
        height: myData.targetHeight,
        width: myData.targetWidth,
      }}
    ></svg>
  )
}

export default MarketChart
