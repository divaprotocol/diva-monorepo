import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  DivaDiamond,
  LiquidityAdded,
  LiquidityRemoved,
  PoolIssued,
  StatusChanged,
  FeeClaimAllocated,
  FeeClaimTransferred,
  FeeClaimed,
  PositionTokenRedeemed
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
  TestnetUser,
  UserPositionToken,
  User,
  NativeOrderFill
} from "../generated/schema";

/**
 *
 * handleChallengeEvent
 *
 * Adds challenge events
 *
 */
function handleChallengeEvent(
  poolId: BigInt,
  challengedBy: Address,
  proposedFinalReferenceValue: BigInt,
  challengeId: string
): void {
  let challenge = new Challenge(challengeId);

  challenge.pool = poolId.toString();
  challenge.challengedBy = challengedBy;
  challenge.proposedFinalReferenceValue = proposedFinalReferenceValue;
  challenge.save();
}

/**
 * Context:
 * 
 * UserPositionToken entity: Frontend application may want to display a user's existing positions.
 * As looping through all position tokens that have ever been created in DIVA Protocol is not an efficient solution, 
 * a shortlist of position tokens that a user may own is maintained. This is achieved by logging any interaction where 
 * the user received position tokens in a UserPositionToken mapping. Interactions including creating a new pool,
 * adding liquidity to a new pool, purchasing position tokens.
 * Note that the user to position token mapping is not created if the user purchased the position token other than via 0x protocol.
 */

/**
 *
 * handleLiquidityEvent
 *
 * handles both events: Added and Removed and updates the correlating pool with
 * the current state of the it
 */
