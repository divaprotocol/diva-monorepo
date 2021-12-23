import coin_list from './coin_list.json'
export function getIconSrc(tokenTicker: string) {
  let notFound = true
  if (tokenTicker.toLowerCase() === 'eth') {
    return 'https://tokens.1inch.exchange/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png'
  } else {
    if (tokenTicker.toLowerCase() === 'btc') {
      tokenTicker = 'wbtc'
    }
    for (const coin of coin_list) {
      if (coin.symbol === tokenTicker.toLowerCase()) {
        notFound = false
        return (
          'https://tokens.1inch.exchange/' + coin.platforms.ethereum + '.png'
        )
      }
    }
    if (notFound) {
      return ''
    }
  }
}
