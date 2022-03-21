import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  DivaDiamond,
  LiquidityAdded,
  LiquidityRemoved,
  PoolIssued,
  StatusChanged,
  FeeClaimAllocated,
  FeeClaimTransferred,
  FeesClaimed
} from "../generated/DivaDiamond/DivaDiamond";
import { Erc20Token } from "../generated/DivaDiamond/Erc20Token";
import { PositionTokenABI } from "../generated/DivaDiamond/PositionTokenABI";
import { Pool, Challenge, FeeRecipient, CollateralToken, FeeRecipientCollateralToken, PositionToken } from "../generated/schema";

/**
 *
 * handleChallengeEvent
 *
 * Adds challenge events
 * 
 */
function handleChallengeEvent(poolId: BigInt, challengedBy: Address, proposedFinalReferenceValue: BigInt, challengeId: string ): void {
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
function handleLiquidityEvent(poolId: BigInt, address: Address, msgSender:Address, blockTimestamp: BigInt): void {
  let contract = DivaDiamond.bind(address);
  let parameters = contract.getPoolParameters(poolId);
  let shortTokenContract = PositionTokenABI.bind(parameters.shortToken);
  let longTokenContract = PositionTokenABI.bind(parameters.longToken);

  let entity = Pool.load(poolId.toString());
  if (!entity) {
    entity = new Pool(poolId.toString());
    entity.createdBy = msgSender;
    entity.createdAt = blockTimestamp;
  }

  let collateralTokenEntity = CollateralToken.load(parameters.collateralToken.toHexString());  
  if (!collateralTokenEntity) {
    collateralTokenEntity = new CollateralToken(parameters.collateralToken.toHexString());
    
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

    longTokenEntity.save();
  }

  let shortTokenEntity = PositionToken.load(parameters.shortToken.toHexString());  
  if (!shortTokenEntity) {
    shortTokenEntity = new PositionToken(parameters.shortToken.toHexString());

    let shortTokenContract = PositionTokenABI.bind(parameters.shortToken); 

    shortTokenEntity.name = shortTokenContract.name();
    shortTokenEntity.symbol = shortTokenContract.symbol();
    shortTokenEntity.decimals = shortTokenContract.decimals();
    shortTokenEntity.pool = shortTokenContract.poolId().toString();
    shortTokenEntity.owner = shortTokenContract.owner();

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
  entity.collateralBalanceShortInitial = parameters.collateralBalanceShortInitial;
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

function handleFeeClaimEvent(collateralTokenAddress: Address, recipient: Address, amount: BigInt, isIncrease: bool): void {
  
  let feeRecipientEntity = FeeRecipient.load(recipient.toHexString());
  let feeRecipientCollateralTokenEntity = FeeRecipientCollateralToken.load(recipient.toHexString() + "-" + 
  collateralTokenAddress.toHexString());

  if (!feeRecipientEntity) {
    feeRecipientEntity = new FeeRecipient(recipient.toHexString());
  }

  if (!feeRecipientCollateralTokenEntity) {
    feeRecipientCollateralTokenEntity = new FeeRecipientCollateralToken(recipient.toHexString() + "-" + 
    collateralTokenAddress.toHexString());
    feeRecipientCollateralTokenEntity.feeRecipient = recipient.toHexString();
    feeRecipientCollateralTokenEntity.collateralToken = collateralTokenAddress.toHexString();
  }

  if (isIncrease) {
    feeRecipientCollateralTokenEntity.amount = feeRecipientCollateralTokenEntity.amount.plus(amount);
  } else {
    feeRecipientCollateralTokenEntity.amount = feeRecipientCollateralTokenEntity.amount.minus(amount);    
  }

  feeRecipientEntity.save();
  feeRecipientCollateralTokenEntity.save();
}

export function handleLiquidityAdded(event: LiquidityAdded): void {
  log.info("handleLiquidityAdded", []);
  handleLiquidityEvent(event.params.poolId, event.address, event.transaction.from, event.block.timestamp);
}

export function handleLiquidityRemoved(event: LiquidityRemoved): void {
  log.info("handleLiquidityRemoved", []);
  handleLiquidityEvent(event.params.poolId, event.address, event.transaction.from, event.block.timestamp);
}

export function handlePoolIssued(event: PoolIssued): void {
  log.info("handlePoolIssued fired", []);
  handleLiquidityEvent(event.params.poolId, event.address, event.transaction.from, event.block.timestamp);
}

export function handleStatusChanged(event: StatusChanged): void {
  log.info("handleStatusChanged fired", []);
  handleLiquidityEvent(event.params.poolId, event.address, event.transaction.from, event.block.timestamp);
  if ( event.params.statusFinalReferenceValue === 2 ) {
    handleChallengeEvent(event.params.poolId, 
                          event.transaction.from,
                          event.params.proposedFinalReferenceValue,
                          event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  }
}

export function handleFeeClaimAllocated(event: FeeClaimAllocated): void {
  log.info("handleFeeClaim fired", []);
  let contract = DivaDiamond.bind(event.address);
  let parameters = contract.getPoolParameters(event.params.poolId);
  handleFeeClaimEvent(parameters.collateralToken, event.params.recipient, event.params.amount, true);
}

export function handleFeeClaimTransferred(event: FeeClaimTransferred): void {
  log.info("handleFeeClaimTransferred fired", []);

  handleFeeClaimEvent(event.params.collateralToken, event.params.to, event.params.amount, true); // true is increase
  handleFeeClaimEvent(event.params.collateralToken, event.transaction.from, event.params.amount, false); // false is decrease
}

export function handleFeesClaimed(event: FeesClaimed): void {
  log.info("handleFeesClaimed fired", []);
  handleFeeClaimEvent(event.params.collateralToken, event.transaction.from, event.params.amount, false);
}



// IMPORTANT: Updated the ABI as well!!!
