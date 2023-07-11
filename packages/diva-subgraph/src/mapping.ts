import { Address, BigInt, Bytes, log } from "@graphprotocol/graph-ts";
import {
  DivaDiamond,
  LiquidityAdded,
  LiquidityRemoved,
  PoolIssued,
  StatusChanged,
  FeeClaimAllocated,
  FeeClaimTransferred,
  FeeClaimed,
  PositionTokenRedeemed,
} from "../generated/DivaDiamond/DivaDiamond";
import { Erc20Token } from "../generated/DivaDiamond/Erc20Token";
import { PositionTokenABI } from "../generated/DivaDiamond/PositionTokenABI";
import { LimitOrderFilled } from "../generated/ExchangeProxy/IZeroEx";
import {
  Pool,
  Challenge,
  FeeRecipient,
  CollateralToken,
  FeeRecipientCollateralToken,
  PositionToken,
  UserPositionToken,
  User,
  NativeOrderFill,
} from "../generated/schema";

// @todo Add in subgraph yml file
// - event: OfferFilled(indexed bytes32,indexed address,indexed address,uint256)
// handler: handleOfferFilled
// - event: OfferCancelled(indexed bytes32,indexed address)
// handler: handleOfferCancelled

/**
 * @notice Function to handle challenge related events emitted by DIVA Protocol.
 * @param poolId The pool Id affected.
 * @param challengedBy The address of the challenger.
 * @param proposedFinalReferenceValue The proposed final reference value by the challenger.
 * @param challengeId Challenge entity Id.
 */
function handleChallengeEvent(
  poolId: Bytes,
  challengedBy: Address,
  proposedFinalReferenceValue: BigInt,
  challengeId: string
): void {
  let challenge = new Challenge(challengeId);

  challenge.pool = poolId.toHexString();
  challenge.challengedBy = challengedBy;
  challenge.proposedFinalReferenceValue = proposedFinalReferenceValue;
  challenge.save();
}

/**
 * UserPositionToken entity: Frontend application may want to display a user's existing positions.
 * To optimize performance and avoid looping through all position tokens, a mapping of user interactions is maintained.
 * Whenever a user receives position tokens through actions such as creating a new pool, adding liquidity to a pool,
 * or purchasing tokens via the 0x protocol, the user's ownership of those tokens is logged in the UserPositionToken mapping.
 * It's important to note that the mapping is not created for position tokens purchased outside of the 0x protocol.
 */

/**
 * @notice Function to handle `PoolIssued`, `LiquidityAdded` and `LiquidityRemoved` events emitted
 * by DIVA Protocol.
 * @param poolId The pool Id affected.
 * @param longRecipient The recipient address of the long position token.
 * @param shortRecipient The recipient address of the short position token.
 * @param divaAddress DIVA contract address.
 * @param msgSender Address that triggered the transaction.
 * @param blockTimestamp Timestamp of the block that included the transaction.
 */
