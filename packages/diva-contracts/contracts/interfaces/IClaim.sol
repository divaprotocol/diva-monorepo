// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import {LibDiamond} from "../libraries/LibDiamond.sol";

interface IClaim {
    /**
     * @notice Function to claim allocated
     * @dev List of collateral token addresses has to be obtained off-chain
     * (e.g., from TheGraph)
     * @param _collateralToken Collateral token address
     */
    function claimFees(address _collateralToken) external;

    /**
     * @notice Function to transfer fee claim from entitled address
     * to another address
     * @param _recipient Address of fee claim recipient
     * @param _collateralToken Collateral token address
     * @param _amount Amount expressed in collateral token to transfer to
     * recipient
     */
    function transferFeeClaim(
        address _recipient,
        address _collateralToken,
        uint256 _amount
    ) external;

    /**
     * @notice Emitted when fee claim is transferred from entitled address
     * to another address
     * @param from Address that is transferring their fee claim
     * @param to Address of the fee claim recipient
     * @param collateralToken Collateral token address
     * @param amount Fee amount
     */
    event FeeClaimTransferred(address indexed from, address indexed to, address indexed collateralToken, uint256 amount);

    /**
     * @notice Emitted when fees are claimed
     * @param by Address that claims the fees
     * @param collateralToken Collateral token address
     * @param amount Fee amount
     */
    event FeesClaimed(address indexed by, address indexed collateralToken, uint256 amount);
}
