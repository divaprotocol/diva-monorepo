
const ONE_DAY = 86400
const AddressZero = '0x0000000000000000000000000000000000000000'

function getExpiryInSeconds(offsetInSeconds) {
    return Math.floor(Date.now() / 1000 + offsetInSeconds).toString(); // 60*60 = 1h; 60*60*24 = 1d, 60*60*24*365 = 1y
}

async function advanceTime(time) {
    await network.provider.send("evm_increaseTime", [time])
    await network.provider.send("evm_mine")
}

async function setNextTimestamp(provider, timestamp) {
    await provider.send('evm_setNextBlockTimestamp', [timestamp])
}

async function getLastTimestamp() {
    /**
     * Changed this from ethers.provider.getBlockNumber since if evm_revert is used to return
     * to a snapshot, getBlockNumber will still return the last mined block rather than the
     * block height of the snapshot.
     */
    let currentBlock = await ethers.provider.getBlock('latest')
    return currentBlock.timestamp
}

async function mineBlock(provider, timestamp) {
    return provider.send('evm_mine', [timestamp])
}

exports.ONE_DAY = ONE_DAY;
exports.AddressZero = AddressZero;
exports.getExpiryInSeconds = getExpiryInSeconds;
exports.advanceTime = advanceTime;
exports.setNextTimestamp = setNextTimestamp;
exports.getLastTimestamp = getLastTimestamp;
exports.mineBlock = mineBlock;