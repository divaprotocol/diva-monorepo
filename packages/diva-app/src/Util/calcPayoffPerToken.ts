import { parseEther, parseUnits } from 'ethers/lib/utils'
import { BigNumber as BigENumber } from '@ethersproject/bignumber/lib/bignumber'

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
  let payoffLong = BigENumber.from(0)
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
