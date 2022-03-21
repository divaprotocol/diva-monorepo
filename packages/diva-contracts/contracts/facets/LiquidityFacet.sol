// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../libraries/LibDIVA.sol";
import "../interfaces/IPositionToken.sol";
import "../interfaces/ILiquidity.sol";
import "@solidstate/contracts/utils/ReentrancyGuard.sol";

contract LiquidityFacet is ILiquidity, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;

    function addLiquidity(uint256 _poolId, uint256 _collateralAmountIncr) external override nonReentrant {
        // Get references to relevant storage slots
        LibDiamond.PoolStorage storage ps = LibDiamond.poolStorage();
        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();

        // Initialize Pool struct
        LibDiamond.Pool storage _pool = ps.pools[_poolId];

        require(gs.pauseReceiveCollateral == false, "DIVA: receive collateral paused");

        // Check that pool has not expired yet
        require(block.timestamp < _pool.expiryTime, "DIVA: pool expired");

        // Check that new total pool collateral does not exceed the maximum capacity of the pool
        if (_pool.capacity > 0) {
            require((_pool.collateralBalance + _collateralAmountIncr <= _pool.capacity), "DIVA: exceeds max pool capacity");
        }

        // Connect to collateral token contract of the given pool Id
        IERC20Metadata collateralToken = IERC20Metadata(_pool.collateralToken);

        // Calculate amount of new long and short position tokens to be minted
        uint256 _supplyPositionTokenIncr = LibDIVA._calcSupplyPositionTokenIncr(
            _pool.supplyInitial,
            _pool.collateralBalanceShortInitial + _pool.collateralBalanceLongInitial,
            collateralToken.decimals(),
            _collateralAmountIncr
        );

        // Transfer approved collateral tokens from user to Diamond contract.
        collateralToken.safeTransferFrom(msg.sender, address(this), _collateralAmountIncr);

        // Increase `collateralBalance`
        _pool.collateralBalance += _collateralAmountIncr;

        // Mint long and short position tokens and send to user
        IPositionToken(_pool.shortToken).mint(msg.sender, _supplyPositionTokenIncr);
        IPositionToken(_pool.longToken).mint(msg.sender, _supplyPositionTokenIncr);

        emit LiquidityAdded(_poolId, msg.sender, _collateralAmountIncr);
    }

    function removeLiquidity(uint256 _poolId, uint256 _amountPositionToken) external override nonReentrant {
        // Get references to relevant storage slot
        LibDiamond.PoolStorage storage ps = LibDiamond.poolStorage();
        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();

        // Confirm that functionality is not paused
        require(block.timestamp >= gs.pauseReturnCollateralUntil, "DIVA: return collateral paused");

        // Initialize Pool struct
        LibDiamond.Pool storage _pool = ps.pools[_poolId];

        // If status is Confirmed, users should use `redeemPositionToken` function to avoid charging user fees twice
        require(_pool.statusFinalReferenceValue != LibDiamond.Status.Confirmed, "DIVA: final value already confirmed");

        // Create reference to short and long position tokens for the given derivative contract
        IPositionToken shortToken = IPositionToken(_pool.shortToken);
        IPositionToken longToken = IPositionToken(_pool.longToken);

        /**
         * Check that `msg.sender` owns the corresponding amounts of short and long position tokens.
         * In particular, this check will revert when a user tries to remove an amount that exceeds
         * the overall position token supply which is the maximum amount that a user can own
         */
        require(
            shortToken.balanceOf(msg.sender) >= _amountPositionToken && longToken.balanceOf(msg.sender) >= _amountPositionToken,
            "DIVA: insufficient short or long token balance"
        );

        // Create reference to collateral token corresponding to the provided pool Id
        IERC20Metadata collateralToken = IERC20Metadata(_pool.collateralToken);

        uint256 _redemptionAmount;

        // Calculate collateral amount to return to user gross of fees; `_redemptionAmount` is expressed in collateral decimals
        if ((_amountPositionToken == shortToken.totalSupply()) && (_amountPositionToken == longToken.totalSupply())) {
            _redemptionAmount = _pool.collateralBalance;
        } else {
            // Collateral amount to be returned (e.g., returning 10% of all long tokens in existence will return 10% of the current collateral in the pool)
            _redemptionAmount = LibDIVA._calcRedemptionAmount(
                _amountPositionToken,
                _pool.collateralBalanceShortInitial + _pool.collateralBalanceLongInitial,
                _pool.supplyInitial,
                collateralToken.decimals()
            );
        }

        // Calculate redemption fees to charge; expressed as an integer with collateral token decimals (18 or less)
        uint256 _redemptionFee = LibDIVA._calcFee(_pool.redemptionFee, _redemptionAmount, collateralToken.decimals());

        // Calculate settlement fees to charge; expressed as an integer with in collateral token decimals (18 or less)
        uint256 _settlementFee = LibDIVA._calcFee(_pool.settlementFee, _redemptionAmount, collateralToken.decimals());

        // Burn short and long position tokens. Reverts if transactions fail. No collateral token will be sent to the user in that case.
        shortToken.burn(msg.sender, _amountPositionToken);
        longToken.burn(msg.sender, _amountPositionToken);

        // Note: `collateralBalance` parameter is reduced within `_allocateFeeClaim` and `_returnCollateral`

        // Allocate redemption fee to DIVA treasury; fee is held within this contract and can be claimed via `claimFees` function
        LibDIVA._allocateFeeClaim(_poolId, LibDiamond.governanceStorage().treasury, _redemptionFee);

        // Allocate settlement fee to data feed provider; fee is held within this contract and can be claimed via `claimFees` function
        LibDIVA._allocateFeeClaim(_poolId, _pool.dataProvider, _settlementFee);

        // Send collateral (net of fees) back to user. Reverts if transfer fails.
        LibDiamond._returnCollateral(_poolId, _pool.collateralToken, msg.sender, _redemptionAmount - _redemptionFee - _settlementFee);

        // Log removal of liquidity
        emit LiquidityRemoved(_poolId, msg.sender, _redemptionAmount);
    }
}
