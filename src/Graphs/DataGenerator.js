// Payoff function for call and put options (see whitepaper for more formulas)
// Note that same terminology is used for call and put options (strike, inflection, cap)
function generatePayoffFunction(
    CollateralBalanceLong,
    CollateralBalanceShort,
    Inflection,
    Cap,
    TokenSupply,
    IsLong) {
    
    const payoffFunction = function(valueUnderlying) {  
        let beta = 0;
        let collateralBalance = 0;
        let sign = 0;
  
        if (IsLong) {
          collateralBalance = CollateralBalanceLong;
          sign = 1;
        } else {
          collateralBalance = CollateralBalanceShort;
          sign = -1;
        }
  
        // we should probably also normalize it, i.e. not have collateralBalance as the input
  
        // valueUnderlying is the variable here for a given option
        if (valueUnderlying >= Inflection) {
          beta = (sign * CollateralBalanceShort) / (Cap - Inflection);
        } else {
          beta = (sign * CollateralBalanceLong) / (Inflection - Cap);
        }
        
        const alpha = -Inflection * beta;
  
        const payoff = 
            Math.min(
              CollateralBalanceShort + CollateralBalanceLong,
              Math.max(0, alpha + beta * valueUnderlying + collateralBalance)
            ) / TokenSupply;
        
        return payoff;
  
        // const payoffValues = {
        //   yCap: payoff(cap),
        //   yInflection: payoff(inflection),
        //   yStrike: payoff(strike)
        // }

    }
  
    return payoffFunction;
}
  
export default function generatePayoffChartData(data) {
    //const optionData = data.data.option
    const optionData = data
    console.log(data)
    const payoffFunction = generatePayoffFunction(
      100,
      100,
      optionData.Inflection,
      optionData.Cap,
      200,
      optionData.IsLong);

    if (optionData.IsLong === true) {
    const chartData = [
        {"x": optionData.Strike * 0.85, "y": 0},
        {"x": optionData.Strike, "y": 0},
        {"x": optionData.Inflection, "y": payoffFunction(optionData.Inflection)},
        {"x": optionData.Cap, "y": payoffFunction(optionData.Cap)},
        {"x": optionData.Cap * 1.15, "y": payoffFunction(optionData.Cap)}
    ]
    return chartData;
    } else {
    const chartData = [
        {"x": optionData.Strike * 1.15, "y": 0},
        {"x": optionData.Strike, "y": 0},
        {"x": optionData.Inflection, "y": payoffFunction(optionData.Inflection)},
        {"x": optionData.Cap, "y": payoffFunction(optionData.Cap)},
        {"x": optionData.Cap * 0.85, "y": payoffFunction(optionData.Cap)}
    ]
    return chartData;
    }
}

// export default generatePayoffChartData;
  
  