function handleLiquidityEvent(
  poolId: Bytes,
  longRecipient: Address,
  shortRecipient: Address,
  divaAddress: Address,
  msgSender: Address,
  blockTimestamp: BigInt,
  collateralAmount: BigInt,
  permissionedERC721Token: Address
): void {
  // ***************************************
  // *** Initialize relevant connections ***
  // ***************************************

  // Connect to DIVA contract
  let contract = DivaDiamond.bind(divaAddress);

  // Get parameters for the provided `poolId`
  let parameters = contract.getPoolParameters(poolId);

  // Connect to short and long position token contracts
  let shortTokenContract = PositionTokenABI.bind(parameters.shortToken);
  let longTokenContract = PositionTokenABI.bind(parameters.longToken);

  // ****************************************************
  // *** Map short position token to `shortRecipient` ***
  // ****************************************************

  // Check whether a User entity for `shortRecipient` already exists
  let shortRecipientEntity = User.load(shortRecipient.toHexString());

  // If not, add it. Is the case at create. Could be the case at add/remove.
  if (!shortRecipientEntity) {
    shortRecipientEntity = new User(shortRecipient.toHexString());
    shortRecipientEntity.save();
  }

  // Check whether the short position token is already mapped to the user `shortRecipient`
  let userShortPositionTokenEntity = UserPositionToken.load(
    shortRecipient.toHexString() + "-" + parameters.shortToken.toHexString()
  );

  // If not, add it. Could be created during removal of liquidity, but not a problem as this is anyways just a rough shortlist.
  if (!userShortPositionTokenEntity) {
    userShortPositionTokenEntity = new UserPositionToken(
      shortRecipient.toHexString() + "-" + parameters.shortToken.toHexString()
    );
    userShortPositionTokenEntity.user = shortRecipient.toHexString();
    userShortPositionTokenEntity.positionToken = parameters.shortToken.toHexString();
    userShortPositionTokenEntity.receivedAt = blockTimestamp;

    // Save results in entity
    userShortPositionTokenEntity.save();
  }

  // **************************************************
  // *** Map long position token to `longRecipient` ***
  // **************************************************

  // Check whether a User entity for `shortRecipient` already exists
  let longRecipientEntity = User.load(longRecipient.toHexString());

  // If not, add it. Could be the case during PoolIssued, LiquidityAdded or LiquidityRemoved events.
  // QUESTION StatusChanged events as well? I think so because msg.sender could be anyone (msg.sender is used as dummy for shortRecipient and longRecipient in StatusChanged event handling)
  if (!longRecipientEntity) {
    longRecipientEntity = new User(longRecipient.toHexString());
    longRecipientEntity.save();
  }

  // Check whether the long position token is already mapped to the user `longRecipient`
  let userLongPositionTokenEntity = UserPositionToken.load(
    longRecipient.toHexString() + "-" + parameters.longToken.toHexString()
  );

  // If not, add it. Could be created during removal of liquidity which is not a big problem as this is anyways just a rough shortlist.
  if (!userLongPositionTokenEntity) {
    userLongPositionTokenEntity = new UserPositionToken(
      longRecipient.toHexString() + "-" + parameters.longToken.toHexString()
    );
    userLongPositionTokenEntity.user = longRecipient.toHexString();
    userLongPositionTokenEntity.positionToken = parameters.longToken.toHexString();
    userLongPositionTokenEntity.receivedAt = blockTimestamp;

    // Save results in entity
    userLongPositionTokenEntity.save();
  }

  // ******************************************************
  // *** Add collateral token to CollateralToken entity ***
  // ******************************************************

  // Check whether the collateral token already exists in CollateralToken entity
  let collateralTokenEntity = CollateralToken.load(parameters.collateralToken.toHexString());

  // If not, add it. Only the case on PoolIssued event.
  if (!collateralTokenEntity) {
    collateralTokenEntity = new CollateralToken(parameters.collateralToken.toHexString());

    let tokenContract = Erc20Token.bind(parameters.collateralToken);
    collateralTokenEntity.name = tokenContract.name();
    collateralTokenEntity.symbol = tokenContract.symbol();
    collateralTokenEntity.decimals = tokenContract.decimals();

    // Save results in entity
    collateralTokenEntity.save();
  }

  // *******************************************************
  // *** Add long position token to PositionToken entity ***
  // *******************************************************

  // Check whether the long position token already exists in PositionToken entity.
  let longTokenEntity = PositionToken.load(parameters.longToken.toHexString());

  // If not, add it. Only the case on PoolIssued event.
  if (!longTokenEntity) {
    longTokenEntity = new PositionToken(parameters.longToken.toHexString());

    let longTokenContract = PositionTokenABI.bind(parameters.longToken);

    longTokenEntity.name = longTokenContract.name();
    longTokenEntity.symbol = longTokenContract.symbol();
    longTokenEntity.decimals = longTokenContract.decimals();
    longTokenEntity.pool = longTokenContract.poolId().toHexString();
    longTokenEntity.owner = longTokenContract.owner();

    // Save results in entity
    longTokenEntity.save();
  }

  // ********************************************************
  // *** Add short position token to PositionToken entity ***
  // ********************************************************

  // Check whether the short position token already exists in PositionToken entity
  let shortTokenEntity = PositionToken.load(parameters.shortToken.toHexString());

  // If not, add it. Only the case on PoolIssued event.
  if (!shortTokenEntity) {
    shortTokenEntity = new PositionToken(parameters.shortToken.toHexString());

    let shortTokenContract = PositionTokenABI.bind(parameters.shortToken);

    shortTokenEntity.name = shortTokenContract.name();
    shortTokenEntity.symbol = shortTokenContract.symbol();
    shortTokenEntity.decimals = shortTokenContract.decimals();
    shortTokenEntity.pool = shortTokenContract.poolId().toHexString();
    shortTokenEntity.owner = shortTokenContract.owner();

    // Save results in entity
    shortTokenEntity.save();
  }

  // **************************
  // *** Update Pool entity ***
  // **************************

  // Check whether a Pool entity already exists for the provided `poolId`
  let poolEntity = Pool.load(poolId.toHexString());

  // If not, add it. The if clause is entered on `createContingentPool` or `fillOfferCreateContingentPool` only.
  // It is not entered on add or remove liquidity. As a result, the task completion status for create contingent pool
  // related tasks is updated inside this if clause.
  if (!poolEntity) {
    poolEntity = new Pool(poolId.toHexString());
    poolEntity.createdBy = msgSender;
    poolEntity.createdAt = blockTimestamp;
    poolEntity.collateralBalanceGross = new BigInt(0);
  }

  // **************************
  // *** Update pool entity ***
  // **************************

  poolEntity.floor = parameters.floor; // Updated at create only
  poolEntity.inflection = parameters.inflection; // Updated at create only
  poolEntity.cap = parameters.cap; // Updated at create only
  poolEntity.gradient = parameters.gradient; // Updated at create only
  poolEntity.collateralBalance = parameters.collateralBalance; // Updated at create/add/remove
  poolEntity.collateralBalanceGross = poolEntity.collateralBalanceGross.plus(collateralAmount); // Updated during create/add/remove
  poolEntity.finalReferenceValue = parameters.finalReferenceValue; // Set to 0 at create and update at `StatusChanged` event
  poolEntity.capacity = parameters.capacity; // Updated at create only
  poolEntity.statusTimestamp = parameters.statusTimestamp; // Updated at create and `StatusChanged` events
  poolEntity.shortToken = parameters.shortToken.toHexString(); // Updated at create only
  poolEntity.payoutShort = parameters.payoutShort; // Set to 0 at create and updated at `StatusChanged` event when the final reference value is confirmed
  poolEntity.longToken = parameters.longToken.toHexString(); // Updated at create only
  poolEntity.payoutLong = parameters.payoutLong; // Set to 0 and updated at `StatusChanged` event when the final reference value is confirmed
  poolEntity.collateralToken = collateralTokenEntity.id; // Updated at create only
  poolEntity.expiryTime = parameters.expiryTime; // Updated at create only
  poolEntity.dataProvider = parameters.dataProvider; // Updated at create only
  poolEntity.protocolFee = contract.getFees(parameters.indexFees).protocolFee; // Updated at create only
  poolEntity.settlementFee = contract.getFees(parameters.indexFees).settlementFee; // Updated at create only
  poolEntity.submissionPeriod = BigInt.fromI32(
    contract.getSettlementPeriods(parameters.indexSettlementPeriods).submissionPeriod
  ); // Updated at create only
  poolEntity.challengePeriod = BigInt.fromI32(
    contract.getSettlementPeriods(parameters.indexSettlementPeriods).challengePeriod
  ); // Updated at create only
  poolEntity.reviewPeriod = BigInt.fromI32(
    contract.getSettlementPeriods(parameters.indexSettlementPeriods).reviewPeriod
  ); // Updated at create only
  poolEntity.fallbackSubmissionPeriod = BigInt.fromI32(
    contract.getSettlementPeriods(parameters.indexSettlementPeriods).fallbackSubmissionPeriod
  ); // Updated at create only
  poolEntity.referenceAsset = parameters.referenceAsset; // Updated at create only
  poolEntity.supplyShort = shortTokenContract.totalSupply(); // Updated at create/add/remove
  poolEntity.supplyLong = longTokenContract.totalSupply(); // Updated at create/add/remove
  poolEntity.permissionedERC721Token = permissionedERC721Token.toHexString(); // Updated at create only
  poolEntity.statusFinalReferenceValue = _translateStatus(parameters.statusFinalReferenceValue);

  // Save results in entity
  poolEntity.save();
}

