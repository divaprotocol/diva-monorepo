import { useD3 } from '../../hooks/useD3.js';
import React from 'react';
import * as d3 from 'd3';
import generatePayoffChartData from '../../Graphs/DataGenerator.js';

function MarketChart(myData) {
  console.log(myData)
  const ref = useD3(
    (svg) => {
      const height = myData.targetHeight;
      const width = myData.targetWidth;

      const margin = { top: 10, right: 0, bottom: 10, left: 0 };

      // const { data } = myData.data;

      // const myData = {
      //   CollateralBalanceLong: 20,
      //   CollateralBalanceShort: 10,
      //   Strike: 20,
      //   Inflection: 35,
      //   Cap: 40,
      //   TokenSupply: 30,
      //   IsLong: true
      // };
      console.log(myData)
      const data = generatePayoffChartData(myData.data)

      const x = d3
        .scaleLinear()
        .domain(d3.extent(data, function(d) { return d.x; }))
        .range([0, width]);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, function(d) { return d.y; })])
        .range([height, 0]);

        
        const xAxis = (g) =>
        g.attr("transform", `translate(0,${height - margin.bottom})`).call(
          d3
            .axisBottom(x)
            .tickValues(
              d3
                .ticks(...d3.extent(x.domain()), width / 40)
                .filter((v) => x(v) !== undefined)
            )
            .tickSizeOuter(0)
        );

      const yAxis = (g) =>
      g
        .attr("transform", `translate(${margin.left},0)`)
        .style("color", "steelblue")
        .call(d3.axisLeft(y).ticks(null, "s"))
        .call((g) => g.select(".domain").remove())
        .call((g) =>
          g
            .append("text")
            .attr("x", -margin.left)
            .attr("y", 10)
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .text(data.y1)
        );
      
      //dont plot axes
      //svg.select(".x-axis").call(xAxis);
      //svg.select(".y-axis").call(yAxis);

      const valueline = d3.line()
        .x(function(d) { return x(d.x); })
        .y(function(d) { return y(d.y); });

      svg
        .append("path")
        .datum(data)  
        .attr("class", "line")
        .attr("stroke", function() { return (myData.isLong ? "steelblue" : "orange"); }) // conditional formatting
        .attr("fill", "none")
        .attr("stroke-width", "1px")
        .attr("d", valueline);

    },
   // [myData.length]
  );

  return (
    <svg
      ref={ref}
      style={{
        height: myData.targetHeight,
        width: myData.targetWidth,
      }}
    >
    </svg>
  );
}

export default MarketChart;