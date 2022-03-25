// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "../interfaces/IPositionToken.sol";
import "../interfaces/ISettlement.sol";
import "../libraries/SafeDecimalMath.sol";
import "../libraries/LibDIVA.sol";
import "@solidstate/contracts/utils/ReentrancyGuard.sol";

contract SettlementFacet is ISettlement, ReentrancyGuard {
    using SafeDecimalMath for uint256;

    function setFinalReferenceValue(
        uint256 _poolId,
        uint256 _finalReferenceValue,
        bool _allowChallenge
    ) external override {
        // Get references to relevant storage slots
        LibDiamond.PoolStorage storage ps = LibDiamond.poolStorage();
        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();

        // Initialize Pool struct
        LibDiamond.Pool storage _pool = ps.pools[_poolId];

        require(
            _pool.statusFinalReferenceValue == LibDiamond.Status.Open || _pool.statusFinalReferenceValue == LibDiamond.Status.Challenged,
            "DIVA: already submitted/confirmed"
        );

        uint8 _decimals;
        uint256 _collateralBalance;

        if (_pool.statusFinalReferenceValue == LibDiamond.Status.Open) {
            // Check that the contingent pool already expired
            require(block.timestamp >= _pool.expiryTime, "DIVA: pool not expired");
            uint256 submissionEndTime = _pool.expiryTime + gs.submissionPeriod;
            if (block.timestamp <= submissionEndTime) {
                // We are within the submission period. Check that the message sender is the data provider for the contract
                require(msg.sender == _pool.dataProvider, "DIVA: not data provider");
                // If challenge functionality is disabled the submitted final value is considered confirmed
                if (_allowChallenge == false) {
                    _pool.statusFinalReferenceValue = LibDiamond.Status.Confirmed;
                    _pool.finalReferenceValue = _finalReferenceValue;
                    _decimals = IERC20Metadata(_pool.collateralToken).decimals();
                    _collateralBalance = _pool.collateralBalance;
                    LibDIVA._calcAndAllocateFeeClaim(_poolId, _pool.redemptionFee, gs.treasury, _collateralBalance, _decimals);
                    LibDIVA._calcAndAllocateFeeClaim(_poolId, _pool.settlementFee, _pool.dataProvider, _collateralBalance, _decimals);
                    LibDIVA._setRedemptionAmount(_poolId, _decimals); // collateral balance is already after fees
                } else {
                    _pool.statusFinalReferenceValue = LibDiamond.Status.Submitted;
                    _pool.finalReferenceValue = _finalReferenceValue;
                }
            }
            // gs.fallbackSubmissionPeriod-day period for fallback data provider to provide reference value if respective data provider fails to do so
            else if ((block.timestamp > submissionEndTime && block.timestamp <= submissionEndTime + gs.fallbackSubmissionPeriod)) {
                require(msg.sender == gs.fallbackDataProvider, "DIVA: not fallback provider");
                _pool.statusFinalReferenceValue = LibDiamond.Status.Confirmed;
                _pool.finalReferenceValue = _finalReferenceValue;
                _decimals = IERC20Metadata(_pool.collateralToken).decimals();
                _collateralBalance = _pool.collateralBalance;
                LibDIVA._calcAndAllocateFeeClaim(_poolId, _pool.redemptionFee, gs.treasury, _collateralBalance, _decimals);
                LibDIVA._calcAndAllocateFeeClaim(_poolId, _pool.settlementFee, gs.fallbackDataProvider, _collateralBalance, _decimals);
                LibDIVA._setRedemptionAmount(_poolId, _decimals);
            }
            // If data provider and fallback do not provide the final reference value any value, anyone can trigger this function to
            // set and confirm the final reference value equal to inflection
            else {
                _pool.statusFinalReferenceValue = LibDiamond.Status.Confirmed;
                _pool.finalReferenceValue = _pool.inflection;
                _decimals = IERC20Metadata(_pool.collateralToken).decimals();
                LibDIVA._calcAndAllocateFeeClaim(_poolId, _pool.redemptionFee + _pool.settlementFee, gs.treasury, _pool.collateralBalance, _decimals); // all fee goes to DIVA treasury
                LibDIVA._setRedemptionAmount(_poolId, _decimals);
            }
            _pool.statusTimestamp = block.timestamp;
        } else if (_pool.statusFinalReferenceValue == LibDiamond.Status.Challenged) {
            uint256 reviewEndTime = _pool.statusTimestamp + gs.reviewPeriod;
            // No expiry end check needed here as status = "Challenged" cannot be before expiry end
            require(block.timestamp <= reviewEndTime, "DIVA: review period expired");
            // Check that the message sender is the data provider for the contract
            require(msg.sender == _pool.dataProvider, "DIVA: not data provider");
            // If challenge functionality is disabled or the data provider submits the same value
            // as before following a challenge, the submitted final value is considered confirmed
            if ((_allowChallenge == false) || (_finalReferenceValue == _pool.finalReferenceValue)) {
                _pool.statusFinalReferenceValue = LibDiamond.Status.Confirmed;
                _pool.finalReferenceValue = _finalReferenceValue;
                _decimals = IERC20Metadata(_pool.collateralToken).decimals();
                _collateralBalance = _pool.collateralBalance;
                LibDIVA._calcAndAllocateFeeClaim(_poolId, _pool.redemptionFee, gs.treasury, _collateralBalance, _decimals);
                LibDIVA._calcAndAllocateFeeClaim(_poolId, _pool.settlementFee, _pool.dataProvider, _collateralBalance, _decimals);
                LibDIVA._setRedemptionAmount(_poolId, _decimals);
            } else {
                _pool.statusFinalReferenceValue = LibDiamond.Status.Submitted;
                _pool.finalReferenceValue = _finalReferenceValue;
            }
            _pool.statusTimestamp = block.timestamp;
        }

        emit StatusChanged(_pool.statusFinalReferenceValue, msg.sender, _poolId, _pool.finalReferenceValue);
    }

    function challengeFinalReferenceValue(uint256 _poolId, uint256 _proposedFinalReferenceValue) external override {
        // Get references to relevant storage slots
        LibDiamond.PoolStorage storage ps = LibDiamond.poolStorage();
        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();

        // Initialize Pool struct
        LibDiamond.Pool storage _pool = ps.pools[_poolId];

        // Check that user holds position tokens and challenge period did not expire yet
        require(
            IPositionToken(_pool.shortToken).balanceOf(msg.sender) > 0 || IPositionToken(_pool.longToken).balanceOf(msg.sender) > 0,
            "DIVA: no position tokens"
        );

        if (_pool.statusFinalReferenceValue == LibDiamond.Status.Submitted) {
            require(block.timestamp <= _pool.statusTimestamp + gs.challengePeriod, "DIVA: outside of challenge period");
            _pool.statusFinalReferenceValue = LibDiamond.Status.Challenged;
            _pool.statusTimestamp = block.timestamp; // represents the start time for the review period

            emit StatusChanged(LibDiamond.Status.Challenged, msg.sender, _poolId, _proposedFinalReferenceValue);
        } else if (_pool.statusFinalReferenceValue == LibDiamond.Status.Challenged) {
            require(block.timestamp <= _pool.statusTimestamp + gs.reviewPeriod, "DIVA: outside of review period");

            emit StatusChanged(LibDiamond.Status.Challenged, msg.sender, _poolId, _proposedFinalReferenceValue);
        } else {
            revert("DIVA: nothing to challenge");
        }
    }

    function redeemPositionToken(address _positionToken, uint256 _amount) external override nonReentrant {
        // Get references to relevant storage slots
        LibDiamond.PoolStorage storage ps = LibDiamond.poolStorage();
        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();

        // Confirm that functionality is not paused
        require(block.timestamp >= gs.pauseReturnCollateralUntil, "DIVA: return collateral paused");

        IPositionToken _positionTokenInstance = IPositionToken(_positionToken); // Reverts if _positionToken is zero address
        uint256 _poolId = _positionTokenInstance.poolId();

        // Load corresponding pool data in memory
        LibDiamond.Pool storage _pool = ps.pools[_poolId];

        // Check that position token address is valid
        require(_pool.shortToken == _positionToken || _pool.longToken == _positionToken, "DIVA: invalid position token address");

        // Check that a reference value was already set
        require(_pool.statusFinalReferenceValue != LibDiamond.Status.Open, "DIVA: final reference value not set yet");

        // Flag whether to confirm the existing final reference value in the current call or not.
        bool _confirmReferenceValue;

        // Scenarios under which the submitted value will be set to Confirmed at first redemption
        if (_pool.statusFinalReferenceValue == LibDiamond.Status.Submitted) {
            // Scenario 1: Data provider submitted a final value and it was not challenged during the challenge period.
            // In that case the submitted value is considered the final one.
            require(block.timestamp > _pool.statusTimestamp + gs.challengePeriod, "DIVA: challenge period not yet expired");
            _confirmReferenceValue = true;
        } else if (_pool.statusFinalReferenceValue == LibDiamond.Status.Challenged) {
            // Scenario 2: Submitted value was challenged, but data provider did not respond during the review period.
            // In that case, the initially submitted value is considered the final one.
            require(block.timestamp > _pool.statusTimestamp + gs.reviewPeriod, "DIVA: review period not yet expired");
            _confirmReferenceValue = true;
        }

        uint8 _decimals = (IERC20Metadata(_pool.collateralToken)).decimals();

        // `_confirmReferenceValue` is only true when `redeemPositionToken` is called the first time, otherwise it is false because the Status already changed to Confirmed
        if (_confirmReferenceValue) {
            _pool.statusFinalReferenceValue = LibDiamond.Status.Confirmed;
            _pool.statusTimestamp = block.timestamp;
            emit StatusChanged(LibDiamond.Status.Confirmed, msg.sender, _poolId, _pool.finalReferenceValue);

            uint256 _collateralBalance = _pool.collateralBalance;
            LibDIVA._calcAndAllocateFeeClaim(_poolId, _pool.redemptionFee, gs.treasury, _collateralBalance, _decimals);
            LibDIVA._calcAndAllocateFeeClaim(_poolId, _pool.settlementFee, _pool.dataProvider, _collateralBalance, _decimals);
            LibDIVA._setRedemptionAmount(_poolId, _decimals);
        }

        // It's important that the Confirmed if clause is AFTER Submitted/Challenged if clauses (because latter change the status to Confirmed)
        if (_pool.statusFinalReferenceValue == LibDiamond.Status.Confirmed) {
            _positionTokenInstance.burn(msg.sender, _amount);

            uint256 _tokenRedemptionAmount;

            if (_positionToken == _pool.longToken) {
                _tokenRedemptionAmount = _pool.redemptionAmountLongToken;
            } else {
                // can only be shortToken due to require statement at the beginning
                _tokenRedemptionAmount = _pool.redemptionAmountShortToken;
            }

            uint256 _SCALING = uint256(10**(SafeDecimalMath.decimals - _decimals));
            uint256 _amountToReturn = (_tokenRedemptionAmount * _SCALING).multiplyDecimal(_amount) / _SCALING;

            LibDiamond._returnCollateral(_poolId, _pool.collateralToken, msg.sender, _amountToReturn);
        }
    }
}