// @todo Check whether getClaim also reflects reserved fees that were allocated
/**
 * @notice Function to read the updated fee claim and store it in the fee related entities.
 * @param collateralTokenAddress The address of the collateral token in which the fee is denominated.
 * @param recipient Recipient of fee claim.
 * @param divaAddress DIVA Protocol contract address from which the fee claim is read.
 */
function handleFeeClaimEvent(
  collateralTokenAddress: Address,
  recipient: Address,
  divaAddress: Address
): void {
  // Connect to DIVA contract
  let contract = DivaDiamond.bind(divaAddress);

  // Get updated claim amount
  let claim = contract.getClaim(collateralTokenAddress, recipient);

  // Update fee related entities
  let feeRecipientEntity = FeeRecipient.load(recipient.toHexString());
  let feeRecipientCollateralTokenEntity = FeeRecipientCollateralToken.load(
    recipient.toHexString() + "-" + collateralTokenAddress.toHexString()
  );

  if (!feeRecipientEntity) {
    feeRecipientEntity = new FeeRecipient(recipient.toHexString());
  }

  if (!feeRecipientCollateralTokenEntity) {
    feeRecipientCollateralTokenEntity = new FeeRecipientCollateralToken(
      recipient.toHexString() + "-" + collateralTokenAddress.toHexString()
    );
    feeRecipientCollateralTokenEntity.feeRecipient = recipient.toHexString();
    feeRecipientCollateralTokenEntity.collateralToken = collateralTokenAddress.toHexString();
  }

  feeRecipientCollateralTokenEntity.amount = claim;

  // Save results in entities
  feeRecipientEntity.save();
  feeRecipientCollateralTokenEntity.save();
}

