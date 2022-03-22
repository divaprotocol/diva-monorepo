// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "../PositionToken.sol";
import "../interfaces/IPool.sol";
import "@solidstate/contracts/utils/ReentrancyGuard.sol";

contract PoolFacet is IPool, ReentrancyGuard {
    using SafeERC20 for IERC20Metadata;

    function createContingentPool(PoolParams calldata _poolParams) external override nonReentrant {
        // Get references to relevant storage slots
        LibDiamond.PoolStorage storage ps = LibDiamond.poolStorage();
        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();

        // Connect to collateral token ERC20 contract
        IERC20Metadata collateralToken = IERC20Metadata(_poolParams.collateralToken);

        uint256 collateralBalance = _poolParams.collateralBalanceShort + _poolParams.collateralBalanceLong;

        require(gs.pauseReceiveCollateral == false, "DIVA: receive collateral paused");

        // Check validity of input parameters
        require(bytes(_poolParams.referenceAsset).length > 0, "DIVA: no reference asset");
        require(_poolParams.floor <= _poolParams.inflection, "DIVA: floor greater inflection");
        require(_poolParams.cap >= _poolParams.inflection, "DIVA: cap smaller inflection");
        require(_poolParams.collateralToken != address(0), "DIVA: collateral token is zero address");
        require(_poolParams.dataProvider != address(0), "DIVA: data provider is zero address");
        require(_poolParams.supplyPositionToken > 0, "DIVA: zero position token supply");
        require((collateralBalance) > 0, "DIVA: zero collateral amount");
        if (_poolParams.capacity > 0) {
            require(collateralBalance <= _poolParams.capacity, "DIVA: pool capacity exceeded");
        }
        require((collateralToken.decimals() <= 18) && (collateralToken.decimals() >= 3), "DIVA: collateral token decimals above 18 or below 3");

        /**
        Increment `poolId` every time a new pool is created. Index 
        starts at 1. No overflow risk when using compiler version >= 0.8.0. 
        */
        ps.poolId++;

        // Transfer approved collateral tokens from user to Diamond contract.
        collateralToken.safeTransferFrom(msg.sender, address(this), collateralBalance);

        /** 
        Deploy two `PositionToken` contracts, one that represents the short 
        and one that represents the long side of the pool. 
        Naming convention for short/long token: S13/L13 where 13 is the poolId
        Diamond contract (address(this) due to delegatecall) is set as the 
        owner of the position tokens and is the only account that is 
        authorized to call the `mint` and `burn` function therein. 
        */
        PositionToken _shortToken = new PositionToken(
            string(abi.encodePacked("S", Strings.toString(ps.poolId))),
            string(abi.encodePacked("S", Strings.toString(ps.poolId))),
            ps.poolId
        );

        PositionToken _longToken = new PositionToken(
            string(abi.encodePacked("L", Strings.toString(ps.poolId))),
            string(abi.encodePacked("L", Strings.toString(ps.poolId))),
            ps.poolId
        );

        // Store `Pool` struct in `pools` mapping for the given `poolId`
        ps.pools[ps.poolId] = LibDiamond.Pool(
            _poolParams.referenceAsset,
            _poolParams.expiryTime,
            _poolParams.floor,
            _poolParams.inflection,
            _poolParams.cap,
            _poolParams.supplyPositionToken, // initial value (will stay constant; used for calcs)
            _poolParams.collateralToken,
            _poolParams.collateralBalanceShort, // initial value (will stay constant; used for calcs)
            _poolParams.collateralBalanceLong, // initial value (will stay constant; used for calcs)
            collateralBalance,
            address(_shortToken),
            address(_longToken),
            0,
            LibDiamond.Status.Open,
            0,
            0,
            block.timestamp,
            address(_poolParams.dataProvider),
            gs.redemptionFee,
            gs.settlementFee,
            _poolParams.capacity
        );

        _shortToken.mint(msg.sender, _poolParams.supplyPositionToken);
        _longToken.mint(msg.sender, _poolParams.supplyPositionToken);

        emit PoolIssued(ps.poolId, msg.sender, collateralBalance);
    }
}
