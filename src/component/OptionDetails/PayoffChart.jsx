import React from 'react'

function createData(assetName) {
    const assets = assetName.split('/')
    console.log(assets)

    if(assets.length === 1) {
        console.log(assetLogoPath + assets[0]+ '.png')
        return(<Image src={assetLogoPath + assets[0]+ '.png'} alt="ReactApp"/>)
    } else if (assets.length === 2) {
        return(
            <ImgDiv>
                <LeftAssetImg src={assetLogoPath + assets[0]+ '.png'}  alt="ReactApp"/>
                <RightAssetImg src={assetLogoPath + assets[1]+ '.png'}  alt="ReactApp"/>
            </ImgDiv>
        )
    } else {
        return(<Image src="" alt="NA"/>)
    }
}

function createOptionRowDisplay(data) {
    const expiryStr = getDateTime(data.ExpiryDate)
    const rowDisplay = {
        id : data.optionId,
        underlying : data.ReferenceAsset,
        payoutProfile : "TBD",
        strike : data.Strike,
        inflection : data.Inflection,
        cap : data.Cap,
        expiry : expiryStr,
        sell : "TBD",
        buy : "TBD",
        maxYield : "TBD",
        tvl : "TBD"
    }
    return rowDisplay;     
  }

export default function Option(props) {
    const dispatch = useDispatch()
    const history = useHistory();
    const option = props.option
    const displayRow = createOptionRowDisplay(props.option)

    const handleRowSelect = () => {
        //Set raw option Data as app state
        dispatch(setTradingOption(option))
        console.log("Id "+props.option)
        history.push(`trade/${option.OptionId}`)
    }
    return(
        <TableRow onClick={handleRowSelect}>
            <TableCell align="right">{renderRefImgs(displayRow.underlying)}</TableCell>
            <TableCell component="th" scope="row">
                {displayRow.underlying}
            </TableCell>
            <TableCell align="center">{displayRow.payoutProfile}</TableCell>
            <TableCell align="right">{displayRow.strike}</TableCell>
            <TableCell align="right">{displayRow.inflection}</TableCell>
            <TableCell align="right">{displayRow.cap}</TableCell>
            <TableCell align="right">{displayRow.expiry}</TableCell>
            <TableCell align="right"><SellSpan >{displayRow.sell}</SellSpan></TableCell>
            <TableCell align="right"><BuySpan>{displayRow.buy}</BuySpan></TableCell>
            <TableCell align="right">{displayRow.maxYield}</TableCell>
            <TableCell align="right">{displayRow.tvl}</TableCell>
        </TableRow>
    );
}
