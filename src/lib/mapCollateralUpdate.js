export const mapCollateralUpdate = (allOptions, change) => {
  var newOptions = allOptions
  const data = change
  const index = allOptions.findIndex((option) => {
    return option.OptionSetId === data.OptionSetId
  })

  var updatedOption = Object.assign({}, allOptions[index])
  var collateralTotal = updatedOption.CollateralBalance
  collateralTotal += data.CollateralBalanceLong
  collateralTotal += data.CollateralBalanceShort
  updatedOption.CollateralBalance = collateralTotal

  const filter = allOptions.filter((option) => {
    return option.OptionSetId === data.OptionSetId
  })
  filter.forEach((option) => {
    const index = allOptions.indexOf(option)
    var optionProps = JSON.parse(JSON.stringify(option))
    optionProps.CollateralBalance = collateralTotal
    newOptions = [
      ...newOptions.slice(0, index),
      optionProps,
      ...newOptions.slice(index + 1),
    ]
  })
  return newOptions
}
