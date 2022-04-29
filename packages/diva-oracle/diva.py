contract_address = '0x07F0293a07703c583F4Fb4ce3aC64043732eF3bf'
abi = '''[
{
    "inputs": [
      { "internalType": "uint256", "name": "_poolId", "type": "uint256" },
      {
        "internalType": "uint256",
        "name": "_finalReferenceValue",
        "type": "uint256"
      },
      { "internalType": "bool", "name": "_allowChallenge", "type": "bool" }
    ],
    "name": "setFinalReferenceValue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
{
    "inputs": [
      { "internalType": "uint256", "name": "_poolId", "type": "uint256" }
    ],
    "name": "getPoolParameters",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "referenceAsset",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "expiryTime",
            "type": "uint256"
          },
          { "internalType": "uint256", "name": "floor", "type": "uint256" },
          {
            "internalType": "uint256",
            "name": "inflection",
            "type": "uint256"
          },
          { "internalType": "uint256", "name": "cap", "type": "uint256" },
          {
            "internalType": "uint256",
            "name": "supplyInitial",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "collateralToken",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "collateralBalanceShortInitial",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "collateralBalanceLongInitial",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "collateralBalance",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "shortToken",
            "type": "address"
          },
          { "internalType": "address", "name": "longToken", "type": "address" },
          {
            "internalType": "uint256",
            "name": "finalReferenceValue",
            "type": "uint256"
          },
          {
            "internalType": "enum LibDiamond.Status",
            "name": "statusFinalReferenceValue",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "redemptionAmountLongToken",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "redemptionAmountShortToken",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "statusTimestamp",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "dataProvider",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "redemptionFee",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "settlementFee",
            "type": "uint256"
          },
          { "internalType": "uint256", "name": "capacity", "type": "uint256" }
        ],
        "internalType": "struct LibDiamond.Pool",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]
'''