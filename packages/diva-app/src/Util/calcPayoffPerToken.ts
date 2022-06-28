import { parseEther, parseUnits } from 'ethers/lib/utils'
import { BigNumber as BigENumber } from '@ethersproject/bignumber/lib/bignumber'
import { convertExponentialToDecimal } from '../component/Trade/Orders/OrderHelper'

// Returned values are expressed as integers with collateral token decimals
export function calcPayoffPerToken(
  floor,
  inflection,
  cap,
  collateralBalanceLongInitial,
  collateralBalanceShortInitial,
  finalReferenceValue,
  supplyInitial,
  collateralTokenDecimals
) {
  const SCALING = parseUnits('1', 18 - collateralTokenDecimals)
  const UNIT = parseEther('1')

  const collateralBalanceLongInitialScaled =
    collateralBalanceLongInitial.mul(SCALING)
  const collateralBalanceShortInitialScaled =
    collateralBalanceShortInitial.mul(SCALING)

  let payoffLong

  if (finalReferenceValue.eq(inflection)) {
    payoffLong = collateralBalanceLongInitialScaled
  } else if (finalReferenceValue.lt(inflection)) {
    if ((cap.eq(inflection) && floor.eq(inflection)) || floor.eq(inflection)) {
      payoffLong = BigENumber.from(0)
    } else {
      if (finalReferenceValue.gt(floor)) {
        payoffLong = collateralBalanceLongInitialScaled
          .mul(finalReferenceValue.sub(floor))
          .div(inflection.sub(floor))
      } else {
        payoffLong = BigENumber.from(0)
      }
    }
  } else {
    if ((cap.eq(inflection) && floor.eq(inflection)) || inflection.eq(cap)) {
      payoffLong = collateralBalanceLongInitialScaled.add(
        collateralBalanceShortInitialScaled
      )
    } else {
      if (finalReferenceValue.lt(cap)) {
        payoffLong = collateralBalanceLongInitialScaled.add(
          collateralBalanceShortInitialScaled
            .mul(finalReferenceValue.sub(inflection))
            .div(cap.sub(inflection))
        )
      } else {
        payoffLong = collateralBalanceLongInitialScaled.add(
          collateralBalanceShortInitialScaled
        )
      }
    }
  }
  const payoffShort = collateralBalanceLongInitialScaled
    .add(collateralBalanceShortInitialScaled)
    .sub(payoffLong)

  const payoffPerLongToken = payoffLong
    .mul(UNIT)
    .div(supplyInitial)
    .div(SCALING)
  const payoffPerShortToken = payoffShort
    .mul(UNIT)
    .div(supplyInitial)
    .div(SCALING)

  return { payoffPerLongToken, payoffPerShortToken }
}

export function calcBreakEven(
  price,
  floor,
  inflection,
  cap,
  collateralBalanceLongInitial,
  collateralBalanceShortInitial,
  isLong
) {
  const UNIT = parseEther('1')

  // Convert inputs into Big Numbers
  price = parseEther(convertExponentialToDecimal(price))
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
