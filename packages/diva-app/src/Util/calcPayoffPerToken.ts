import { parseUnits } from 'ethers/lib/utils'
import { BigNumber } from '@ethersproject/bignumber/lib/bignumber'

// Returned values are expressed as integers with collateral token decimals
/**
 * @dev Function to return the gross payoff per long and short token for a given
 * payoff profile and a final reference value.
 * @param floor Floor of the payoff curve expressed as an integer with 18 decimals
 * @param inflection Inflection of the payoff curve expressed as an integer with 18 decimals
 * @param cap Cap of the payoff curve expressed as an integer with 18 decimals
 * @param gradient Gradient of the payoff curve expressed as an integer with collateral token decimals
 * @param finalReferenceValue Final reference value expressed as an integer with 18 decimals
 * @param collateralTokenDecimals Collateral token decimals
 * @returns Payoff per long and short position token expressed as an integer with collateral token decimals
 */
export function calcPayoffPerToken(
  floor: BigNumber,
  inflection: BigNumber,
  cap: BigNumber,
  gradient: BigNumber,
  finalReferenceValue: BigNumber,
  collateralTokenDecimals: number
): { payoffPerLongToken: BigNumber; payoffPerShortToken: BigNumber } {
  const SCALING = parseUnits('1', 18 - collateralTokenDecimals)
  const UNIT = parseUnits('1')

  // Scale gradient to 18 decimals for calculation purposes as floor, inflection, etc.
  // have 18 decimals
  const gradientScaled = gradient.mul(SCALING)

  let payoffPerLongToken: BigNumber
  let payoffPerShortToken: BigNumber

  if (finalReferenceValue.eq(inflection)) {
    payoffPerLongToken = gradientScaled
  } else if (finalReferenceValue.lte(floor)) {
    payoffPerLongToken = BigNumber.from(0)
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

  payoffPerShortToken = UNIT.sub(payoffPerLongToken)

  // Convert from 18 decimals to collateral token decimals
  payoffPerShortToken = payoffPerShortToken.div(SCALING)
  payoffPerLongToken = payoffPerLongToken.div(SCALING)

  return { payoffPerLongToken, payoffPerShortToken }
}

/**
 * @dev Function to calculate the value of the underlying metric at which
 * the cost for purchasing the position token and the payout cancel out.
 * Calculations are gross of fees.
 * @param price Position token price expressed as an integer with 18 decimals.
 * Should be a value between 0 and 1 (inclusive).
 * @param floor Floor of the payoff curve expressed as an integer with 18 decimals
 * @param inflection Inflection of the payoff curve expressed as an integer with 18 decimals
 * @param cap Cap of the payoff curve expressed as an integer with 18 decimals
 * @param gradient Gradient of the payoff curve expressed as an integer with collateral token decimals
 * @param isLong True if long position, false if short position
 * @param collateralTokenDecimals Collateral token decimals
 * @returns Break-even underlying value
 */
export function calcBreakEven(
  price,
  floor,
  inflection,
  cap,
  gradient,
  isLong,
  collateralTokenDecimals
) {
  const SCALING = parseUnits('1', 18 - collateralTokenDecimals)
  const UNIT = parseUnits('1')

  // Convert inputs into Big Numbers
  floor = BigNumber.from(floor)
  inflection = BigNumber.from(inflection)
  cap = BigNumber.from(cap)

  // Scale gradient to 18 decimals for calculation purposes as floor, inflection, etc.
  // have 18 decimals
  const gradientScaled = gradient.mul(SCALING)

  let breakEven

  if (price.gt(UNIT) || price.lt(BigNumber.from(0))) {
    breakEven = 'n/a'
  } else {
    if (isLong) {
      if (price.eq(gradientScaled)) {
        breakEven = inflection
      } else if (price.lt(gradientScaled)) {
        breakEven = price
          .mul(inflection.sub(floor))
          .div(gradientScaled)
          .add(floor)
      } else {
        breakEven = price
          .sub(gradientScaled)
          .mul(cap.sub(inflection))
          .div(UNIT.sub(gradientScaled))
          .add(inflection)
      }
    } else {
      if (price.eq(UNIT.sub(gradientScaled))) {
        breakEven = inflection
      } else if (price.gt(UNIT.sub(gradientScaled))) {
        breakEven = UNIT.sub(price)
          .mul(inflection.sub(floor))
          .div(gradientScaled)
          .add(floor)
      } else {
        breakEven = UNIT.sub(price)
          .sub(gradientScaled)
          .mul(cap.sub(inflection))
          .div(UNIT.sub(gradientScaled))
          .add(inflection)
      }
    }
  }

  return breakEven
}
