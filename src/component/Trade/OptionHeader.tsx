import React from 'react'
import styled from 'styled-components'
import '../../Util/Dates'
import { IconButton, Link } from '@mui/material'
import {
  getEtherscanLink,
  EtherscanLinkType,
} from '../../Util/getEtherscanLink'
import { useWeb3React } from '@web3-react/core'
const AppHeader = styled.header`
  min-height: 10vh;
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

function renderRefImgs(assetName: string) {
  if (assetName === 'ETH Gas Price') {
    return <Image src={'/images/coin-logos/ETH.png'} alt="ReactApp" />
  } else {
    const asset = refAssetImgs.find((asset) => asset.refAsset === assetName)
    return (
      <ImgDiv>
        <LeftAssetImg src={asset?.img0} alt="ReactApp" />
        <RightAssetImg src={asset?.img1} alt="ReactApp" />
      </ImgDiv>
    )
  }
}

export default function OptionHeader(optionData: {
  TokenAddress: string
  ReferenceAsset: string
}) {
  //const option = props.optionData
  const { chainId } = useWeb3React()
  const headerTitle = optionData.ReferenceAsset
  const assets = headerTitle.split('/')
  return (
    <AppHeader>
      <svg width="60" height="30">
        <circle cx="20" cy="15" r="15" stroke="black" fill="#060" />
        <text
          x="33%"
          y="55%"
          text-anchor="middle"
          fill="white"
          font-size="20px"
          font-family="Arial"
          dy=".3em"
        >
          {assets[0].charAt(0)}
        </text>
        <circle cx="40" cy="15" r="15" stroke="black" fill="#060" />
        <text
          x="66%"
          y="55%"
          text-anchor="middle"
          fill="white"
          font-size="20px"
          font-family="Arial"
          dy=".3em"
        >
          {assets[1].charAt(0)}
        </text>
      </svg>
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
    </AppHeader>
  )
}
