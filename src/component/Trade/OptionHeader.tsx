import React from 'react'
import styled from 'styled-components'
import '../../Util/Dates'
import { Link } from '@mui/material'
import {
  getEtherscanLink,
  EtherscanLinkType,
} from '../../Util/getEtherscanLink'
import { useWeb3React } from '@web3-react/core'
import { CopyToClipboard } from '../shared/CopyToClipboard'
import { CoinImage } from '../PoolsTable'
const AppHeader = styled.header`
  min-height: 10vh;
  padding-left: 1em;
  display: flex;
  flex-direction: row;
  align-items: center;
`

const OptionTitle = styled.h2`
  font-size: 1rem;
  padding: 15px;
`

const Image = styled.img`
  height: 3.5vmin;
  width: 3.5vmin;
  pointer-events: none;
  justify-content: center;
  margin-left: 10px;
`

const ImgDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  margin-left: 15px;
`
const LeftAssetImg = styled.img`
  flex: 1;
  height: 3.5vmin;
  width: 3.5vmin;
`
const RightAssetImg = styled.img`
  flex: 1;
  height: 3.5vmin;
  width: 3.5vmin;
  margin-left: 1px;
`

const refAssetImgs = [
  {
    refAsset: 'ETH/USDT',
    img0: '/images/coin-logos/ETH.png',
    img1: '/images/coin-logos/USDT.png',
  },
  {
    refAsset: 'UNI/DAI',
    img0: '/images/coin-logos/UNI.png',
    img1: '/images/coin-logos/DAI.png',
  },
]

export default function OptionHeader(optionData: {
  TokenAddress: string
  ReferenceAsset: string
}) {
  //const option = props.optionData
  const { chainId } = useWeb3React()
  const headerTitle = optionData.ReferenceAsset
  return (
    <AppHeader>
      <CoinImage assetName={headerTitle} />
      <OptionTitle>{headerTitle}</OptionTitle>
      <Link
        style={{ color: 'gray' }}
        underline={'none'}
        rel="noopener noreferrer"
        target="_blank"
        href={getEtherscanLink(
          chainId,
          optionData.TokenAddress,
          EtherscanLinkType.ADDRESS
        )}
      >
        {optionData.TokenAddress}
      </Link>
      <CopyToClipboard textToCopy={optionData.TokenAddress} />
    </AppHeader>
  )
}
