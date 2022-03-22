// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import {LibDiamond} from "../libraries/LibDiamond.sol";

/**
 * @title Interface for the GetterFacet contract
 */
interface IGetter {
    /**
     * @notice Returns the latest pool Id
     * @return Pool Id
     */
    function getLatestPoolId() external view returns (uint256);

    /**
     * @notice Returns the pool parameters for a given pool Id
     * @param _poolId Id of the pool
     * @return Pool struct
     */
    function getPoolParameters(uint256 _poolId) external view returns (LibDiamond.Pool memory);

    /**
     * @dev Same as getPoolParameters but using the position token address as input
     * @param _positionToken Position token address
     * @return Pool struct
     */
    function getPoolParametersByAddress(address _positionToken) external view returns (LibDiamond.Pool memory);

    /**
     * @dev Returns governance related parameters
     * @return GovernanceStorage struct
     */
    function getGovernanceParameters() external view returns (LibDiamond.GovernanceStorage memory);

    /**
     * @dev Returns the claims by collateral tokens for a given account
     * @param _recipient Account address
     * @param _collateralToken Collateral token address
     * @return Array of Claim structs
     */
    function getClaims(address _collateralToken, address _recipient) external view returns (uint256);
}
