const { parseEther, parseUnits } = require('@ethersproject/units')

// Returns payoff per long and short token in collateral token decimals
function calcPayoffPerToken(
    floor,
    inflection,
    cap,
    collateralBalanceLongInitial, 
    collateralBalanceShortInitial,
    collateralBalance, 
    finalReferenceValue,
    supplyPositionToken,
    collateralTokenDecimals
) {
    
    const SCALING = parseUnits('1', 18 - collateralTokenDecimals)
    const UNIT = parseEther('1')
    
    collateralBalanceLongScaled = collateralBalance.mul(collateralBalanceLongInitial).div(collateralBalanceLongInitial.add(collateralBalanceShortInitial)).mul(SCALING)
    collateralBalanceShortScaled = (collateralBalance).mul(SCALING).sub(collateralBalanceLongScaled)

    if (finalReferenceValue.eq(inflection)) {
        payoffLong = collateralBalanceLongScaled;
    } else if (finalReferenceValue.lt(inflection)) {
        if ((cap.eq(inflection) && floor.eq(inflection)) || (floor.eq(inflection))) {
            payoffLong = BigNumber.from(0);
        } else {
            if (finalReferenceValue.gt(floor)) {
                payoffLong = collateralBalanceLongScaled.mul(finalReferenceValue.sub(floor)).div(inflection.sub(floor)); 
            } else {                                                                                                        
                payoffLong = BigNumber.from(0);
            }
        } 
    } else {
        if ((cap.eq(inflection) && floor.eq(inflection)) || (inflection.eq(cap))) {
            payoffLong = collateralBalanceLongScaled.add(collateralBalanceShortScaled);
        } else {
            if (finalReferenceValue.lt(cap)) {
                payoffLong = collateralBalanceLongScaled.add(collateralBalanceShortScaled.mul(finalReferenceValue.sub(inflection)).div(cap.sub(inflection)))
            } else {                                                                                           
                payoffLong = collateralBalanceLongScaled.add(collateralBalanceShortScaled);                    
            }
        } 
    } 
    payoffShort = collateralBalanceLongScaled.add(collateralBalanceShortScaled).sub(payoffLong);            

    payoffPerLongToken = payoffLong.mul(UNIT).div(supplyPositionToken).div(SCALING);
    payoffPerShortToken = payoffShort.mul(UNIT).div(supplyPositionToken).div(SCALING);

    return {payoffPerLongToken, payoffPerShortToken}; 
}

// Calculate amount to return given payoff per token and number of tokens to redeem
// Output in collateral token decimals
function calcPayout(
    payoffPerToken,          // integer expressed with collateral token decimals
    tokensToRedeem,          // integer expressed with 18 decimals
    collateralTokenDecimals
) {
    
    const SCALING = parseUnits('1', 18 - collateralTokenDecimals)
    const UNIT = parseEther('1')
    
    payout = payoffPerToken.mul(SCALING).mul(tokensToRedeem).div(UNIT).div(SCALING)

    return payout;
}

// Fee in collateral token decimals
function calcFee(
    fee,                    // integer expressed with 18 decimals
    collateralBalance,       // integer expressed with collateral token decimals
    collateralTokenDecimals
) {
    const SCALING = parseUnits('1', 18 - collateralTokenDecimals)
    const UNIT = parseEther('1')

    fee = fee.mul(collateralBalance).mul(SCALING).div(UNIT).div(SCALING) 

    return fee;
}


exports.calcPayoffPerToken = calcPayoffPerToken;
exports.calcPayout = calcPayout;
exports.calcFee = calcFee;