/**
 * @notice Function to handle `LiquidityAdded` events emitted by DIVA Protocol when
 * liquidity is added to existing pools.
 * @param event `LiquidityAdded` event data.
 */
export function handleLiquidityAdded(event: LiquidityAdded): void {
  log.info("handleLiquidityAdded", []);

  // Update pool parameters
  handleLiquidityEvent(
    event.params.poolId,
    event.params.longRecipient,
    event.params.shortRecipient,
    event.address,
    event.transaction.from,
    event.block.timestamp,
    event.params.collateralAmount,
    new Address(0) // permissionedERC721Token; only relevant when a new pool is created
  );
}

/**
 * @notice Function to handle `LiquidityRemoved` events emitted by DIVA Protocol when
 * liquidity is removed from existing pools.
 * @param event `LiquidityRemoved` event data.
 */
export function handleLiquidityRemoved(event: LiquidityRemoved): void {
  log.info("handleLiquidityRemoved", []);

  // Update pool parameters
  handleLiquidityEvent(
    event.params.poolId,
    event.params.longTokenHolder,
    event.params.shortTokenHolder,
    event.address,
    event.transaction.from,
    event.block.timestamp,
    new BigInt(0), // Do not add to collateralBalanceGross on remove liquidity
    new Address(0) // permissionedERC721Token; only relevant when a new pool is created
  );
}

/**
 * @notice Function to handle `PoolIssued` events emitted by DIVA Protocol when a new
 * contingent pool is created.
 * @param event `PoolIssued` event data.
 */
export function handlePoolIssued(event: PoolIssued): void {
  log.info("handlePoolIssued fired", []);

  // Update pool parameters
  handleLiquidityEvent(
    event.params.poolId, // Newly created poolId
    event.params.longRecipient, // Long position token recipient address
    event.params.shortRecipient, // Short position token recipient address
    event.address, // DIVA contract address
    event.transaction.from, // Address that triggered the transaction emitting the PoolIssued event
    event.block.timestamp, // Block timestamp
    event.params.collateralAmount,
    event.params.permissionedERC721Token
  );
}

/**
 * @notice Function to handle `StatusChanged` events emitted by DIVA Protocol when the status of the
 * final reference value changes.
 * @param poolId The pool Id affected.
 * @param divaAddress DIVA contract address.
 */
