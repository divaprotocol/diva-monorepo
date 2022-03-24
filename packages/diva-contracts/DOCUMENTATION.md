# DIVA Documentation
This documentation outlines the intended functionality of the different DIVA smart contract functions. 

## Core protocol functions
* `createContingentPool`
* `addLiquidity`
* `removeLiquidity`
* `setFinalReferenceValue`
* `challengeFinalReferenceValue`
* `redeemPositionToken`

## setter functions:
* `setRedemptionFee(uint256 redemptionFee)`
* `setSettlementFee(uint256 settlementFee)`
* `setSubmissionPeriod(uint256 submissionPeriod)`
* `setChallengePeriod(uint256 challengePeriod)`
* `setReviewPeriod(uint256 reviewPeriod)`
* `setFallbackSubmissionPeriod(uint256 fallbackSubmissionPeriod)`
* `setTreasuryAddress(address newTreasury)`
* `transferOwnership(address newOwner)`

## getter functions:
* `getLatestPoolId()`
* `getPoolParameters(uint256 poolId)`
* `getPoolParameters(address positionToken)`
* `getGovernanceParameters()`
* `getClaims(address collateralToken, address recipient)`
* `getTreasuryAddress()`
* `owner()`

## Other:
* `claimFees(address collateralToken)`
* `transferFeeClaim(address recipient, address collateralToken, uint256 amount)`

## Diamond related functions:
* ...


## `challengeFinalReferencePrice(uint256 poolId, uint256 proposedFinalReferenceValue)`
* The purpose of this function is to give position token holders the possibility to challenge the final reference value submitted by the data feed provider following expiry if the submitted value is deemed inaccurate. Note that the possibility to challenge a data feed can be deactivated by the data feed provider at the time of final value submission (3rd parameter in `setFinalReferenceValue` function; THIS LOGIC IS SUBJECT TO CHANGE!). This feature was introduced to allow automated oracle services like Chainlink or UniswapV3Oracle to submit values without being challenged.
* It is important to highlight that the challenge function is meant to help fix unintentional errors made by the data feed provider (e.g., fat finger mistake or incorrect accounting for stock or token split). 
It does NOT prevent malicious data feed providers from submitting wrong values! It's the purpose of the whitelist to mitigate that risk. 
* A challenge can be triggered after the data feed provider has submitted a final reference value, i.e. the pool status is set to `Submitted`.
* Conditions to be met in order to execute this function:
   * `msg.sender` must have a positive balance of long or short position tokens
   * the call must be within the challenge period which starts with the submission of the value by the data feed provider and ends 24h later (initial value, updateable by DIVA governance)
   * The status of the pool needs to be `Submitted` or `Challenged` 
* If the pool status is `Submitted` at the time of the call, it will update the status from `Submitted` to `Challenged` and set the timestamp to the current block timestamp. If the 
status is already set to `Challenged` (the case when a second user triggers the function again), the status and timestamp will NOT be updated again, but will merely emit an event including the caller and the proposed value by the challenger. It is important to highlight that the final reference value proposed by the challenger does NOT  update the `finalReferenceValue` in the pool struct. If needed for external applications, the value can be obtained from a subgraph that captures this event. 
* The timestamp set at challenge is the start of the review period (initially 48h, updateable by DIVA governance) where the data feed provider can submit a new value. There are two scenarios:
   * Scenario 1: Data feed provider submits the same value again. In this case the pool status will switch from `Challenged` to `Confirmed` and position token holders will be able redeemd their position tokens by calling the `redeemPositionToken` function.
   * Scenario 2: Data feed provider submits a value that is different from the previous one. This will unlock another challenge period for position token holders.
* In theory, a data feed provider could delay the settlement process indefinitely by submitting different values when being challenged. In practice, an honest data feed provider that was selected from the whitelist and who cares about their reputation score and future fees should not have an incentive to engage in such a strategy. A malicious data feed provider on the other hand might not be able to sustain such a strategy over a very long period of time due to gas costs. Another option to accelerate the settlement process is to stop submitting challenges and simply accepting the value that the malicious actor has set (this scenario assumes that there is no account that holds position tokens that is controlled by the malicious actor; otherwise the gas fee argument applies).
* Status mapping:
   * 0: Open
   * 1: Submitted
   * 2: Challenged
   * 3: Confirmed
