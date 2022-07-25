export function generatePayoffChartData(data, currentPrice) {
  const optionData = data
  const CollateralBalanceLong = data.CollateralBalanceLong // temporarily hard-coded
  const CollateralBalanceShort = data.CollateralBalanceShort // temporarily hard-coded
  const TokenSupply = data.TokenSupply // temporarily hard-coded

  const minXValue = () => {
    if (!isNaN(currentPrice)) {
      return optionData.Floor < currentPrice
        ? optionData.Floor - optionData.Cap * 0.15
        : currentPrice - optionData.Cap * 0.15
    } else {
      return optionData.Floor - optionData.Cap * 0.15
    }
  }
  const maxXValue = () => {
    if (!isNaN(currentPrice)) {
      return optionData.Cap <= currentPrice
        ? currentPrice * 1.15
        : optionData.Cap * 1.15
    } else {
      return optionData.Cap * 1.15
    }
  }
  let chartData = []
  if (optionData.IsLong === true) {
    chartData = [
      { x: minXValue(), y: 0 },
      { x: optionData.Floor, y: 0 },
      { x: optionData.Inflection, y: CollateralBalanceLong / TokenSupply },
      {
        x: optionData.Cap,
        y: 1,
      },
      {
        x: maxXValue(),
        y: 1,
      },
    ]
  } else {
    chartData = [
      {
        x: minXValue(),
        y: 1,
      },
      {
        x: optionData.Floor,
        y: 1,
      },
      { x: optionData.Inflection, y: CollateralBalanceShort / TokenSupply },
      { x: optionData.Cap, y: 0 },
      { x: maxXValue(), y: 0 },
    ]
  }
  return chartData
}