function handleStatusChangedEvent(
  poolId: Bytes,
  divaAddress: Address,
): void {
  // Connect to DIVA contract
  let contract = DivaDiamond.bind(divaAddress);

  // Get parameters for the provided `poolId`
  let parameters = contract.getPoolParameters(poolId);

  // Load the Pool entity, which already exists at that point
  let poolEntity = Pool.load(poolId.toHexString());

  // Update relevant pool parameters
  poolEntity!.collateralBalance = parameters.collateralBalance;
  poolEntity!.finalReferenceValue = parameters.finalReferenceValue;
  poolEntity!.statusTimestamp = parameters.statusTimestamp;
  poolEntity!.payoutShort = parameters.payoutShort;
  poolEntity!.payoutLong = parameters.payoutLong;
  poolEntity!.statusFinalReferenceValue = _translateStatus(parameters.statusFinalReferenceValue);

  // Save results in entity
  poolEntity!.save();
}

// Auxiliary function to translate numeric status into a descriptive string
function _translateStatus(status: i32): string {
  if (status === 0) {
    return "Open";
  } else if (status === 1) {
    return "Submitted";
  } else if (status === 2) {
    return "Challenged";
  } else if (status === 3) {
    return "Confirmed";
  } else {
    return "Unknown";
  }
}

/**
 * @notice Function to handle `StatusChanged` events emitted by DIVA Protocol when the status of
 * the final reference value changes to Submitted, Challenged or Confirmed stage.
 * @param event `StatusChanged` event data.
 */
export function handleStatusChanged(event: StatusChanged): void {
  log.info("handleStatusChanged fired", []);

  // Update pool parameters including `finalReferenceValue`, `statusTimestamp`, `statusFinalReferenceValue`,
  // `payoutShort`, `payoutLong`, and (net) pool collateral balance (due to fees being charged on
  // final value confirmation).
  handleStatusChangedEvent(
    event.params.poolId,
    event.address
  );

  // Handle data emitted during challenges such as the challenger address as well as the new
  // proposed value.
  if (event.params.statusFinalReferenceValue === 2) {
    handleChallengeEvent(
      event.params.poolId,
      event.transaction.from,
      event.params.proposedFinalReferenceValue,
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    );
  }
}

/**
 * @notice Function to handle `FeeClaimAllocated` events emitted by DIVA Protocol when the
 * final value is confirmed and fees are allocated to the respective recipients.
 * @param event `FeeClaimAllocated` event data.
 */
export function handleFeeClaimAllocated(event: FeeClaimAllocated): void {
  log.info("handleFeeClaim fired", []);

  let contract = DivaDiamond.bind(event.address);
  let parameters = contract.getPoolParameters(event.params.poolId);
  handleFeeClaimEvent(parameters.collateralToken, event.params.recipient, event.address);
}
// @todo Check whether it handles reserved fee claims correctly, i.e. whether the reserved fee claim
// is reflected because for reserved fee claim, there is another event called `ReservedClaimAllocated`.

/**
 * @notice Function to handle `FeeClaimTransferred` events emitted by DIVA Protocol when users transfer
 * their fee claim to a new recipient.
 * @param event `FeeClaimTransferred` event data.
 */
export function handleFeeClaimTransferred(event: FeeClaimTransferred): void {
  log.info("handleFeeClaimTransferred fired", []);

  // Read updated fee claims for sender and recipient and store it in the respective entities 
  handleFeeClaimEvent(event.params.collateralToken, event.params.to, event.address);
  handleFeeClaimEvent(event.params.collateralToken, event.transaction.from, event.address);
}

/**
 * @notice Function to handle `FeeClaimed` events emitted by DIVA Protocol when data providers
 * or treasury claim their fees.
 * @param event `FeeClaimed` event data.
 */
export function handleFeeClaimed(event: FeeClaimed): void {
  log.info("handleFeeClaimed fired", []);

  // Read updated fee claim and store it in the respective entities 
  handleFeeClaimEvent(event.params.collateralToken, event.transaction.from, event.address);
}

/**
 * @notice Function to handle `PositionTokenRedeemed` events emitted by DIVA Protocol when
 * position token holders claim their payouts.
 * @dev Updates the (net) collateral balance in `Pool` entity.
 * @param event `PositionTokenRedeemed` event data.
 */
