import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import '../../Util/Dates'
import { IconButton, Link } from '@mui/material'
import {
  getEtherscanLink,
  EtherscanLinkType,
} from '../../Util/getEtherscanLink'
import { CoinImage } from '../PoolsTable'
import Tooltip from '@mui/material/Tooltip'
import { useWallet } from '@web3-ui/hooks'
import { getUnderlyingPrice } from '../../lib/getUnderlyingPrice'

const AppHeader = styled.header`
  min-height: 10vh;
  padding-left: 1em;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const Container = styled.div`
  display: flex;
  align-items: center;
`

const OptionTitle = styled.h2`
  font-size: 1rem;
  padding: 15px;
`

const MetaMaskImage = styled.img`
  width: 20px;
  height: 20px;
  cursor: pointer;
  margin-right: 10px;
`

const AssetPriceUsd = styled.div`
  font-weight: bold;
  padding-left: 15px;
`
function truncate(string = '', start = 6, end = 4) {
  if (start < 1 || end < 1) {
    return string
  }
  if (string.length <= start + end) {
    return string
  }
  return string.slice(0, start) + '...' + string.slice(-end)
}
export default function OptionHeader(optionData: {
  TokenAddress: string
  ReferenceAsset: string
  isLong: boolean
  poolId: string
  tokenDecimals: number
}) {
  const wallet = useWallet()
  const chainId = wallet?.provider?.network?.chainId
  const headerTitle = optionData.ReferenceAsset
  const [underlyingAssetPrice, setUnderlyingAssetPrice] = useState<
    string | undefined
  >(undefined)

  const handleAddMetaMask = async () => {
    const { TokenAddress, isLong, tokenDecimals } = optionData
    const tokenSymbol = isLong
      ? `L-${optionData.poolId}`
      : `S-${optionData.poolId}`

    try {
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: TokenAddress,
            symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: tokenDecimals,
            image:
              'https://res.cloudinary.com/dphrdrgmd/image/upload/v1641730802/image_vanmig.png',
          },
        },
      })
    } catch (error) {
      console.error('Error in HandleAddMetaMask', error)
    }
  }

  useEffect(() => {
    getUnderlyingPrice(optionData.ReferenceAsset).then((data) => {
      setUnderlyingAssetPrice(data)
    })

    return () => setUnderlyingAssetPrice(undefined)
  }, [optionData.ReferenceAsset])
  const shortenTokenAddress = truncate(optionData.TokenAddress)

  return (
    <AppHeader>
      <Container>
        <CoinImage assetName={headerTitle} />
        <OptionTitle>{headerTitle}</OptionTitle>

        {underlyingAssetPrice && (
          <AssetPriceUsd>{underlyingAssetPrice}</AssetPriceUsd>
        )}
      </Container>
      <Container>
        <Link
          style={{ color: 'gray' }}
          underline={'none'}
          rel="noopener noreferrer"
          target="_blank"
          href={getEtherscanLink(
            chainId,
            shortenTokenAddress,
            EtherscanLinkType.ADDRESS
          )}
        >
          {shortenTokenAddress}
        </Link>
        <IconButton
          onClick={() => navigator.clipboard.writeText(optionData.TokenAddress)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="14"
            viewBox="0 0 24 24"
            width="14"
          >
            <path d="M0 0h24v24H0z" fill="none" />
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
          </svg>
        </IconButton>
        <Tooltip title="Add to Metamask">
          <MetaMaskImage
            src="/images/metamask.svg"
            alt="metamask"
            onClick={handleAddMetaMask}
          />
        </Tooltip>
      </Container>
    </AppHeader>
  )
}
