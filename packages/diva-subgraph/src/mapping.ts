import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  DivaDiamond,
  LiquidityAdded,
  LiquidityRemoved,
  PoolIssued,
  StatusChanged,
  FeeClaimAllocated,
  FeeClaimTransferred,
  FeesClaimed,
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
 *
 * handleLiquidityEvent
 *
 * handles both events: Added and Removed and updates the correlating pool with
 * the current state of the it
 */
function handleLiquidityEvent(
  poolId: BigInt,
  address: Address,
  msgSender: Address,
  blockTimestamp: BigInt
): void {
  let contract = DivaDiamond.bind(address);
  let parameters = contract.getPoolParameters(poolId);
  let shortTokenContract = PositionTokenABI.bind(parameters.shortToken);
  let longTokenContract = PositionTokenABI.bind(parameters.longToken);

  let entity = Pool.load(poolId.toString());
  
  //set user to position token mapping
  let userEntity = User.load(msgSender.toHexString());
  if (!userEntity) {
    userEntity = new User(msgSender.toHexString());
    userEntity.save();
  }
  let userShortPositionTokenEntity = UserPositionToken.load(
    msgSender.toHexString() + "-" + parameters.shortToken.toHexString())
  if (!userShortPositionTokenEntity) {
    userShortPositionTokenEntity = new UserPositionToken(msgSender.toHexString() + "-" + parameters.shortToken.toHexString());
    userShortPositionTokenEntity.user = msgSender.toHexString();
    userShortPositionTokenEntity.positionToken = parameters.shortToken.toHexString();
    userShortPositionTokenEntity.save();
  }
  let userLongPositionTokenEntity = UserPositionToken.load(
    msgSender.toHexString() + "-" + parameters.longToken.toHexString())
  if (!userLongPositionTokenEntity) {
    userLongPositionTokenEntity = new UserPositionToken(msgSender.toHexString() + "-" + parameters.longToken.toHexString());
    userLongPositionTokenEntity.user = msgSender.toHexString();
    userLongPositionTokenEntity.positionToken = parameters.longToken.toHexString();
    userLongPositionTokenEntity.save();
  }


  //pool entity
  if (!entity) {
    entity = new Pool(poolId.toString());
    entity.createdBy = msgSender;
    entity.createdAt = blockTimestamp;

    let testnetUser = TestnetUser.load(msgSender.toHexString());
    if (!testnetUser) {
      testnetUser = new TestnetUser(msgSender.toHexString());
    }

    const unit = BigInt.fromString("1000000000000000000") // 1e18

    let gradient = parameters.collateralBalanceLongInitial.times(unit).div(
      parameters.collateralBalanceLongInitial.plus(parameters.collateralBalanceShortInitial)) // TODO: account for collateral token decimals and then scale to 18 decimals

    let gradientLinear = new BigInt(1); // CHECK with Sascha
    if (parameters.cap != parameters.floor) {
      gradientLinear = (parameters.inflection.minus(parameters.floor)).times(unit).div(
        parameters.cap.minus(parameters.floor));
    }

    if (parameters.floor.equals(parameters.inflection) &&
      parameters.inflection.equals(parameters.cap)) {
        testnetUser.binaryPoolCreated = true
    } else if (gradient.equals(gradientLinear)) {
      testnetUser.linearPoolCreated = true
    } else if (gradient.gt(gradientLinear)) {
      testnetUser.concavePoolCreated = true
    } else if (gradient.lt(gradientLinear)) {
      testnetUser.convexPoolCreated = true
    }
    testnetUser.save();
  }

  let collateralTokenEntity = CollateralToken.load(
    parameters.collateralToken.toHexString()
  );
  if (!collateralTokenEntity) {
    collateralTokenEntity = new CollateralToken(
      parameters.collateralToken.toHexString()
    );

    let tokenContract = Erc20Token.bind(parameters.collateralToken);
    collateralTokenEntity.name = tokenContract.name();
    collateralTokenEntity.symbol = tokenContract.symbol();
    collateralTokenEntity.decimals = tokenContract.decimals();

    collateralTokenEntity.save();
  }

  let longTokenEntity = PositionToken.load(parameters.longToken.toHexString());
  if (!longTokenEntity) {
    longTokenEntity = new PositionToken(parameters.longToken.toHexString());

    let longTokenContract = PositionTokenABI.bind(parameters.longToken);

    longTokenEntity.name = longTokenContract.name();
    longTokenEntity.symbol = longTokenContract.symbol();
    longTokenEntity.decimals = longTokenContract.decimals();
    longTokenEntity.pool = longTokenContract.poolId().toString();
    longTokenEntity.owner = longTokenContract.owner();
    longTokenEntity.createdAt = blockTimestamp;

    longTokenEntity.save();
  }

  let shortTokenEntity = PositionToken.load(
    parameters.shortToken.toHexString()
  );
  if (!shortTokenEntity) {
    shortTokenEntity = new PositionToken(parameters.shortToken.toHexString());

    let shortTokenContract = PositionTokenABI.bind(parameters.shortToken);

    shortTokenEntity.name = shortTokenContract.name();
    shortTokenEntity.symbol = shortTokenContract.symbol();
    shortTokenEntity.decimals = shortTokenContract.decimals();
    shortTokenEntity.pool = shortTokenContract.poolId().toString();
    shortTokenEntity.owner = shortTokenContract.owner();
    shortTokenEntity.createdAt = blockTimestamp;

    shortTokenEntity.save();
  }

  entity.referenceAsset = parameters.referenceAsset;
  entity.floor = parameters.floor;
  entity.inflection = parameters.inflection;
  entity.cap = parameters.cap;
  entity.supplyInitial = parameters.supplyInitial;
  entity.supplyShort = shortTokenContract.totalSupply();
  entity.supplyLong = longTokenContract.totalSupply();
  entity.expiryTime = parameters.expiryTime;
  entity.collateralToken = collateralTokenEntity.id;
  entity.collateralBalanceShortInitial =
    parameters.collateralBalanceShortInitial;
  entity.collateralBalanceLongInitial = parameters.collateralBalanceLongInitial;
  entity.collateralBalance = parameters.collateralBalance;
  entity.shortToken = parameters.shortToken.toHexString();
  entity.longToken = parameters.longToken.toHexString();
  entity.finalReferenceValue = parameters.finalReferenceValue;
  entity.redemptionAmountLongToken = parameters.redemptionAmountLongToken;
  entity.redemptionAmountShortToken = parameters.redemptionAmountShortToken;
  entity.statusTimestamp = parameters.statusTimestamp;
  entity.dataProvider = parameters.dataProvider;
  entity.redemptionFee = parameters.redemptionFee;
  entity.settlementFee = parameters.settlementFee;
  entity.capacity = parameters.capacity;

  let status = parameters.statusFinalReferenceValue;

  if (status === 0) {
    entity.statusFinalReferenceValue = "Open";
  } else if (status === 1) {
    entity.statusFinalReferenceValue = "Submitted";
  } else if (status === 2) {
    entity.statusFinalReferenceValue = "Challenged";
  } else if (status === 3) {
    entity.statusFinalReferenceValue = "Confirmed";
  }

  entity.save();
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
    event.params.poolId,
    event.address,
    event.transaction.from,
    event.block.timestamp
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
  testnetUser.feeClaimsTransferred = true;
  testnetUser.save();

}

export function handleFeesClaimed(event: FeesClaimed): void {
  log.info("handleFeesClaimed fired", []);
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
  testnetUser.feesClaimed = true;
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
      userPositionTokenEntity.save();
    }

    // Update TestnetUser entity
    testnetUserMaker.sellLimitOrderCreatedAndFilled = true;
    testnetUserTaker.sellLimitOrderFilled = true;
    testnetUserMaker.save();
    testnetUserTaker.save();
  }

}
