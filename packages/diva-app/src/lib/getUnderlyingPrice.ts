import CoinGecko from 'coingecko-api'

interface coin {
  id: string
  symbol?: string | undefined
  name?: string
}

// Ignore assets list for CoinGecko, need to be updated
const COIN_GECKO_IGNORE_ASSETS = ['GOLD', 'TSLA', 'Dom', 'BYAC', 'MEMES']

export const getUnderlyingPrice = async (underlyingAssets: string) => {
  const CoinGeckoClient = new CoinGecko()
  const [asset, vsAssets] = underlyingAssets.split('/')
  let assetPriceUsd: any
  let vsAssetPriceUsd: any

  if (
    COIN_GECKO_IGNORE_ASSETS.includes(asset) ||
    COIN_GECKO_IGNORE_ASSETS.includes(vsAssets)
  ) {
    return undefined
  }

  if (asset && vsAssets) {
    try {
      const coinsList = await (
        await fetch('https://api.coingecko.com/api/v3/coins/list')
      ).json()

      const getCoinIdFromSymbol = (coinSymbol: string) => {
        const { id } = coinsList.filter(
          ({ symbol }: coin) =>
            symbol?.toLowerCase() === coinSymbol.toLowerCase()
        )[0]

        return id
      }
      const assetPriceData = await CoinGeckoClient.simple.price({
        ids: getCoinIdFromSymbol(asset),
        vs_currencies: 'usd',
      })

      const vsAssetPriceData = await CoinGeckoClient.simple.price({
        ids: getCoinIdFromSymbol(vsAssets),
        vs_currencies: 'usd',
      })

      if (assetPriceData.data && vsAssetPriceData.data) {
        Object.keys(assetPriceData.data).map(
          (k) => (assetPriceUsd = assetPriceData.data[k].usd)
        )
        Object.keys(vsAssetPriceData.data).map(
          (k) => (vsAssetPriceUsd = vsAssetPriceData.data[k].usd)
        )
      }
      if (vsAssets.toUpperCase() === 'USD') {
        return assetPriceUsd?.toFixed(2)
      }
      return (assetPriceUsd / vsAssetPriceUsd).toFixed(2)
    } catch (e) {
      // This error mostly occurs if there are too may requests,
      //return undefined to handle this case it will prevent app from crashing
      console.error('error ' + e)
      return undefined
    }
  }
}
