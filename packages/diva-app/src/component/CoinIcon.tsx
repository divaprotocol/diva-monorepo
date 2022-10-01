import { LocalGasStation } from '@mui/icons-material'
import { Box } from '@mui/material'
import { useState } from 'react'
import { useCoinIcon } from '../hooks/useCoinIcon'

import localCoinImages from '../Util/localCoinImages.json'
const assetLogoPath = '/images/coin-logos/'
const existsLocally = (file: string) => localCoinImages.includes(file)

type prop = {
  asset?: string
  assetName?: string
  isLargeIcon?: boolean
}

const Placeholder = ({ asset }: prop) => {
  return (
    <svg height="100%" overflow="visible" viewBox="4 0 30 30">
      <circle
        cx="20"
        cy="20"
        dx="-0.5em"
        z="2"
        r="16"
        stroke="black"
        fill="#00CCF3"
      />
      <text
        x="66%"
        y="70%"
        textAnchor="middle"
        fill="white"
        fontSize="20px"
        dy=".3em"
      >
        {asset.charAt(0)}
      </text>
    </svg>
  )
}

const CoinIcon = ({ assetName }: prop) => {
  let imgSrc = useCoinIcon(assetName)
  const [showPlaceholder, setShowPlaceholder] = useState(false)
  if (showPlaceholder || imgSrc == null) {
    return <Placeholder asset={assetName} />
  } else if (assetName.includes('Gas')) {
    return <LocalGasStation />
  } else if (existsLocally(assetName + '.png')) {
    imgSrc = assetLogoPath + assetName.toUpperCase() + '.png'
  }

  return (
    <img
      alt={assetName}
      src={imgSrc}
      onError={() => {
        setShowPlaceholder(true)
      }}
      style={{ display: 'block', height: '100%' }}
    />
  )
}

export const CoinIconPair = ({ assetName, isLargeIcon }: prop) => {
  const assets = assetName.split('/')

  if (assets.length === 1) {
    return (
      <Box
        sx={{
          height: `${isLargeIcon ? 45 : 30}`,
        }}
      >
        <CoinIcon assetName={assets[0]} />
      </Box>
    )
  } else if (assets.length === 2) {
    return (
      <>
        <Box
          sx={{
            height: `${isLargeIcon ? '45px' : '30px'}`,
          }}
        >
          <CoinIcon assetName={assets[0]} />
        </Box>
        <Box
          marginLeft={-1}
          sx={{
            height: `${isLargeIcon ? '45px' : '30px'}`,
          }}
        >
          <CoinIcon assetName={assets[1]} />
        </Box>
      </>
    )
  }
}
