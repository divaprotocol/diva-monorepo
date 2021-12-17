export function generatePayoffChartData(data) {
  const optionData = data
  const CollateralBalanceLong = 100 // temporarily hard-coded
  const CollateralBalanceShort = 100 // temporarily hard-coded
  const TokenSupply = 200 // temporarily hard-coded

  let chartData = []

  if (optionData.IsLong === true) {
    chartData = [
      { x: optionData.Strike - optionData.Cap * 0.15, y: 0 },
      { x: optionData.Strike, y: 0 },
      { x: optionData.Inflection, y: CollateralBalanceLong / TokenSupply },
      {
        x: optionData.Cap,
        y: (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply,
      },
      {
        x: optionData.Cap * 1.15,
        y: (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply,
      },
    ]
  } else {
    chartData = [
      {
        x: optionData.Cap - optionData.Strike * 0.15,
        y: (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply,
      },
      {
        x: optionData.Cap,
        y: (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply,
      },
      { x: optionData.Inflection, y: CollateralBalanceShort / TokenSupply },
      { x: optionData.Strike, y: 0 },
      { x: optionData.Strike * 1.15, y: 0 },
    ]
  }

  console.log({
    data,
    chartData,
  })
  return chartData
}
