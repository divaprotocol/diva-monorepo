import styled from 'styled-components'
import '../../Util/Dates'
import { IconButton, Link, Stack, Tooltip, Typography } from '@mui/material'
import AddCircleIcon from '@mui/icons-material/AddCircle'
import { getExploreLink, EtherscanLinkType } from '../../Util/getEtherscanLink'
import {
  getShortenedAddress,
  shortenString,
} from '../../Util/getShortenedAddress'
import { CoinIconPair } from '../CoinIcon'
import { useAppSelector } from '../../Redux/hooks'
import {
  selectChainId,
  selectPool,
  selectUnderlyingPrice,
} from '../../Redux/appSlice'
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

export default function OptionHeader(optionData: {
  TokenAddress: string
  ReferenceAsset: string
  tokenSymbol: string
  poolId: string
  tokenDecimals: number
}) {
  const chainId = useAppSelector(selectChainId)

  const params: { poolId: string; tokenType: string } = useParams()
  const pool = useAppSelector((state) => selectPool(state, params.poolId))
  const { TokenAddress, tokenSymbol } = optionData
  const headerTitle = optionData.ReferenceAsset
  const { sendTransaction } = useConnectionContext()

  const handleAddMetaMask = async () => {
    try {
      await sendTransaction({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: TokenAddress,
            symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
            decimals: optionData.tokenDecimals,
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
      <Stack direction="column">
        <Stack direction="row">
          <CoinIconPair assetName={headerTitle} isLargeIcon />
          <Tooltip title={headerTitle} placement="right">
            <Typography
              variant="h1"
              sx={{
                ml: '20px',
                transform: 'translateY(-20%)',
              }}
            >
              {shortenString(headerTitle)}
            </Typography>
          </Tooltip>
        </Stack>
        <Stack direction="row" ml="100px" mt="-10px">
          <Tooltip title="Add to Metamask">
            <IconButton
              sx={{
                w: '14px',
                h: '14px',
                mt: '-8px',
                ml: '-7px',
                color: '#929292',
              }}
              onClick={handleAddMetaMask}
            >
              <AddCircleIcon />
            </IconButton>
          </Tooltip>
          <Link
            sx={{ color: 'gray' }}
            underline={'none'}
            rel="noopener noreferrer"
            target="_blank"
            href={getExploreLink(
              chainId,
              optionData.TokenAddress,
              EtherscanLinkType.ADDRESS
            )}
          >
            {shortenTokenAddress}
          </Link>
          <Typography fontSize="14px" color="#929292" pl="10px" mt="1px">
            ({tokenSymbol})
          </Typography>
          {/* <IconButton
            onClick={() =>
              navigator.clipboard.writeText(optionData.TokenAddress)
            }
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
          </IconButton> */}
        </Stack>
      </Stack>
    </AppHeader>
  )
}
