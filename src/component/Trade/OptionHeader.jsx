import React from 'react'
import styled from 'styled-components';
import '../../Util/Dates'



const AppHeader = styled.header`
    background-color: white;
    min-height: 10vh;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    color: #f8f8f8;
`;

const OptionTitle = styled.h2`
    font-size: 1rem;
    color: black;
    padding: 15px;
`;

const Image = styled.img`
    height: 3.5vmin;
    width: 6vmin;
    margin-left: 50px;
    pointer-events: none;
`;


const ImgDiv = styled.div`
    display : flex;
    flex-direction : row;
    justify-content: center;
`;
const LeftAssetImg = styled.img`
    flex : 1;
    height: 6vmin;
    width: 6vmin;
    margin-left: 50px;
`
const RightAssetImg = styled.img`
    flex : 1;
    height: 6vmin;
    width: 6vmin;
    margin-left: 1px;
`

const refAssetImgs = [
    {refAsset : "ETH/USDT", img0 : "/images/coin-logos/ETH.png", img1 : "/images/coin-logos/USDT.png"},
    {refAsset : "UNI/DAI", img0 : "/images/coin-logos/UNI.png", img1 : "/images/coin-logos/DAI.png"}
];

function renderRefImgs(assetName) {
    if(assetName === 'ETH Gas Price') {
        return(<Image src={'/images/coin-logos/ETH.png'} alt="ReactApp"/>)
    } else {
        const asset = refAssetImgs.find(asset => asset.refAsset === assetName)
        console.log(asset)
        return(
            <ImgDiv>
                <LeftAssetImg src={asset.img0} alt="ReactApp"/>
                <RightAssetImg src={asset.img1} alt="ReactApp"/>
            </ImgDiv>
        )
    }

}

export default function OptionHeader(props) {
    const option = props.optionData
    const headerTitle = option.ReferenceAsset

    return(
        <AppHeader>
            {renderRefImgs(headerTitle)}
            <OptionTitle>{headerTitle}</OptionTitle>
        </AppHeader>
    );
}