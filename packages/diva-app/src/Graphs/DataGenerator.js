export function generatePayoffChartData(data, currentPrice) {
  // TODO Consider renaming "currentPrice" to "currentUnderlyingValue"
  const optionData = data
  const Gradient = data.Gradient

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
      { x: optionData.Inflection, y: Gradient },
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
      { x: optionData.Inflection, y: 1 - Gradient },
      { x: optionData.Cap, y: 0 },
      { x: maxXValue(), y: 0 },
    ]
  }
  return chartData
}
