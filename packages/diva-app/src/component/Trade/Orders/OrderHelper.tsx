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

const isFloat = (number) => {
  return number != '' && !isNaN(number) && Math.round(number) != number
}
const decimalPlaces = (number) => {
  return number.toString().split('.')?.[1].length
}

export const totalDecimals = (a: number, b: number) => {
  const aDecimals = isFloat(a) ? decimalPlaces(a) : 0
  const bDecimals = isFloat(b) ? decimalPlaces(b) : 0
  return aDecimals + bDecimals
}
