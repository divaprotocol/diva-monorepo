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

export const getColorByStatus = (status: string) => {
  switch (status) {
    case 'Expired':
      return {
        backgroundColor: 'rgba(237, 108, 2, 0.4)',
        fontColor: '#F2994A',
      }
    case 'Submitted':
      return {
        backgroundColor: 'rgba(22, 46, 66, 0.6)',
        fontColor: '#3393E0',
      }
    case 'Challenged':
      return {
        backgroundColor: 'rgba(69, 70, 23, 0.6)',
        fontColor: '#F2C94C',
      }
    case 'Confirmed*':
      return {
        backgroundColor: 'rgba(22, 46, 66, 0.6)',
        fontColor: '#3393E0',
      }
    case 'Confirmed':
      return {
        backgroundColor: 'rgba(37, 57, 27, 0.6)',
        fontColor: '#6FCF97',
      }
    case 'Fallback':
      return {
        backgroundColor: 'rgba(49, 22, 70, 0.6)',
        fontColor: '#9B51E0',
      }
    case 'Open':
      return {
        backgroundColor: 'rgba(22, 46, 66, 0.6)',
        fontColor: '#ffffff',
      }
    default:
      return {
        backgroundColor: 'rgba(51, 147, 224, 0.4)',
        fontColor: '#ffffff',
      }
  }
}

export function extractHash(fullString: string): string {
  const parts = fullString.split('-')
  return parts[0] // returns the first part before the "-"
}