export function handlePositionTokenRedeemed(event: PositionTokenRedeemed): void {
  log.info("handlePositionTokenRedeemed fired", []);

  // Connect to DIVA contract
  let contract = DivaDiamond.bind(event.address);

  // Get parameters for the provided `poolId`
  let parameters = contract.getPoolParameters(event.params.poolId);

  // Load the Pool entity. It already exists at that point.
  let poolEntity = Pool.load(event.params.poolId.toHexString());

  // Update (net) pool collateral balance
  poolEntity!.collateralBalance = parameters.collateralBalance;

  // Save results in entity
  poolEntity!.save();
}

/**
 * @notice Function to handle `LimitOrderFilled` events emitted by 0x Protocol on
 * limit order fill.
 * @dev Updates the user position token holdings list.
 * @param event `LimitOrderFilled` event data.
 */
export function handleLimitOrderFilledEvent(event: LimitOrderFilled): void {
  log.info("handleLimitOrderFilledEvent", []);

  let id =
    event.transaction.hash.toHexString() +
    "-" +
    event.params.orderHash.toHex() +
    "-" +
    event.logIndex.toString();

  let nativeOrderFillEntity = NativeOrderFill.load(id);

  if (!nativeOrderFillEntity) {
    nativeOrderFillEntity = new NativeOrderFill(id);
    nativeOrderFillEntity.orderHash = event.params.orderHash;
    nativeOrderFillEntity.maker = event.params.maker;
    nativeOrderFillEntity.taker = event.params.taker;
    nativeOrderFillEntity.makerToken = event.params.makerToken;
    nativeOrderFillEntity.takerToken = event.params.takerToken;
    nativeOrderFillEntity.makerTokenFilledAmount = event.params.makerTokenFilledAmount;
    nativeOrderFillEntity.takerTokenFilledAmount = event.params.takerTokenFilledAmount;
    nativeOrderFillEntity.timestamp = event.block.timestamp;
    nativeOrderFillEntity.save();
  }

  // Buy Limit: maker token = collateral token; taker token = position token.
  // After fill, maker receives position tokens. Hence, add maker to user list.
  
  // Check if taker token is a position token. If it is, add recipient of position
  // token (maker) to user list. If not, proceed with checking whether the maker
  // token is a position token.
  let takerTokenEntity = PositionToken.load(event.params.takerToken.toHexString());
  if (takerTokenEntity) {
    // Taker token is position token.
    // Add recipient of position token (maker) to user list.
    let userEntity = User.load(event.params.maker.toHexString());
    if (!userEntity) {
      userEntity = new User(event.params.maker.toHexString());
      userEntity.save();
    }

    let userPositionTokenEntity = UserPositionToken.load(
      event.params.maker.toHexString() + "-" + event.params.takerToken.toHexString()
    );
    if (!userPositionTokenEntity) {
      userPositionTokenEntity = new UserPositionToken(
        event.params.maker.toHexString() + "-" + event.params.takerToken.toHexString()
      );
      userPositionTokenEntity.user = event.params.maker.toHexString();
      userPositionTokenEntity.positionToken = event.params.takerToken.toHexString();
      userPositionTokenEntity.receivedAt = event.block.timestamp;
      userPositionTokenEntity.save();
    }
  }

  // Sell Limit: maker token = position token; taker token = collateral token.
  // After fill, taker receives position tokens. Hence, add taker to user list.
  
  // Check if maker token is a position token. If it is, add recipient of position
  // token (taker) to user list. If not, don't update anything.
  let makerTokenEntity = PositionToken.load(event.params.makerToken.toHexString());
  if (makerTokenEntity) {
    // Maker token is a position token
    // Add recipient of position token (taker) to user list
    let userEntity = User.load(event.params.taker.toHexString());
    if (!userEntity) {
      userEntity = new User(event.params.taker.toHexString());
      userEntity.save();
    }

    let userPositionTokenEntity = UserPositionToken.load(
      event.params.taker.toHexString() + "-" + event.params.makerToken.toHexString()
    );
    if (!userPositionTokenEntity) {
      userPositionTokenEntity = new UserPositionToken(
        event.params.taker.toHexString() + "-" + event.params.makerToken.toHexString()
      );
      userPositionTokenEntity.user = event.params.taker.toHexString();
      userPositionTokenEntity.positionToken = event.params.makerToken.toHexString();
      userPositionTokenEntity.receivedAt = event.block.timestamp;
      userPositionTokenEntity.save();
    }
  }
}
