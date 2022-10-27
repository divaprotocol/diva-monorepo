import { parseUnits } from 'ethers/lib/utils'
import { BigNumber as BigENumber } from '@ethersproject/bignumber/lib/bignumber'
import { convertExponentialToDecimal } from '../component/Trade/Orders/OrderHelper'

// Returned values are expressed as integers with collateral token decimals
export function calcPayoffPerToken(
  floor,
  inflection,
  cap,
  gradient,
  finalReferenceValue,
  collateralTokenDecimals
) {
  const SCALING = parseUnits('1', 18 - collateralTokenDecimals)
  const UNIT = parseUnits('1')

  const gradientScaled = gradient.mul(SCALING)

  let payoffPerLongToken

  if (finalReferenceValue.eq(inflection)) {
    payoffPerLongToken = gradientScaled
  } else if (finalReferenceValue.lte(floor)) {
    payoffPerLongToken = 0
  } else if (finalReferenceValue.gte(cap)) {
    payoffPerLongToken = UNIT
  } else if (finalReferenceValue.lt(inflection)) {
    payoffPerLongToken = gradientScaled
      .mul(finalReferenceValue.sub(floor))
      .div(inflection.sub(floor))
  } else if (finalReferenceValue.gt(inflection)) {
    payoffPerLongToken = gradientScaled.add(
      UNIT.sub(gradientScaled)
        .mul(finalReferenceValue.sub(inflection))
        .div(cap.sub(inflection))
    )
  }

  const payoffPerShortToken = UNIT.sub(payoffPerLongToken)

  return { payoffPerLongToken, payoffPerShortToken }
}

export function calcBreakEven(
  price, // TODO rename to underlyingValue
  floor,
  inflection,
  cap,
  collateralBalanceLongInitial,
  collateralBalanceShortInitial,
  isLong
) {
  const UNIT = parseUnits('1')

  // Convert inputs into Big Numbers
  floor = BigENumber.from(floor)
  inflection = BigENumber.from(inflection)
  cap = BigENumber.from(cap)
  collateralBalanceLongInitial = BigENumber.from(collateralBalanceLongInitial)
  collateralBalanceShortInitial = BigENumber.from(collateralBalanceShortInitial)

  // Calculate gradient
  const gradient = collateralBalanceLongInitial
    .mul(UNIT)
    .div(collateralBalanceLongInitial.add(collateralBalanceShortInitial))

  let breakEven

  if (price.gt(UNIT) || price.lt(BigENumber.from(0))) {
    breakEven = 'n/a'
  } else {
    if (isLong) {
      if (price.eq(gradient)) {
        breakEven = inflection
      } else if (price.lt(gradient)) {
        breakEven = price.mul(inflection.sub(floor)).div(gradient).add(floor)
      } else {
        breakEven = price
          .sub(gradient)
          .mul(cap.sub(inflection))
          .div(UNIT.sub(gradient))
          .add(inflection)
      }
    } else {
      if (price.eq(UNIT.sub(gradient))) {
        breakEven = inflection
      } else if (price.gt(UNIT.sub(gradient))) {
        breakEven = UNIT.sub(price)
          .mul(inflection.sub(floor))
          .div(gradient)
          .add(floor)
      } else {
        breakEven = UNIT.sub(price)
          .sub(gradient)
          .mul(cap.sub(inflection))
          .div(UNIT.sub(gradient))
          .add(inflection)
      }
    }
  }

  return breakEven
}
