import React from 'react'
import styled from 'styled-components'
import '../../Util/Dates'
import { useSelector } from 'react-redux'

const AppHeader = styled.header`
  background-color: white;
  min-height: 10vh;
  display: flex;
  flex-direction: row;
  align-items: center;
  color: #f8f8f8;
`

const OptionTitle = styled.h2`
  font-size: 1rem;
  color: black;
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

function renderRefImgs(assetName) {
  if (assetName === 'ETH Gas Price') {
    return <Image src={'/images/coin-logos/ETH.png'} alt="ReactApp" />
  } else {
    const asset = refAssetImgs.find((asset) => asset.refAsset === assetName)
    return (
      <ImgDiv>
        <LeftAssetImg src={asset.img0} alt="ReactApp" />
        <RightAssetImg src={asset.img1} alt="ReactApp" />
      </ImgDiv>
    )
  }
}

export default function OptionHeader() {
  //const option = props.optionData
  const selectedOption = useSelector((state) => state.tradeOption.option)
  const headerTitle = selectedOption.ReferenceAsset
  return (
    <AppHeader>
      {renderRefImgs(headerTitle)}
      <OptionTitle>{headerTitle}</OptionTitle>
    </AppHeader>
  )
}
