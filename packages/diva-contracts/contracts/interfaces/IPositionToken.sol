// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Position token contract
 * @dev The `PositionToken` contract inherits from ERC20 contract and stores
 * the contingent pool Id that the position token is linked to in the context of DIVA. It implements a `mint` and a `burn` function
 * which can only be called by the `PositionToken` contract owner which is set at `PositionToken` contract deployment.
 *
 * Two `PositionToken` contracts are deployed during pool creation (`createContingentPool`) with Diamond contract being set as the owner.
 * The mint function is triggered within `createContingentPool` and as part of the addition of liquidity (`addLiquidity`).
 * Position tokens are burnt during token redemption (`redeemPositionToken`) and removal of liquidity (`removeLiquidity`).
 * The address of the position tokens is stored in the pool parameters within Diamond contract and used to verify the tokens that
 * user send back to the Diamond contract to withdraw collateral.
 *
 * All position tokens have 18 decimals.
 */
interface IPositionToken is IERC20 {
    /**
     * @dev Function to mint ERC20 position tokens. Called during `createContingentPool` and `addLiquidity`.
     * Can only be called by the owner of the position token which is the Diamond contract in the context of DIVA.
     * @param recipient The account receiving the position tokens.
     * @param amount The number of position tokens to mint.
     */
    function mint(address recipient, uint256 amount) external;

    /**
     * @dev Function to burn position tokens. Called within `redeemPositionToken` and `removeLiquidity`.
     * Can only be called by the owner of the position token which is the Diamond contract in the context of DIVA.
     * @param redeemer Address redeeming positions tokens in return for collateral.
     * @param amount The number of position tokens to burn.
     */
    function burn(address redeemer, uint256 amount) external;

    /**
     * @dev Returns the Id of the contingent pool that the position token is linked to in the context of DIVA.
     */
    function poolId() external view returns (uint256);

    /**
     * @dev Returns the owner of the position token (Diamond contract in the context of DIVA).
     */
    function owner() external view returns (address);
}
