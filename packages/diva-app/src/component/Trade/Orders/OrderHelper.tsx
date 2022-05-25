function descendingComparator(a: any, b: any, orderBy: any) {
  if (b[orderBy] < a[orderBy]) {
    return -1
  }
  if (b[orderBy] > a[orderBy]) {
    return 1
  }
  return 0
}

export function getComparator(order: any, orderBy: any) {
  if (order === 'ascOrder') {
    return (a: any, b: any) => -descendingComparator(a, b, orderBy)
  }
  if (order === 'desOrder') {
    return (a: any, b: any) => descendingComparator(a, b, orderBy)
  }
}

export function stableSort(array: any, comparator: any) {
  const stabilizedThis = array.map((el: any, index: any) => [el, index])
  stabilizedThis.sort((a: any, b: any) => {
    const order = comparator(a[0], b[0])
    if (order !== 0) {
      return order
    }
    return a[1] - b[1]
  })
  return stabilizedThis.map((el: any) => el[0])
}

export const isFloat = (number) => {
  if (number.toString().indexOf('e') !== -1) {
    // Return true if float number is represented in exponential format
    return true
  } else {
    return number != '' && !isNaN(number) && Math.round(number) != number
  }
}

// Source: https://blog.davidjs.com/2018/07/convert-exponential-numbers-to-decimal-in-javascript/
export function convertExponentialToDecimal(
  exponentialNumber: number
): number | string {
  // Check whether number has exponential format
  const str = exponentialNumber.toString()
  if (str.indexOf('e') !== -1) {
    const exponent = parseInt(str.split('-')[1], 10)
    // Unfortunately I can not return 1e-8 as 0.00000001, because even if I call parseFloat() on it,
    // it will still return the exponential representation
    // So I have to use .toFixed()
    const result = exponentialNumber.toFixed(exponent)
    return result
  } else {
    return exponentialNumber
  }
}

export const decimalPlaces = (number) => {
  number = convertExponentialToDecimal(number) // returns the number in number format if it's not exponential
  return number.toString().split('.')?.[1].length
}

export const totalDecimals = (a: number, b: number) => {
  const aDecimals = isFloat(a) ? decimalPlaces(a) : 0
  const bDecimals = isFloat(b) ? decimalPlaces(b) : 0
  return aDecimals + bDecimals
}
