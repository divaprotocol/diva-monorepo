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

export function getFutureExpiryInSeconds(minutesFromNow: number): string {
  return Math.floor(Date.now() / 1000 + minutesFromNow * 60).toString()
}

export function isAdminUser(userAddress, chainId, config) {
  if (!userAddress) {
    return false
  }

  const adminAddresses = config[chainId]?.adminAddresses || []
  return adminAddresses.some(
    (adminAddress) => adminAddress.toLowerCase() === userAddress.toLowerCase()
  )
}
