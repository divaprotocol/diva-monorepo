// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import {LibDiamond} from "../libraries/LibDiamond.sol";

interface ILiquidity {
    /**
     * @notice Function to add collateral to an existing pool.
     * @param _poolId Id of the pool that a user wants to add collateral to.
     * @param _collateralAmountIncr Incremental collateral amount to be added to the pool.
     * Split between the long and short side of the pool is calculated based on the initial long and short collateral balances.
     */
    function addLiquidity(uint256 _poolId, uint256 _collateralAmountIncr) external;

    /**
     * @notice Function to remove collateral from an existing pool.
     * @dev Removing collateral from the pool requires the user to send back an equal amount (`_amountLongTokens`) of long and short tokens.
     *
     * Collateral amount returned to the user is net of fees. Redemption and settlement fees for DIVA treasury and data provider, respectively,
     * are retained within the contract and can be claimed via `claimFees` function.
     * @param _poolId Id of the pool that a user wants to remove collateral from.
     * @param _amountPositionToken Number of each position token to return.
     */
    function removeLiquidity(uint256 _poolId, uint256 _amountPositionToken) external;

    /**
     * @notice Emitted when new collateral is added to an existing pool.
     * @param poolId The Id of the pool that a user added collateral to.
     * @param from The address of the user that added collateral.
     * @param collateralAmount The collateral amount added.
     */
    event LiquidityAdded(uint256 indexed poolId, address indexed from, uint256 collateralAmount);

    /**
     * @notice Emitted when collateral is removed from an existing pool.
     * @param poolId The Id of the pool that a users removed collateral from.
     * @param from The address of the user that removed collateral.
     * @param collateralAmount The collateral amount removed from the pool.
     */
    event LiquidityRemoved(uint256 indexed poolId, address indexed from, uint256 collateralAmount);
}
