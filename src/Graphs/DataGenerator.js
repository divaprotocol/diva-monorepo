// Payoff function for call and put options (see whitepaper for more formulas)
// Note that same terminology is used for call and put options (strike, inflection, cap)
function generatePayoffFunction(
  CollateralBalanceLong,
  CollateralBalanceShort,
  Strike,
  Inflection,
  Cap,
  TokenSupply,
  IsLong) {
  
  const payoffFunction = function(valueUnderlying) {  
      let beta = 0;
      let sign = 0;
      let payoff;
      let alpha;

      if (IsLong) {
        sign = 1;
        if (Cap === Inflection) {
          if (valueUnderlying <= Inflection) {
            beta = (sign * CollateralBalanceLong) / (Inflection - Strike);
            alpha = -Inflection * beta;
            payoff = Math.min(
              CollateralBalanceShort + CollateralBalanceLong,
              Math.max(0, alpha + beta * valueUnderlying + CollateralBalanceLong)
            ) / TokenSupply;
          } else {
            payoff = (CollateralBalanceShort + CollateralBalanceLong) / TokenSupply;
          } 
        } else if (Strike === Inflection) {
          if (valueUnderlying >= Inflection) {
            beta = (sign * CollateralBalanceShort) / (Cap - Inflection);
            alpha = -Inflection * beta;
            payoff = Math.min(
              CollateralBalanceShort + CollateralBalanceLong,
              Math.max(0, alpha + beta * valueUnderlying + CollateralBalanceLong)
            ) / TokenSupply;
          } else {
            payoff = 0
          }
        } else if (Cap === Inflection && Strike === Inflection) {
          if (valueUnderlying > Inflection) {
            payoff = (CollateralBalanceShort + CollateralBalanceLong) / TokenSupply;
          } else if (valueUnderlying === Inflection) {
            payoff = CollateralBalanceLong / TokenSupply;
          } 
          else {
            payoff = 0;
          }
        } else {
          if (valueUnderlying >= Inflection) {
            beta = (sign * CollateralBalanceShort) / (Cap - Inflection);
            alpha = -Inflection * beta;
            payoff = Math.min(
              CollateralBalanceShort + CollateralBalanceLong,
              Math.max(0, alpha + beta * valueUnderlying + CollateralBalanceLong)
            ) / TokenSupply;
          } else {
            beta = (sign * CollateralBalanceLong) / (Inflection - Strike);
            alpha = -Inflection * beta;
            payoff = Math.min(
              CollateralBalanceShort + CollateralBalanceLong,
              Math.max(0, alpha + beta * valueUnderlying + CollateralBalanceLong)
            ) / TokenSupply;
          }
        }
      } else {
        sign = -1;
        if (Strike === Inflection) {
          if (valueUnderlying <= Inflection) {
            beta = (sign * CollateralBalanceLong) / (Inflection - Cap);
            alpha = -Inflection * beta;
            payoff = Math.min(
              CollateralBalanceShort + CollateralBalanceLong,
              Math.max(0, alpha + beta * valueUnderlying + CollateralBalanceShort)
            ) / TokenSupply;
          } else {
            payoff = 0;
          } 
        } else if (Cap === Inflection) {
          if (valueUnderlying >= Inflection) {
            beta = (sign * CollateralBalanceShort) / (Strike - Inflection);
            alpha = -Inflection * beta;
            payoff = Math.min(
              CollateralBalanceShort + CollateralBalanceLong,
              Math.max(0, alpha + beta * valueUnderlying + CollateralBalanceShort)
            ) / TokenSupply;
          } else {
            payoff = (CollateralBalanceShort + CollateralBalanceLong) / TokenSupply;
          }
        } else if (Cap === Inflection && Strike === Inflection) {
          if (valueUnderlying > Inflection) {
            payoff = 0;
          } else if (valueUnderlying === Inflection) {
            payoff = CollateralBalanceShort / TokenSupply;
          } 
          else {
            payoff = (CollateralBalanceShort + CollateralBalanceLong) / TokenSupply;
          }
        } else {
          if (valueUnderlying >= Inflection) {
            beta = (sign * CollateralBalanceShort) / (Strike - Inflection);
            alpha = -Inflection * beta;
            payoff = Math.min(
              CollateralBalanceShort + CollateralBalanceLong,
              Math.max(0, alpha + beta * valueUnderlying + CollateralBalanceShort)
            ) / TokenSupply;
          } else {
            beta = (sign * CollateralBalanceLong) / (Inflection - Cap);
            alpha = -Inflection * beta;
            payoff = Math.min(
              CollateralBalanceShort + CollateralBalanceLong,
              Math.max(0, alpha + beta * valueUnderlying + CollateralBalanceShort)
            ) / TokenSupply;
          }
        }
      }

      return payoff;
  }

  return payoffFunction;
}

export default function generatePayoffChartData(data) {

  const optionData = data
  const CollateralBalanceLong = 100 // temporarily hard-coded
  const CollateralBalanceShort = 100 // temporarily hard-coded
  const TokenSupply = 200 // temporarily hard-coded

  const payoffFunction = generatePayoffFunction(
    CollateralBalanceLong,
    CollateralBalanceShort,
    optionData.Strike,
    optionData.Inflection,
    optionData.Cap,
    TokenSupply,
    optionData.IsLong);
  
  if (optionData.IsLong === true) {
  const chartData = [
      {"x": optionData.Strike - optionData.Cap * 0.15, "y": 0},
      {"x": optionData.Strike, "y": 0},
      {"x": optionData.Inflection, "y": payoffFunction(optionData.Inflection)},
      {"x": optionData.Cap, "y": (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply},
      {"x": optionData.Cap*1.15, "y": (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply}
  ]
  return chartData;
  } else {
  const chartData = [
      {"x": optionData.Cap - optionData.Strike * 0.15, "y": (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply},
      {"x": optionData.Cap, "y": (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply},
      {"x": optionData.Inflection, "y": payoffFunction(optionData.Inflection)},
      {"x": optionData.Strike, "y": 0},
      {"x": optionData.Strike * 1.15, "y": 0}
    
  ]
  console.log("chart data: " + chartData[0])
  return chartData;
  
  }
}
