import React from 'react'

import {
  XYPlot,
  LineSeries,
  HorizontalGridLines,
  XAxis,
  YAxis,
} from 'react-vis'

// Payoff function for long position tokens (see whitepaper)
function payoffFunctionLong(
  valueUnderlying,
  collateralBalanceLong,
  collateralBalanceShort,
  floor,
  strike,
  cap,
  tokenSupply
) {
  let beta = 0
  // valueUnderlying is the variable here for a given option
  if (valueUnderlying >= strike) {
    beta = collateralBalanceShort / (cap - strike)
  } else {
    beta = collateralBalanceLong / (strike - floor)
  }

  const alpha = -strike * beta

  const payoffLong =
    Math.min(
      collateralBalanceShort + collateralBalanceLong,
      Math.max(0, alpha + beta * valueUnderlying + collateralBalanceLong)
    ) / tokenSupply

  return payoffLong // The function returns the product of p1 and p2
}

// Generating the xy values for the chart based on option parameters
// Note that all numeric values are stored with 18 decimals in the contracts
// i.e., you would simply have to divide the values you get from db by 1e18
const collateralBalanceShort = 50 // not yet available in the database
const collateralBalanceLong = 50 // not yet available in the database
let floor = 32000
let cap = 37000
const strike = 34500
const longPositionTokenSupply = 100

if (collateralBalanceShort === 0) {
  cap = strike
}
if (collateralBalanceLong === 0) {
  floor = strike
}

// Test some output values

// Aux range function
const range = (start, stop, step) =>
  Array.from({ length: (stop - start) / step + 1 }, (_, i) => start + i * step)

let xMin = 30000 // we need to find a logic how to make this part dynamic
let xMax = 39000 // we need to find a logic how to make this part dynamic

const xValues = range(xMin, xMax, 100)
const yValues = xValues.map((xValues) =>
  payoffFunctionLong(
    xValues,
    collateralBalanceLong,
    collateralBalanceShort,
    floor,
    strike,
    cap,
    longPositionTokenSupply
  )
)

// Generage object array containing xy values
let data = []
for (let i = 0; i < xValues.length; i++) {
  data.push({ x: xValues[i], y: yValues[i] })
}

// Plot the data
export default function PayOffChart() {
  return (
    <XYPlot height={300} width={400}>
      <HorizontalGridLines />
      <XAxis
        title="WBTC/USDC"
        position="middle"
        style={{
          title: {
            fontWeight: 800,
          },
        }}
      />
      <YAxis
        title="DAI"
        position="middle"
        style={{
          title: {
            fontWeight: 800,
          },
        }}
      />
      <LineSeries data={data} />
    </XYPlot>
  )
}

/* Line chart for Markets tab
export default function App() {
  return (
    <XYPlot height={300} width={400}>
      <LineSeries data={data} />
    </XYPlot>
  );
}
*/
