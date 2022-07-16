export function generatePayoffChartData(data, currentPrice) {
  const optionData = data
  const CollateralBalanceLong = data.CollateralBalanceLong // temporarily hard-coded
  const CollateralBalanceShort = data.CollateralBalanceShort // temporarily hard-coded
  const TokenSupply = data.TokenSupply // temporarily hard-coded
  // const xValue1 = () => {
  //   return optionData.Floor - optionData.Cap * 0.18 <= currentPrice
  //     ? currentPrice
  //     : optionData.Floor - optionData.Cap * 0.18 ||
  //         optionData.Floor - optionData.Cap * 0.18
  // }
  let chartData = []

  if (optionData.IsLong === true) {
    chartData = [
      { x: optionData.Floor - optionData.Cap * 0.15, y: 0 },
      { x: optionData.Floor, y: 0 },
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
        x: optionData.Floor - optionData.Cap * 0.15,
        y: (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply,
      },
      {
        x: optionData.Floor,
        y: (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply,
      },
      { x: optionData.Inflection, y: CollateralBalanceShort / TokenSupply },
      { x: optionData.Cap, y: 0 },
      { x: optionData.Cap * 1.15, y: 0 },
    ]
  }
  return chartData
}
