// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../PositionToken.sol";
import "../interfaces/IGetter.sol";

contract GetterFacet is IGetter {
    function getLatestPoolId() external view override returns (uint256) {
        return LibDiamond.poolId();
    }

    function getPoolParameters(uint256 _poolId) external view override returns (LibDiamond.Pool memory) {
        return LibDiamond.poolParameters(_poolId);
    }

    function getPoolParametersByAddress(address _positionToken) external view override returns (LibDiamond.Pool memory) {
        PositionToken positionToken = PositionToken(_positionToken);
        uint256 _poolId = positionToken.poolId();
        return LibDiamond.poolParameters(_poolId);
    }

    function getGovernanceParameters() external view override returns (LibDiamond.GovernanceStorage memory) {
        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();
        return gs;
    }

    function getClaims(address _collateralToken, address _recipient) external view override returns (uint256) {
        return LibDiamond.claims(_collateralToken, _recipient);
    }
}
