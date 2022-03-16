// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "../interfaces/IGovernance.sol";

contract GovernanceFacet is IGovernance {
    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }

    function setRedemptionFee(uint256 _redemptionFee) external override onlyOwner {
        require(_redemptionFee <= 25000000000000000, "DIVA: exceeds max allowed"); // 2.5% = 0.025

        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();
        gs.redemptionFee = _redemptionFee;

        emit RedemptionFeeSet(msg.sender, _redemptionFee);
    }

    function setSettlementFee(uint256 _settlementFee) external override onlyOwner {
        require(_settlementFee <= 25000000000000000, "DIVA: exceeds max allowed"); // 2.5% = 0.025

        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();
        gs.settlementFee = _settlementFee;

        emit SettlementFeeSet(msg.sender, _settlementFee);
    }

    function setSubmissionPeriod(uint256 _submissionPeriod) external override onlyOwner {
        require(_submissionPeriod >= 1 days && _submissionPeriod <= 15 days, "DIVA: out of bounds");

        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();
        gs.submissionPeriod = _submissionPeriod;

        emit SubmissionPeriodSet(msg.sender, _submissionPeriod);
    }

    function setChallengePeriod(uint256 _challengePeriod) external override onlyOwner {
        require(_challengePeriod >= 1 days && _challengePeriod <= 15 days, "DIVA: out of bounds");

        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();
        gs.challengePeriod = _challengePeriod;

        emit ChallengePeriodSet(msg.sender, _challengePeriod);
    }

    function setReviewPeriod(uint256 _reviewPeriod) external override onlyOwner {
        require(_reviewPeriod >= 1 days && _reviewPeriod <= 15 days, "DIVA: out of bounds");

        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();
        gs.reviewPeriod = _reviewPeriod;

        emit ReviewPeriodSet(msg.sender, _reviewPeriod);
    }

    function setFallbackSubmissionPeriod(uint256 _fallbackSubmissionPeriod) external override onlyOwner {
        require(_fallbackSubmissionPeriod >= 1 days && _fallbackSubmissionPeriod <= 15 days, "DIVA: out of bounds");

        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();
        gs.fallbackSubmissionPeriod = _fallbackSubmissionPeriod;

        emit FallbackSubmissionPeriodSet(msg.sender, _fallbackSubmissionPeriod);
    }

    function setTreasuryAddress(address _newTreasury) external override onlyOwner {
        require(_newTreasury != address(0), "DIVA: zero address");

        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();
        gs.treasury = _newTreasury;

        emit TreasuryAddressSet(msg.sender, _newTreasury);
    }

    function setFallbackDataProvider(address _newFallbackDataProvider) external override onlyOwner {
        require(_newFallbackDataProvider != address(0), "DIVA: zero address");

        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();
        gs.fallbackDataProvider = _newFallbackDataProvider;

        emit FallbackDataProviderSet(msg.sender, _newFallbackDataProvider);
    }

    function setPauseReceiveCollateral(bool _pause) external override onlyOwner {
        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();
        gs.pauseReceiveCollateral = _pause;

        emit PauseReceiveCollateralSet(msg.sender, _pause);
    }

    function setPauseReturnCollateral(bool _pause) external override onlyOwner {
        LibDiamond.GovernanceStorage storage gs = LibDiamond.governanceStorage();

        if (_pause) {
            // Minimum time between two pause events is 10 days, but users can interact
            // with `redeemPositionToken` and `removeLiquidity` already after 8 days giving them
            // at least 2 days to remove collateral until the next pause can be activated.
            require(block.timestamp > gs.pauseReturnCollateralUntil + 2 days, "DIVA: too early to pause again");
            gs.pauseReturnCollateralUntil = block.timestamp + 8 days;
        } else {
            gs.pauseReturnCollateralUntil = block.timestamp;
        }

        emit PauseReturnCollateralSet(msg.sender, gs.pauseReturnCollateralUntil);
    }
}
