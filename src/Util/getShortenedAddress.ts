export function getShortenedAddress(address: string) {
  const begin = address.slice(0, 6)
  const end = address.slice(address.length - 4)

  return `${begin}...${end}`
}
