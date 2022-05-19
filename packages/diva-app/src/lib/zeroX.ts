export const zeroXDomain = ({
  verifyingContract,
  chainId,
}: {
  verifyingContract: string
  chainId: number
}) => ({
  chainId,
  verifyingContract,
  name: 'ZeroEx',
  version: '1.0.0',
})
const EIP712_DOMAIN_PARAMETERS = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
]

const ZERO_X_MESSAGE_STRUCT = [
  { type: 'address', name: 'makerToken' },
  { type: 'address', name: 'takerToken' },
  { type: 'uint128', name: 'makerAmount' },
  { type: 'uint128', name: 'takerAmount' },
  { type: 'uint128', name: 'takerTokenFeeAmount' },
  { type: 'address', name: 'maker' },
  { type: 'address', name: 'taker' },
  { type: 'address', name: 'sender' },
  { type: 'address', name: 'feeRecipient' },
  { type: 'bytes32', name: 'pool' },
  { type: 'uint64', name: 'expiry' },
  { type: 'uint256', name: 'salt' },
]

export const zeroXTypes = {
  EIP712Domain: EIP712_DOMAIN_PARAMETERS,
  LimitOrder: ZERO_X_MESSAGE_STRUCT,
}

export function create0xMessage({
  makerToken,
  takerToken,
  makerAmount,
  takerAmount,
  takerTokenFeeAmount,
  maker,
  taker,
  sender,
  feeRecipient,
  pool,
  expiry,
  salt,
}: {
  makerToken: string
  takerToken: string
  makerAmount: string
  takerAmount: string
  takerTokenFeeAmount: string
  maker: string
  taker: string
  sender: string
  feeRecipient: string
  pool: string
  expiry: number
  salt: string
}) {
  return {
    makerToken,
    takerToken,
    makerAmount,
    takerAmount,
    takerTokenFeeAmount,
    maker,
    taker,
    sender,
    feeRecipient,
    pool,
    expiry,
    salt,
  }
}
