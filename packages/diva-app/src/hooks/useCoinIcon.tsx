import { useQuery } from 'react-query'
import { Tokens } from '../lib/types'

export function useCoinIcon(_symbol?: string) {
  const symbol = _symbol?.toLowerCase()
  const tokens = useQuery<Tokens>('tokens', () =>
    fetch('/tokenSymbols.json').then((res) => res.json())
  )

  if (tokens.isSuccess && symbol != null) {
    let address = tokens.data[symbol]

    if (symbol === 'eth') {
      address = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    } else if (symbol === 'btc') {
      address = tokens.data['wbtc']
    }

    if (address != null) return `https://tokens.1inch.exchange/${address}.png`
  }
}
