export function toExponentialOrNumber(
  number: number,
  expDecimals = 2,
  decDecimals = 4
): string {
  const formattedNumber = number.toString().includes('e')
    ? number.toExponential(expDecimals)
    : number.toFixed(decDecimals)
  return formattedNumber
}
