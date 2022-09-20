// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import {LibDiamond} from "../libraries/LibDiamond.sol";

interface ISettlement {
    /**
     * @notice Function to set the final reference value for a given pool Id.
     * @param _poolId The pool Id for which the final value is submitted.
     * @param _finalReferenceValue Proposed final value by the data provider
     * @param _allowChallenge Toggle to enable/disable the challenge
     * functionality. If 0, then the submitted final value will immediately
     * set the status to Confirmed, no challenge will be possible. This
     * parameter was introduced to allow automated oracles
     * (e.g., Uniswap v3 or Chainlink) to settle without dispute.
     */
    function setFinalReferenceValue(
        uint256 _poolId,
        uint256 _finalReferenceValue,
        bool _allowChallenge
    ) external;

    /**
     * @notice Function to challenge the final value submitted by the data
     * provider.
     * @dev Only position token holders associated with the corresponding pool
     * are allowed to challenge. Function can be triggered multiple times.
     * `_proposedFinalReferenceValue` passed in as argument is not stored
     * in pool parameters but emitted as part of the `StatusChanged` event.
     * @param _poolId Pool Id for which the submitted final value is challenged.
     * @param _proposedFinalReferenceValue The proposed final value by the
     * challenger.
     */
    function challengeFinalReferenceValue(uint256 _poolId, uint256 _proposedFinalReferenceValue) external;

    /**
     * @notice Function to redeem position tokens.
     * @dev If final reference value is confirmed, position tokens are
     * accepted, burnt and users are returned their respective share
     * in the collateral.
     *
     * If the submission period expired without a challenge or
     * a review period expired without another input from the data provider,
     * the final value is confirmed by the first user calling this function.
     * @param _positionToken address of the position token to be redeemed
     * @param _amount number of position tokens to be redeemed
     * (tokens have 18 decimals).
     */
    function redeemPositionToken(address _positionToken, uint256 _amount) external;

    /**
     * @notice Emitted when the status of the final reference value changes.
     * @param statusFinalReferenceValue The status of the final value:
     * 0=Open, 1=Submitted, 2=Challenged, or 3=Confirmed
     * @param by Ethereum address that triggered the underlying function.
     * @param poolId The Id of the pool in settlement.
     * @param proposedFinalReferenceValue Final reference value proposed
     * by the `msg.sender`
     */
    event StatusChanged(
        LibDiamond.Status indexed statusFinalReferenceValue,
        address indexed by,
        uint256 indexed poolId,
        uint256 proposedFinalReferenceValue
    );

    // Duplication of event declaration for event handling in tests and
    // subgraph. Refer to LibDiamond for event description.
    event FeeClaimAllocated(uint256 indexed poolId, address indexed recipient, uint256 amount);

    /**
     * @notice Emitted when position tokens are redeemed.
     * @param poolId The Id of the pool that the position token belongs to.
     * @param positionToken Address of the position token to redeem.
     * @param amountPositionToken Position token amount returned by user.
     * @param collateralAmountReturned Collateral amount returned to user.
     * @param returnedTo Address that is returned collateral.
     */
    event PositionTokenRedeemed(
        uint256 indexed poolId,
        address indexed positionToken,
        uint256 amountPositionToken,
        uint256 collateralAmountReturned,
        address indexed returnedTo
    );
}
