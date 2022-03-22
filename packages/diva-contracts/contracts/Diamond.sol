// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

/**
 * @author DIVA protocol team.
 * @title A protocol to create and settle derivative assets.
 * @notice Contract to issue long and short position tokens (ERC20) on any public data feed.
 * Diamond contract receives and holds all the collateral backing all position tokens in existence.
 * Diamond contract is the owner of all position tokens and hence the only account authorized to executed the `mint` and `burn` functions inside `PositionToken` contract.
 * Collateral has to be an ERC20 token with less than or equal to 18 decimals.
 * Position tokens have 18 decimals by default.
 * @dev DIVA protocol is implemented using the Diamond Standard (EIP-2535: https://eips.ethereum.org/EIPS/eip-2535)
 */

import {LibDiamond} from "./libraries/LibDiamond.sol";
import {IDiamondCut} from "./interfaces/IDiamondCut.sol";
import {IDiamondLoupe} from "./interfaces/IDiamondLoupe.sol";
import {IERC173} from "./interfaces/IERC173.sol";
import {IERC165} from "./interfaces/IERC165.sol";

contract Diamond {
    /**
     * @dev Deploy DiamondCutFacet before deploying the diamond
     */
    constructor(
        address _contractOwner,
        address _diamondCutFacet,
        address _treasury
    ) payable {
        require(_contractOwner != address(0), "DIVA: owner is 0x0");
        require(_treasury != address(0), "DIVA: treasury is 0x0");

        LibDiamond.setContractOwner(_contractOwner);

        // Add the diamondCut external function from the diamondCutFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory functionSelectors = new bytes4[](1);
        functionSelectors[0] = IDiamondCut.diamondCut.selector;
        cut[0] = IDiamondCut.FacetCut({facetAddress: _diamondCutFacet, action: IDiamondCut.FacetCutAction.Add, functionSelectors: functionSelectors});
        LibDiamond.diamondCut(cut, address(0), "");

        // *****************************************************************
        // ****************** Initialization of variables ******************
        // *****************************************************************
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();

        // Initialize fee parameters (can be changed by DIVA governance).
        gs.redemptionFee = 2500000000000000; // 0.25% fee for DIVA treasury
        gs.settlementFee = 500000000000000; // 0.05% fee for data feed provider

        // Initialize settlement related parameters (can be changed by DIVA governance at a later stage).
        gs.submissionPeriod = 1 days; // Time for data feed provider to submit the final value; starts from expiration time
        gs.challengePeriod = 1 days; // Time for position token holders to challenge the submitted value; starts from the time of submission
        gs.reviewPeriod = 2 days; // Time for data feed provider to review the submitted value following a challenge; starts from the time of challenge
        gs.fallbackSubmissionPeriod = 5 days; // Time for DIVA to provide final value if data feed provider fails to do so
        gs.treasury = _treasury; // Treasury address controlled by DIVA governance
        gs.fallbackDataProvider = _contractOwner;

        // Adding ERC165 data
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable {
        
        LibDiamond.DiamondStorage storage ds;
        
        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }

        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;
        require(facet != address(0), "Diamond: Function does not exist");

        assembly {
            // copy incoming call data
            calldatacopy(0, 0, calldatasize())

            // forward call to logic contract (facet)
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)

            // retrieve return data
            returndatacopy(0, 0, returndatasize())

            // forward return data back to caller
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    receive() external payable {}
}