function handleLiquidityEvent(
  poolId: BigInt,
  longRecipient: Address,
  shortRecipient: Address,
  address: Address,
  msgSender: Address,
  blockTimestamp: BigInt
): void {

  // ***************************************
  // *** Initialize relevant connections ***
  // ***************************************

  // Connect to DIVA contract
  let contract = DivaDiamond.bind(address);

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

  // If not, add it
  if (!shortRecipientEntity) {
    shortRecipientEntity = new User(shortRecipient.toHexString());
    shortRecipientEntity.save();
  }

  // Check whether the short position token is already mapped to the user `shortRecipient`
  let userShortPositionTokenEntity = UserPositionToken.load(
    shortRecipient.toHexString() + "-" + parameters.shortToken.toHexString())
  
  // If not, add it
  if (!userShortPositionTokenEntity) {
    userShortPositionTokenEntity = new UserPositionToken(shortRecipient.toHexString() + "-" + parameters.shortToken.toHexString());
    userShortPositionTokenEntity.user = shortRecipient.toHexString();
    userShortPositionTokenEntity.positionToken = parameters.shortToken.toHexString();
    userShortPositionTokenEntity.receivedAt = blockTimestamp;

    // Save results in entity
    userShortPositionTokenEntity.save();
  }


  // **************************************************
  // *** Map long position token to `longRecipient` ***
  // **************************************************

  // Check whether the long position token is already mapped to the user `longRecipient`
  let userLongPositionTokenEntity = UserPositionToken.load(
    longRecipient.toHexString() + "-" + parameters.longToken.toHexString())

  // If not, add it
  if (!userLongPositionTokenEntity) {
    userLongPositionTokenEntity = new UserPositionToken(longRecipient.toHexString() + "-" + parameters.longToken.toHexString());
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
  let collateralTokenEntity = CollateralToken.load(
    parameters.collateralToken.toHexString()
  );

  // If not, add it
  if (!collateralTokenEntity) {
    collateralTokenEntity = new CollateralToken(
      parameters.collateralToken.toHexString()
    );

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

  // Check whether the long position token already exists in PositionToken entity
  let longTokenEntity = PositionToken.load(parameters.longToken.toHexString());

  // If not, add it
  if (!longTokenEntity) {
    longTokenEntity = new PositionToken(parameters.longToken.toHexString());

    let longTokenContract = PositionTokenABI.bind(parameters.longToken);

    longTokenEntity.name = longTokenContract.name();
    longTokenEntity.symbol = longTokenContract.symbol();
    longTokenEntity.decimals = longTokenContract.decimals();
    longTokenEntity.pool = longTokenContract.poolId().toString();
    longTokenEntity.owner = longTokenContract.owner();

    // Save results in entity
    longTokenEntity.save();
  }

  // ********************************************************
  // *** Add short position token to PositionToken entity ***
  // ********************************************************

  // Check whether the short position token already exists in PositionToken entity
  let shortTokenEntity = PositionToken.load(
    parameters.shortToken.toHexString()
  );

  // If not, add it
  if (!shortTokenEntity) {
    shortTokenEntity = new PositionToken(parameters.shortToken.toHexString());

    let shortTokenContract = PositionTokenABI.bind(parameters.shortToken);

    shortTokenEntity.name = shortTokenContract.name();
    shortTokenEntity.symbol = shortTokenContract.symbol();
    shortTokenEntity.decimals = shortTokenContract.decimals();
    shortTokenEntity.pool = shortTokenContract.poolId().toString();
    shortTokenEntity.owner = shortTokenContract.owner();

    // Save results in entity
    shortTokenEntity.save();
  }
  
  // ******************************************
  // *** Update Pool entity and testnetUser ***
  // ******************************************

  // Check whether a Pool entity already exists for the provided `poolId`
  let poolEntity = Pool.load(poolId.toString());

  // If not, add it. The if clause is entered on create contingent pool only. This is leveraged to update the task completion status
  // for create contingent pool related tasks 
  if (!poolEntity) {
    poolEntity = new Pool(poolId.toString());
    poolEntity.createdBy = msgSender;
    poolEntity.createdAt = blockTimestamp;

    // Add testnet user. Here msgSender, i.e. the user that triggered the transaction is the relevant user.
    // This addition is done once when the pool entity is established-
    let testnetUser = TestnetUser.load(msgSender.toHexString());
    if (!testnetUser) {
      testnetUser = new TestnetUser(msgSender.toHexString());
    }

    // Check what payoff profile type the user has created (binary, linear, convex or concave)
    // and flag the corresponding task as completed
    const unit = BigInt.fromString("1000000000000000000") // 1e18
    let gradient = parameters.gradient;
    if (parameters.floor.equals(parameters.cap)) {
        testnetUser.binaryPoolCreated = true
    } else {
      // Calculate the hypothetical gradient if it was a linear curve
      gradientLinear = (parameters.inflection.minus(parameters.floor)).times(unit).div(
        parameters.cap.minus(parameters.floor));
      
      // Compare hypothetical gradientLinear with actual gradient set by user
      if (gradient.equals(gradientLinear)) {
        testnetUser.linearPoolCreated = true
      } else if (gradient.gt(gradientLinear)) {
        testnetUser.concavePoolCreated = true
      } else if (gradient.lt(gradientLinear)) {
        testnetUser.convexPoolCreated = true
      }
    }

    // Save results in entity
    testnetUser.save();
  }


  // **************************************************
  // *** Update pool entity ***
  // **************************************************

  poolEntity.floor = parameters.floor;
  poolEntity.inflection = parameters.inflection;
  poolEntity.cap = parameters.cap;
  poolEntity.gradient = parameters.gradient;
  poolEntity.collateralBalance = parameters.collateralBalance;
  poolEntity.finalReferenceValue = parameters.finalReferenceValue;
  poolEntity.capacity = parameters.capacity;
  poolEntity.statusTimestamp = parameters.statusTimestamp;
  poolEntity.shortToken = parameters.shortToken.toHexString();
  poolEntity.payoutShort = parameters.payoutShort;
  poolEntity.longToken = parameters.longToken.toHexString();
  poolEntity.payoutLong = parameters.payoutLong;
  poolEntity.collateralToken = collateralTokenEntity.id;
  poolEntity.expiryTime = parameters.expiryTime;
  poolEntity.dataProvider = parameters.dataProvider;
  poolEntity.protocolFee = parameters.protocolFee;
  poolEntity.settlementFee = parameters.settlementFee;
  poolEntity.referenceAsset = parameters.referenceAsset;
  poolEntity.supplyShort = shortTokenContract.totalSupply();
  poolEntity.supplyLong = longTokenContract.totalSupply();

  let status = parameters.statusFinalReferenceValue;

  if (status === 0) {
    poolEntity.statusFinalReferenceValue = "Open";
  } else if (status === 1) {
    poolEntity.statusFinalReferenceValue = "Submitted";
  } else if (status === 2) {
    poolEntity.statusFinalReferenceValue = "Challenged";
  } else if (status === 3) {
    poolEntity.statusFinalReferenceValue = "Confirmed";
  }

  // Save results in entity
  poolEntity.save();
}

function handleFeeClaimEvent(
  collateralTokenAddress: Address,
  recipient: Address,
  amount: BigInt,
  isIncrease: bool
): void {
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
    feeRecipientCollateralTokenEntity.collateralToken =
      collateralTokenAddress.toHexString();
  }

  if (isIncrease) {
    feeRecipientCollateralTokenEntity.amount =
      feeRecipientCollateralTokenEntity.amount.plus(amount);
  } else {
    feeRecipientCollateralTokenEntity.amount =
      feeRecipientCollateralTokenEntity.amount.minus(amount);
  }

  feeRecipientEntity.save();
  feeRecipientCollateralTokenEntity.save();
}

export function handleLiquidityAdded(event: LiquidityAdded): void {
  log.info("handleLiquidityAdded", []);
  handleLiquidityEvent(
    event.params.poolId,
    event.params.longRecipient,
    event.params.shortRecipient,
    event.address,
    event.transaction.from,
    event.block.timestamp
  );

  let testnetUser = TestnetUser.load(event.transaction.from.toHexString());
  if (!testnetUser) {
    testnetUser = new TestnetUser(event.transaction.from.toHexString());
  }
  testnetUser.liquidityAdded = true;
  testnetUser.save();

}

export function handleLiquidityRemoved(event: LiquidityRemoved): void {
  log.info("handleLiquidityRemoved", []);
  handleLiquidityEvent(
    event.params.poolId,
    // TODO what to put here as no longRecipient is emitted here
    // TODO what to put here as no shortRecipient is emitted here
    event.address,
    event.transaction.from,
    event.block.timestamp
  );

  let testnetUser = TestnetUser.load(event.transaction.from.toHexString());
  if (!testnetUser) {
    testnetUser = new TestnetUser(event.transaction.from.toHexString());
  }
  testnetUser.liquidityRemoved = true;
  testnetUser.save();

}

export function handlePoolIssued(event: PoolIssued): void {
  log.info("handlePoolIssued fired", []);
  handleLiquidityEvent(
    event.params.poolId,          // Newly created poolId
    event.params.longRecipient,   // Long position token recipient address
    event.params.shortRecipient,  // Short position token recipient address
    event.address,                // DIVA contract address
    event.transaction.from,       // Address that triggered the transaction emitting the PoolIssued event
    event.block.timestamp         // Block timestamp
  );
}

export function handleStatusChanged(event: StatusChanged): void {
  log.info("handleStatusChanged fired", []);
  handleLiquidityEvent(
    event.params.poolId,
    event.address,
    event.transaction.from,
    event.block.timestamp
  );
  if (event.params.statusFinalReferenceValue === 2) {
    handleChallengeEvent(
      event.params.poolId,
      event.transaction.from,
      event.params.proposedFinalReferenceValue,
      event.transaction.hash.toHex() + "-" + event.logIndex.toString()
    );

    let testnetUser = TestnetUser.load(event.transaction.from.toHexString());
    if (!testnetUser) {
      testnetUser = new TestnetUser(event.transaction.from.toHexString());
    }
    testnetUser.reportedValueChallenged = true;
    testnetUser.save();

  } else if (event.params.statusFinalReferenceValue === 1) {
    // log.info("event.address: ", [event.address.toHexString()])
    // log.info("event.transaction.from: ", [event.transaction.from.toHexString()])
    let testnetUser = TestnetUser.load(event.transaction.from.toHexString());
    if (!testnetUser) {
      testnetUser = new TestnetUser(event.transaction.from.toHexString());
    }
    testnetUser.finalValueReported = true;
    testnetUser.save();

  }
}

export function handleFeeClaimAllocated(event: FeeClaimAllocated): void {
  log.info("handleFeeClaim fired", []);
  let contract = DivaDiamond.bind(event.address);
  let parameters = contract.getPoolParameters(event.params.poolId);
  handleFeeClaimEvent(
    parameters.collateralToken,
    event.params.recipient,
    event.params.amount,
    true
  );
}

export function handleFeeClaimTransferred(event: FeeClaimTransferred): void {
  log.info("handleFeeClaimTransferred fired", []);

  handleFeeClaimEvent(
    event.params.collateralToken,
    event.params.to,
    event.params.amount,
    true
  ); // true is increase
  handleFeeClaimEvent(
    event.params.collateralToken,
    event.transaction.from,
    event.params.amount,
    false
  ); // false is decrease

  let testnetUser = TestnetUser.load(event.transaction.from.toHexString());
  if (!testnetUser) {
    testnetUser = new TestnetUser(event.transaction.from.toHexString());
  }
  testnetUser.feeClaimTransferred = true;
  testnetUser.save();

}

export function handleFeeClaimed(event: FeeClaimed): void {
  log.info("handleFeeClaimed fired", []);
  handleFeeClaimEvent(
    event.params.collateralToken,
    event.transaction.from,
    event.params.amount,
    false
  );

  let testnetUser = TestnetUser.load(event.transaction.from.toHexString());
  if (!testnetUser) {
    testnetUser = new TestnetUser(event.transaction.from.toHexString());
  }
  testnetUser.feeClaimed = true;
  testnetUser.save();
}

export function handlePositionTokenRedeemed(event: PositionTokenRedeemed): void {
  log.info("handlePositionTokenRedeemed fired", []);

  let testnetUser = TestnetUser.load(event.transaction.from.toHexString());
  if (!testnetUser) {
    testnetUser = new TestnetUser(event.transaction.from.toHexString());
  }
  testnetUser.positionTokenRedeemed = true;
  testnetUser.save();

}

export function handleLimitOrderFilledEvent(event: LimitOrderFilled): void {
  log.info("handleLimitOrderFilledEvent", []);

  let id = event.transaction.hash.toHexString() + '-' + event.params.orderHash.toHex() + '-' + event.logIndex.toString();

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

  let testnetUserMaker = TestnetUser.load(event.params.maker.toHexString());
  if (!testnetUserMaker) {
    testnetUserMaker = new TestnetUser(event.params.maker.toHexString());
  }

  let testnetUserTaker = TestnetUser.load(event.params.taker.toHexString());
  if (!testnetUserTaker) {
    testnetUserTaker = new TestnetUser(event.params.taker.toHexString());
  }

  // buy limit: maker token = collateral token; taker token = position token
  // after fill, maker receives position tokens
  // check if taker token is a position token
  let takerTokenEntity = PositionToken.load(event.params.takerToken.toHexString());
  if (takerTokenEntity) {
    // taker token is position token (buy limit order)
    // add buyer of position token to user list (seller already added before)
    let userEntity = User.load(event.params.maker.toHexString());
    if (!userEntity) {
      userEntity = new User(event.params.maker.toHexString());
      userEntity.save();
    }

    let userPositionTokenEntity = UserPositionToken.load(
      event.params.maker.toHexString() + "-" + event.params.takerToken.toHexString())
    if (!userPositionTokenEntity) {
      userPositionTokenEntity = new UserPositionToken(event.params.maker.toHexString() + "-" + event.params.takerToken.toHexString());
      userPositionTokenEntity.user = event.params.maker.toHexString();
      userPositionTokenEntity.positionToken = event.params.takerToken.toHexString();
      userPositionTokenEntity.receivedAt = event.block.timestamp;
      userPositionTokenEntity.save();
    }

    // Update TestnetUser entity
    testnetUserMaker.buyLimitOrderCreatedAndFilled = true;
    testnetUserTaker.buyLimitOrderFilled = true;
    testnetUserMaker.save();
    testnetUserTaker.save();
  } 
  
  // sell limit: maker token = position token; taker token = collateral token
  // after fill, taker receives position tokens
  let makerTokenEntity = PositionToken.load(event.params.makerToken.toHexString());
  if (makerTokenEntity) {
    let userEntity = User.load(event.params.taker.toHexString());
    if (!userEntity) {
      userEntity = new User(event.params.taker.toHexString());
      userEntity.save();
    }

    let userPositionTokenEntity = UserPositionToken.load(
      event.params.taker.toHexString() + "-" + event.params.makerToken.toHexString())
    if (!userPositionTokenEntity) {
      userPositionTokenEntity = new UserPositionToken(event.params.taker.toHexString() + "-" + event.params.makerToken.toHexString());
      userPositionTokenEntity.user = event.params.taker.toHexString();
      userPositionTokenEntity.positionToken = event.params.makerToken.toHexString();
      userPositionTokenEntity.receivedAt = event.block.timestamp;
      userPositionTokenEntity.save();
    }

    // Update TestnetUser entity
    testnetUserMaker.sellLimitOrderCreatedAndFilled = true;
    testnetUserTaker.sellLimitOrderFilled = true;
    testnetUserMaker.save();
    testnetUserTaker.save();
  }

}
