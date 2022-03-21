// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "./SafeDecimalMath.sol";
import "./LibDiamond.sol";
import "../interfaces/IPositionToken.sol";

library LibDIVA {
    using SafeDecimalMath for uint256;

    /**
     * @notice Function to calculate the collateral amount to return
     * (gross of fees) during `removeLiquidity`. For example, sending back 10%
     * of the position token supply will return 10% of the pool collateral.
     * @dev As position tokens have 18 decimals but collateral tokens may have
     * less, scaling needs to be applied when using `SafeDecimalMath` library.
     * @param  _amountPositionToken Amount of long and short position tokens
     * that the user sends back expressed as an integer with 18 decimals.
     * @param  _collateralBalance Initial pool collateral balance.
     * expressed as an integer with in collateral token decimals (18 or less).
     * @param _supplyPositionToken Initial short and long token supply
     * expressed as an integer with 18 decimals.
     * @param _collateralTokenDecimals Collateral token decimals.
     * @return Collateral amount to be returned expressed as an integer with
     * collateral token decimals (18 or less).
     */
    function _calcRedemptionAmount(
        uint256 _amountPositionToken,
        uint256 _collateralBalance,
        uint256 _supplyPositionToken,
        uint8 _collateralTokenDecimals
    ) internal pure returns (uint256) {
        // `_SCALINGFACTOR` required to scale up collateral token amounts as `SafeDecimalMath` library assumes integers with 18 decimals as input values
        uint256 _SCALINGFACTOR = uint256(10**(SafeDecimalMath.decimals - _collateralTokenDecimals));

        uint256 _redemptionAmount = (_amountPositionToken.multiplyDecimal(_collateralBalance * _SCALINGFACTOR)).divideDecimal(_supplyPositionToken) /
            _SCALINGFACTOR;
        return _redemptionAmount;
    }

    /**
     * @notice Function to calculate the fee amount given a redemption amount.
     * @dev Output is an integer expressed in collateral token decimals.
     * As position tokens have 18 decimals but collateral tokens may have
     * less, scaling needs to be applied when using `SafeDecimalMath` library.
     * @param _fee Percentage fee expressed as an integer with 18 decimals;
     * e.g., 0.25% is 2500000000000000.
     * @param _redemptionAmount Overall redemption amount (not per token)
     * gross of fees expressed as an integer with collateral token
     * decimals (18 or less).
     * @param _collateralTokenDecimals Collateral token decimals.
     * @return The fee amount expressed as an integer in collateral token
     * decimals (18 or less).
     */
    function _calcFee(
        uint256 _fee,
        uint256 _redemptionAmount,
        uint8 _collateralTokenDecimals
    ) internal pure returns (uint256) {
        // `_SCALINGFACTOR` required to scale up collateral token amounts as `SafeDecimalMath` library assumes integers with 18 decimals as input values
        uint256 _SCALINGFACTOR = uint256(10**(SafeDecimalMath.decimals - _collateralTokenDecimals));

        uint256 _feeCollateralToken = _fee.multiplyDecimal(_redemptionAmount * _SCALINGFACTOR) / _SCALINGFACTOR;
        return _feeCollateralToken;
    }

    /**
     * @notice Function to calculate the additional long and short token
     * supply to be issued given the additional collateral amount to be
     * deposited.
     * @dev Additional token supply is calculated based on initial pool
     * values as those cannot go to zero. As position tokens have 18 decimals
     * but collateral tokens may have less, scaling needs to be applied when
     * using `SafeDecimalMath` library.
     * @param  _supplyPositionToken Initial long and short token supply
     * expressed as an integer with 18 decimals.
     * @param  _collateralBalance Initial pool collateral balance expressed
     * as an integer with collateral token decimals (18 or less).
     * @param _collateralTokenDecimals Collateral token decimals.
     * @param _collateralAmountIncr Incremental collateral amount added to
     * the pool expressed as an integer with collateral token
     * decimals (18 or less).
     * @return Incremental long and short token supply expressed as an integer
     * with 18 decimals.
     */
    function _calcSupplyPositionTokenIncr(
        uint256 _supplyPositionToken,
        uint256 _collateralBalance,
        uint8 _collateralTokenDecimals,
        uint256 _collateralAmountIncr
    ) internal pure returns (uint256) {
        // `_SCALINGFACTOR` required to scale up collateral token amounts as `SafeDecimalMath` library assumes integers with 18 decimals as input values
        uint256 _SCALINGFACTOR = uint256(10**(SafeDecimalMath.decimals - _collateralTokenDecimals));

        uint256 _supplyPositionTokenIncr = (_supplyPositionToken.multiplyDecimal(_collateralAmountIncr * _SCALINGFACTOR)).divideDecimal(
            _collateralBalance * _SCALINGFACTOR
        );
        return _supplyPositionTokenIncr;
    }

    /**
     * @notice Function to calculate the overall payoffs of long and short
     * positions. Calculation per token happens in SettlementFacet. In special
     * cases like floor = inflection, inflection = cap or
     * floor = inflection = cap the original funding amounts will be paid out
     * when finalReferenceValue = inflection.
     * @dev collateral balance inputs are scaled to 18 decimals to make the
     * `SafeDecimalMath` work. Return values are also in 18 decimals, i.e.
     * the need to be divided by the scaling factor in the code.
     * @param _floor Value of the underlying asset at which all collateral
     * from the long pool will be credited into the short pool.
     * @param _inflection Value of the underlying asset at which collateral
     * pool balances remain unchanged.
     * @param _cap Value of the underlying asset at which all collateral from
     * the short pool will be credited into the long pool.
     * @param _collateralBalanceLongInitial Initial long pool collateral balance
     * expressed as an integer in collateral token decimals.
     * @param _collateralBalanceShortInitial Initial short pool collateral balance
     * expressed as an integer in collateral token decimals.
     * @param _collateralBalance Current pool collateral balance expressed
     * as an integer in collateral token decimals.
     * @param _finalReferenceValue Final value submitted by data feed provider.
     * @param _collateralTokenDecimals Collateral token decimals.
     * @return payoffShort Payoff per short and long position token.
     * @return payoffLong Payoff per short and long position token.
     */
    function _calcPayoffs(
        uint256 _floor,
        uint256 _inflection,
        uint256 _cap,
        uint256 _collateralBalanceLongInitial,
        uint256 _collateralBalanceShortInitial,
        uint256 _collateralBalance,
        uint256 _finalReferenceValue,
        uint256 _collateralTokenDecimals
    ) internal pure returns (uint256 payoffShort, uint256 payoffLong) {
        uint256 _SCALINGFACTOR = uint256(10**(SafeDecimalMath.decimals - _collateralTokenDecimals));
        uint256 _collateralBalanceLongScaled = ((_collateralBalance * _SCALINGFACTOR).multiplyDecimal(_collateralBalanceLongInitial * _SCALINGFACTOR))
            .divideDecimal((_collateralBalanceLongInitial + _collateralBalanceShortInitial) * _SCALINGFACTOR);
        uint256 _collateralBalanceShortScaled = _collateralBalance * _SCALINGFACTOR - _collateralBalanceLongScaled;

        if (_finalReferenceValue == _inflection) {
            payoffLong = _collateralBalanceLongScaled;
        } else if (_finalReferenceValue < _inflection) {
            if ((_cap == _inflection && _floor == _inflection) || (_floor == _inflection)) {
                payoffLong = 0;
            } else {
                if (_finalReferenceValue > _floor) {
                    payoffLong = (_collateralBalanceLongScaled.multiplyDecimal(_finalReferenceValue - _floor)).divideDecimal(_inflection - _floor);
                } else {
                    payoffLong = 0;
                }
            }
        } else {
            if ((_cap == _inflection && _floor == _inflection) || (_inflection == _cap)) {
                payoffLong = _collateralBalanceLongScaled + _collateralBalanceShortScaled;
            } else {
                if (_finalReferenceValue < _cap) {
                    payoffLong =
                        _collateralBalanceLongScaled +
                        (_collateralBalanceShortScaled.multiplyDecimal(_finalReferenceValue - _inflection)).divideDecimal(_cap - _inflection);
                } else {
                    payoffLong = _collateralBalanceLongScaled + _collateralBalanceShortScaled;
                }
            }
        }

        payoffShort = _collateralBalanceLongScaled + _collateralBalanceShortScaled - payoffLong;

        return (payoffShort, payoffLong);
    }

    /**
     * @notice Internal function to calculate the payoff per long and short
     * token (net of fees) and store it in `redemptionAmountLongToken` and
     * `redemptionAmountShortToken` inside pool parameters.
     *
     * This function is called AFTER all fees have been deducated so that
     * `_pool.collateralBalance` represents the current pool collateral
     * balance after fees.
     * @dev Called inside {redeemPositionToken} and {setFinalReferenceValue}
     * functions after status of final reference value has been confirmed.
     * Status of final reference value is set to Confirmed via the following
     * three ways:
     * 1. By action of data provider (submits value without the possibility to
     * challenge or submits same value as before during review period).
     * 2. By action of the fallback data provider when the data provider fails
     * to submit a value.
     * 3. By first redemption if neither data provider nor fallback data
     * provider have provided their inputs.
     * @param _poolId The pool Id for which the redemption amounts are set.
     * @param _collateralTokenDecimals Collateral token decimals. Passed on as
     * argument to avoid reading from storage again.
     */
    function _setRedemptionAmount(uint256 _poolId, uint8 _collateralTokenDecimals) internal {
        // Get references to relevant storage slot
        LibDiamond.PoolStorage storage ps = LibDiamond.poolStorage();

        // Initialize Pool struct
        LibDiamond.Pool storage _pool = ps.pools[_poolId];

        // `_SCALINGFACTOR` required to scale up collateral token amounts as `SafeDecimalMath` library assumes integers with 18 decimals as input values
        uint256 _SCALINGFACTOR = uint256(10**(SafeDecimalMath.decimals - _collateralTokenDecimals));

        // Calculate overall payoff for short and long side. Output integers are expressed with 18 decimals.
        (uint256 _payoffShort, uint256 _payoffLong) = _calcPayoffs(
            _pool.floor,
            _pool.inflection,
            _pool.cap,
            _pool.collateralBalanceLongInitial,
            _pool.collateralBalanceShortInitial,
            _pool.collateralBalance,
            _pool.finalReferenceValue,
            _collateralTokenDecimals
        );

        // Calculate payoff per long and short token and store in pool parameters
        _pool.redemptionAmountLongToken = _payoffLong.divideDecimal(IPositionToken(_pool.longToken).totalSupply()) / _SCALINGFACTOR;
        _pool.redemptionAmountShortToken = _payoffShort.divideDecimal(IPositionToken(_pool.shortToken).totalSupply()) / _SCALINGFACTOR;
    }

    /**
     * @notice Internal function to calculate and allocate fee claims to
     * recipient (DIVA Treasury or data provider). Fee is applied
     * to the overall collateral remaining in the pool and allocated in
     * full when this function is triggered.
     * @dev Fees can be claimed via the `claimFees` function. Used within
     * `setFinalReferenceValue` and `redeemPositionToken` as fee amounts are
     * not needed for processing.
     * @param _poolId Pool Id to identify the collateral token.
     * @param _fee Fee amount expressed in percent (1e18 is 100%).
     * @param _recipient Fee recipient address.
     * @param _collateralBalance Current pool collateral balance.
     * @param _collateralTokenDecimals Collateral token decimals.
     */
    function _calcAndAllocateFeeClaim(
        uint256 _poolId,
        uint256 _fee,
        address _recipient,
        uint256 _collateralBalance,
        uint8 _collateralTokenDecimals
    ) internal {
        // Output value is in collateral decimals
        // Important: collateralBalance needs to be scaled up to 18 decimals in order for SafeDecimalMath to work
        uint256 _feeAmount = _calcFee(_fee, _collateralBalance, _collateralTokenDecimals);

        _allocateFeeClaim(_poolId, _recipient, _feeAmount);
    }

    /**
     * @notice Internal function to allocate fees to the corresponding
     * recipient.
     * @dev The balance of the recipient is tracked inside the contract
     * and can be claimed by the recipient by calling the `claimFees`
     * function. The pool collateral balance is reduced accordingly during
     * that process. Used inside `removeLiquidity` to calculate fees which
     * are then processed within the function.
     * @param _poolId Pool Id that fees apply to.
     * @param _recipient Recipient to allocate the fee to.
     * @param _feeAmount Fee amount expressed as an integer with 18 decimals.
     */
    function _allocateFeeClaim(
        uint256 _poolId,
        address _recipient,
        uint256 _feeAmount
    ) internal {
        // Get references to relevant storage slot
        LibDiamond.FeeClaimStorage storage fs = LibDiamond.feeClaimStorage();
        LibDiamond.PoolStorage storage ps = LibDiamond.poolStorage();

        // Initialize Pool struct
        LibDiamond.Pool storage _pool = ps.pools[_poolId];

        require(_feeAmount <= _pool.collateralBalance, "DIVA: fee amount exceeds pool collateral balance");

        _pool.collateralBalance -= _feeAmount;
        fs.claimableFeeAmount[_pool.collateralToken][_recipient] += _feeAmount;

        emit LibDiamond.FeeClaimAllocated(_poolId, _recipient, _feeAmount);
    }
}
