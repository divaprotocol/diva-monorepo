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

// Fill order from acc1: https://ropsten.etherscan.io/tx/0xa4c687b28f4c67527b1e70b8a608a05b95e126fb5b7f9077ebbcc604cc4ac19b
// FillLimitOrder event in 0x: https://ropsten.etherscan.io/tx/0xa4c687b28f4c67527b1e70b8a608a05b95e126fb5b7f9077ebbcc604cc4ac19b#eventlog