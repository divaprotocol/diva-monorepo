
const AddressZero = '0x0000000000000000000000000000000000000000'

function getExpiryInSeconds(offsetInSeconds) {
    return Math.floor(Date.now() / 1000 + offsetInSeconds).toString(); // 60*60 = 1h; 60*60*24 = 1d, 60*60*24*365 = 1y
}

exports.AddressZero = AddressZero;
exports.getExpiryInSeconds = getExpiryInSeconds;