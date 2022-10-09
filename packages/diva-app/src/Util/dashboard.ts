export const getTopNObjectByProperty = (
  rows,
  propertyName: string,
  count: number
) => {
  const underlyingTokens = rows
    .map((row) => row[propertyName])
    .filter((value, index: number, self) => self.indexOf(value) === index)
  const underlyingTokensWithCount = underlyingTokens.map((token) => {
    return {
      token,
      count: rows.filter((row) => row[propertyName] === token).length,
    }
  })
  const sortedUnderlyingTokens = underlyingTokensWithCount.sort(
    (a, b) => b.count - a.count
  )
  return sortedUnderlyingTokens.slice(0, count)
}
