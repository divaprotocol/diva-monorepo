import { Address, BigInt, log } from "@graphprotocol/graph-ts";
import { LimitOrderFilled } from "../generated/ExchangeProxy/IZeroEx";
import { NativeOrderFill } from "../generated/schema";

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
    }

    nativeOrderFillEntity.save();

}