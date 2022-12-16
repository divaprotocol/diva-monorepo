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
  LimitOrder: ZERO_X_MESSAGE_STRUCT,
}
