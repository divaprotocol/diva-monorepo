// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import {LibDiamond} from "../libraries/LibDiamond.sol";

interface IPool {
    // Argument for `createContingentPool` function
    struct PoolParams {
        string referenceAsset;
        uint256 expiryTime;
        uint256 floor;
        uint256 inflection;
        uint256 cap;
        uint256 collateralBalanceShort;
        uint256 collateralBalanceLong;
        uint256 supplyPositionToken;
        address collateralToken;
        address dataProvider;
        uint256 capacity;
    }

    /**
     * @notice Function to issue long and the short position tokens to
     * `msg.sender` upon collateral deposit. Provided collateral is kept
     * inside the contract until position tokens are redeemed by calling
     * `redeemPositionToken` following pool expiration or returned
     * when removing liquidity via `removeLiquidity` (possible prior to
     * expiration).
     * @dev Only ERC20 tokens with 3 <= decimals <= 18 are accepted as
     * collateral. ETH has to be wrapped into WETH before deposit.
     * Tokens with flexible supply like Ampleforth should not be used.
     * @param _poolParams Struct containing the pool specification:
     * - referenceAsset: The name of the reference asset (e.g., Tesla-USD or ETHGasPrice-GWEI)
     * - expiryTime: Expiration time of the pool expressed as a unix timestamp in seconds
     * - floor: Point at or below which all collateral allocated to the long side of the pool will be credited to the short side
     * - inflection: Threshold for rebalancing between the short and the long side of the pool
     * - cap: Point at or above which all collateral allocated to the short side of the pool will be credited into the long side
     * - collateralBalanceShort: Portion of deposited collateral allocated to the short side of the pool (expressed as an integer with collateral token decimals)
     * - collateralBalanceLong: Portion of collateral allocated to the long side of the pool (expressed as an integer with collateral token decimals)
     * - supplyPositionToken: Short and long position token supply
     * - collateralToken: ERC20 collateral token address
     * - dataProvider: Ethereum account (EOA or smart contract) that will report the final value of the reference asset
     * - capacity: The maximum collateral amount that the contingent pool can accept
     */
    function createContingentPool(PoolParams calldata _poolParams) external;

    /**
     * @notice Emitted when a new pool is created
     * @param poolId The Id of the newly created contingent pool
     * @param from The address of the pool creator
     * @param collateralAmount The collateral amount expressed in collateral decimals
     */
    event PoolIssued(uint256 indexed poolId, address indexed from, uint256 collateralAmount);
}
