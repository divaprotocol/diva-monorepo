// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import {LibDiamond} from "../libraries/LibDiamond.sol";

/**
 * @title Interface for the GovernanceFacet contract.
 */
interface IGovernance {
    /**
     * @notice Function to set the redemption fee; goes to DIVA treasury
     * @dev Execution restricted to contract owner
     */
    function setRedemptionFee(uint256 _redemptionFee) external;

    /**
     * @notice Function to set the settlement fee; goes to data provider unless they do not provide input
     * @dev Execution restricted to contract owner
     */
    function setSettlementFee(uint256 _settlementFee) external;

    /**
     * @notice Function to set the final reference value submission period
     * @dev Execution restricted to contract owner
     */
    function setSubmissionPeriod(uint256 _submissionPeriod) external;

    /**
     * @notice Function to set the final reference value challenge period
     * @dev Execution restricted to contract owner
     */
    function setChallengePeriod(uint256 _challengePeriod) external;

    /**
     * @notice Function to set the final reference value review period
     * @dev Execution restricted to contract owner
     */
    function setReviewPeriod(uint256 _reviewPeriod) external;

    /**
     * @notice Function to set the final reference value DIVA submission period
     * @dev Execution restricted to contract owner
     */
    function setFallbackSubmissionPeriod(uint256 _fallbackSubmissionPeriod) external;

    /**
     * @notice Function to set the treasury address
     * @dev Execution restricted to contract owner
     */
    function setTreasuryAddress(address _newTreasury) external;

    /**
     * @notice Function to set the fallback data provider address
     * @dev Execution restricted to contract owner
     */
    function setFallbackDataProvider(address _newFallbackDataProvider) external;

    /**
     * @notice Function to pause or unpause `createContingentPool` and
     * `removeLiquidity` functions.
     * @dev Execution restricted to contract owner
     */
    function setPauseReceiveCollateral(bool _pause) external;

    /**
     * @notice Function to pause or unpause `removeLiquidity` and
     * `redeemPositionToken` functions.
     * @dev Execution restricted to contract owner. The minimum period
     * between two pause events is 10 days. User's can start withdrawing
     * collateral already after 8 days giving them at least 2 days before
     * the next pause can be activated.
     */
    function setPauseReturnCollateral(bool _pause) external;

    /**
     * @notice Emitted when the redemption fee is set
     * @param from The address that initiated the change (contract owner)
     * @param fee The redemption fee amount in % of the collateral
     */
    event RedemptionFeeSet(address indexed from, uint256 fee);

    /**
     * @notice Emitted when the settlement fee is set
     * @param from The address that initiated the change (contract owner)
     * @param fee The settlement fee amount in % of the collateral
     */
    event SettlementFeeSet(address indexed from, uint256 fee);

    /**
     * @notice Emitted when the final reference value submission period is set
     * @param from The address that initiated the change (contract owner)
     * @param period New length of the final reference value submission period
     */
    event SubmissionPeriodSet(address indexed from, uint256 period);

    /**
     * @notice Emitted when the challenge period is set
     * @param from The address that initiated the change (contract owner)
     * @param period New length of the challenge period
     */
    event ChallengePeriodSet(address indexed from, uint256 period);

    /**
     * @notice Emitted when the review period is set
     * @param from The address that initiated the change (contract owner)
     * @param period New length of the review period
     */
    event ReviewPeriodSet(address indexed from, uint256 period);

    /**
     * @notice Emitted when the DIVA submission period is set
     * @param from The address that initiated the change (contract owner)
     * @param period New length of the DIVA submission period
     */
    event FallbackSubmissionPeriodSet(address indexed from, uint256 period);

    /**
     * @notice Emitted when the treasury address is set
     * @param from The address that initiated the change (contract owner)
     * @param treasury New treasury address
     */
    event TreasuryAddressSet(address indexed from, address indexed treasury);

    /**
     * @notice Emitted when the treasury address is set
     * @param from The address that initiated the change (contract owner)
     * @param fallbackDataProvider New fallback data provider
     */
    event FallbackDataProviderSet(address indexed from, address indexed fallbackDataProvider);

    /**
     * @notice Emitted when `createContingentPool` and `addLiquidity` functions are
     * paused or unpaused.
     * @param from The address that initiated the change (contract owner)
     * @param pause Boolean indicating whether functions were paused or unpaused
     */
    event PauseReceiveCollateralSet(address indexed from, bool indexed pause);

    /**
     * @notice Emitted when `redeemPositionToken` or `removeLiquidity`
     * functions are paused or unpaused.
     * @param from The address that initiated the change (contract owner)
     * @param pausedUntil Unix timestamp in seconds until when the
     * functionality is paused
     */
    event PauseReturnCollateralSet(address indexed from, uint256 pausedUntil);
}
