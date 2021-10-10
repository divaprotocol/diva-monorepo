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
      let _Floor, _Cap, payoffLong, payoffShort, payoff;

      if (IsLong) {
        _Floor = Strike
      } else {
        _Floor = Cap
        _Cap = Strike        
      }

      console.log("Floor: " + _Floor)
      console.log("Inflection: " + Inflection)
      console.log("Cap: " + _Cap)


      if (valueUnderlying === Inflection) {
        payoff = CollateralBalanceLong;
      } else if (valueUnderlying < Inflection) {
        if ((_Cap === Inflection && _Floor == Inflection) || (_Floor === Inflection)) {
          payoffLong = 0;
        } else {
            if (valueUnderlying > _Floor) {
              payoffLong = CollateralBalanceLong * (valueUnderlying - _Floor) / (Inflection - _Floor);
            } else {
              payoffLong = 0;
            }
        }
      } else {
        if ((_Cap === Inflection && _Floor == Inflection) || (Inflection === _Cap)) {
          payoffLong = CollateralBalanceLong + CollateralBalanceShort;
        } else {
            if (valueUnderlying < _Cap) {
              payoffLong = CollateralBalanceLong + CollateralBalanceShort * (valueUnderlying - Inflection) / (_Cap - Inflection);
            } else {
              payoffLong = CollateralBalanceLong + CollateralBalanceShort;
            }
        }
      }

      payoffShort = CollateralBalanceLong + CollateralBalanceShort - payoffLong;

      if (IsLong) {
        return payoff = payoffLong / TokenSupply;
      } else {
        return payoff = payoffShort / TokenSupply;
      }
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
      {"x": optionData.Inflection, "y": CollateralBalanceLong / TokenSupply},
      {"x": optionData.Cap, "y": (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply},
      {"x": optionData.Cap*1.15, "y": (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply}
  ]
  return chartData;
  } else {
  const chartData = [
      {"x": optionData.Cap - optionData.Strike * 0.15, "y": (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply},
      {"x": optionData.Cap, "y": (CollateralBalanceLong + CollateralBalanceShort) / TokenSupply},
      {"x": optionData.Inflection, "y": CollateralBalanceShort / TokenSupply},
      {"x": optionData.Strike, "y": 0},
      {"x": optionData.Strike * 1.15, "y": 0}
    
  ]
  console.log("chart data: " + chartData[0])
  return chartData;
  
  }
}
