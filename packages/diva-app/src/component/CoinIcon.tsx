import { LocalGasStation } from '@mui/icons-material'
import { Box, Stack } from '@mui/material'
import { useState } from 'react'
import { useCoinIcon } from '../hooks/useCoinIcon'

import localCoinImages from '../Util/localCoinImages.json'
const assetLogoPath = '/images/coin-logos/'
const existsLocally = (file: string) => localCoinImages.includes(file)

type CoinProps = {
  asset?: string
  assetName?: string
  isLargeIcon?: boolean
}

const Placeholder = ({ asset }: CoinProps) => {
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
        {asset.charAt(0).toUpperCase()}
      </text>
    </svg>
  )
}

const CoinIcon = ({ assetName }: CoinProps) => {
  let component
  let imgSrc = useCoinIcon(assetName)
  const [showPlaceholder, setShowPlaceholder] = useState(false)

  if (showPlaceholder || imgSrc == null) {
    component = <Placeholder asset={assetName} />
  } else if (assetName.includes('Gas')) {
    component = <LocalGasStation />
  } else if (existsLocally(assetName + '.png')) {
    imgSrc = assetLogoPath + assetName.toUpperCase() + '.png'
    component = (
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

  return component
}

const IconBox = ({ assetName, isLargeIcon }: CoinProps) => (
  <Box
    sx={{
      height: isLargeIcon ? '45px' : '30px',
      display: 'flex',
    }}
  >
    <CoinIcon assetName={assetName} />
  </Box>
)

export const CoinIconPair = ({ assetName, isLargeIcon }: CoinProps) => {
  const assets = assetName.split('/')
  const isJson = assetName.endsWith('.json')

  // Single asset or .json file
  if (assets.length === 1 || isJson) {
    return <IconBox assetName={assets[0]} isLargeIcon={isLargeIcon} />
  }

  // Two assets
  if (assets.length === 2) {
    return (
      <Stack direction="row">
        <IconBox assetName={assets[0]} isLargeIcon={isLargeIcon} />
        <Box marginLeft={-1}>
          <IconBox assetName={assets[1]} isLargeIcon={isLargeIcon} />
        </Box>
      </Stack>
    )
  }

  // Fallback
  console.warn('Invalid assetName passed to CoinIconPair:', assetName)
  return <Placeholder assetName={'?'} />
}
