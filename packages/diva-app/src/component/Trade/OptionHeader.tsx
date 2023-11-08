import styled from 'styled-components'
import '../../Util/Dates'
import {
  Box,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
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
import { sendAddAssetTransaction } from '../../Util/walletUtils'
import LaunchIcon from '@mui/icons-material/Launch'

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
  JsonHeaderTitle?: string
}) {
  const chainId = useAppSelector(selectChainId)

  const params: { poolId: string; tokenType: string } = useParams()
  const pool = useAppSelector((state) => selectPool(state, params.poolId))
  const { TokenAddress, tokenSymbol } = optionData
  const headerTitle = optionData.JsonHeaderTitle
    ? optionData.JsonHeaderTitle
    : optionData.ReferenceAsset
  const { sendTransaction } = useConnectionContext()
  const isJson = optionData.ReferenceAsset.endsWith('.json')

  const handleAddMetaMask = async () => {
    const options = {
      address: TokenAddress,
      symbol: tokenSymbol,
      decimals: optionData.tokenDecimals,
      image:
        'https://res.cloudinary.com/dphrdrgmd/image/upload/v1641730802/image_vanmig.png',
    }

    await sendAddAssetTransaction(sendTransaction, options)
  }

  const shortenTokenAddress = getShortenedAddress(optionData.TokenAddress)

  return (
    <AppHeader>
      <Stack direction={'row'}>
        <Stack
          direction="row"
          gap={3}
          sx={{
            width: 'fit-content',
            height: '45px',
          }}
        >
          <CoinIconPair assetName={headerTitle} isLargeIcon />
        </Stack>

        <Stack>
          <Stack direction={'row'} alignItems={'center'}>
            <Tooltip title={headerTitle} placement="top">
              <Typography
                variant="h1"
                sx={{
                  ml: '20px',
                }}
              >
                {optionData.JsonHeaderTitle
                  ? headerTitle
                  : shortenString(headerTitle)}
              </Typography>
            </Tooltip>
            {isJson && (
              <Tooltip title={'Link for Asset'}>
                <a href={optionData.ReferenceAsset} target="_blank">
                  <LaunchIcon
                    sx={{
                      color: '#929292',
                      fontSize: '24px',
                      ml: '10px',
                      mt: '5px',
                    }}
                  />
                </a>
              </Tooltip>
            )}
          </Stack>

          <Stack direction="row" alignItems={'center'} ml="10px" mt="6px">
            <Tooltip title="Add to Metamask">
              <IconButton
                sx={{
                  w: '14px',
                  h: '14px',
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
      </Stack>
    </AppHeader>
  )
}
