import styled from 'styled-components'
import '../../Util/Dates'
import { IconButton, Link } from '@mui/material'
import {
  getEtherscanLink,
  EtherscanLinkType,
} from '../../Util/getEtherscanLink'
import Tooltip from '@mui/material/Tooltip'
import { getShortenedAddress } from '../../Util/getShortenedAddress'
import { CoinIconPair } from '../CoinIcon'
import { useAppSelector } from '../../Redux/hooks'
import { priceSelector } from '../../Redux/poolSlice'
import { useParams } from 'react-router-dom'
import { useConnectionContext } from '../../hooks/useConnectionContext'

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
export default function OptionHeader(optionData: {
  TokenAddress: string
  ReferenceAsset: string
  isLong: boolean
  poolId: string
  tokenDecimals: number
}) {
  const { chainId, provider } = useConnectionContext()
  const params: { poolId: string; tokenType: string } = useParams()
  const headerTitle = optionData.ReferenceAsset
  const underlyingAssetPrice = useAppSelector((state) =>
    priceSelector(state, params.poolId)
  )

  const handleAddMetaMask = async () => {
    const { TokenAddress, isLong, tokenDecimals } = optionData
    const tokenSymbol = isLong
      ? `L${optionData.poolId}`
      : `S${optionData.poolId}`

    try {
      await provider.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: TokenAddress,
            symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: 18,
            image:
              'https://res.cloudinary.com/dphrdrgmd/image/upload/v1641730802/image_vanmig.png',
          },
        },
      } as any)
    } catch (error) {
      console.error('Error in HandleAddMetaMask', error)
    }
  }

  const shortenTokenAddress = getShortenedAddress(optionData.TokenAddress)

  return (
    <AppHeader>
      <Container>
        <CoinIconPair assetName={headerTitle} />
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
