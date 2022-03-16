import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import {
  DivaDiamond,
  LiquidityAdded,
  LiquidityRemoved,
  PoolIssued,
  StatusChanged,
} from "../generated/DivaDiamond/DivaDiamond";
import { Erc20Token } from "../generated/DivaDiamond/Erc20Token";
import { Pool, Challenge } from "../generated/schema";

/**
 *
 * handleChallengeEvent
 *
 * Addes challenge events
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
function handleLiquidityEvent(poolId: BigInt, address: Address, msgSender:Address): void {
  let contract = DivaDiamond.bind(address);
  let parameters = contract.getPoolParameters(poolId);
  let tokenContract = Erc20Token.bind(parameters.collateralToken);

  let entity = Pool.load(poolId.toString());

  if (!entity) {
    entity = new Pool(poolId.toString());
    entity.createdBy = msgSender;
  }

  entity.referenceAsset = parameters.referenceAsset;
  entity.inflection = parameters.inflection;
  entity.cap = parameters.cap;
  entity.floor = parameters.floor;
  entity.supplyShortInitial = parameters.supplyShortInitial;
  entity.supplyLongInitial = parameters.supplyLongInitial;
  entity.supplyShort = parameters.supplyShort;
  entity.supplyLong = parameters.supplyLong;
  entity.expiryDate = parameters.expiryDate;
  entity.collateralToken = parameters.collateralToken;
  entity.collateralTokenName = tokenContract.name();
  entity.collateralSymbol = tokenContract.symbol();
  entity.collateralDecimals = tokenContract.decimals();
  entity.collateralBalanceShortInitial =
    parameters.collateralBalanceShortInitial;
  entity.collateralBalanceLongInitial = parameters.collateralBalanceLongInitial;
  entity.collateralBalanceShort = parameters.collateralBalanceShort;
  entity.collateralBalanceLong = parameters.collateralBalanceLong;
  entity.shortToken = parameters.shortToken;
  entity.longToken = parameters.longToken;
  entity.finalReferenceValue = parameters.finalReferenceValue;
  entity.redemptionAmountLongToken = parameters.redemptionAmountLongToken;
  entity.redemptionAmountShortToken = parameters.redemptionAmountShortToken;
  entity.statusTimestamp = parameters.statusTimestamp;
  entity.dataFeedProvider = parameters.dataFeedProvider;
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

export function handleLiquidityAdded(event: LiquidityAdded): void {
  log.info("handleLiquidityAdded", []);
  handleLiquidityEvent(event.params.poolId, event.address, event.transaction.from);
}

export function handleLiquidityRemoved(event: LiquidityRemoved): void {
  log.info("handleLiquidityRemoved", []);
  handleLiquidityEvent(event.params.poolId, event.address, event.transaction.from);
}

export function handlePoolIssued(event: PoolIssued): void {
  log.info("handlePoolIssued fired", []);
  handleLiquidityEvent(event.params.poolId, event.address, event.transaction.from);
}

export function handleStatusChanged(event: StatusChanged): void {
  log.info("handleStatusChanged fired", []);
  handleLiquidityEvent(event.params.poolId, event.address, event.transaction.from);
  if ( event.params.settlementStatus === 2 ) {
    handleChallengeEvent(event.params.poolId, 
                          event.transaction.from,
                          event.params.proposedFinalReferenceValue,
                          event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  }
  
}
