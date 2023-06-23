export function getShortenedAddress(
  address: string,
  beginLength = 6,
  endLength = 4
) {
  if (address != null) {
    const begin = address.slice(0, beginLength)
    const end = address.slice(address.length - endLength)

    return `${begin}...${end}`
  } else return ''
}
