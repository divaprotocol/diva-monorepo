contract_address = {
"ropsten": '0xebBAA31B1Ebd727A1a42e71dC15E304aD8905211',
"rinkeby": '0x3481C73363b52a26068b1C7006CEF98670FEE514',
"kovan": '0x69E0577cAd908D9098F36dfbC4Ec36ad09920F4b',
"mumbai": '0x625aBcb0C7371d6691796E972089d75eD356523b',
"polygon": '0x131b154c13c7F2Ac4A0cC7798389A90B536F19f0',
"goerli": '0x8f138cfC5de71FCde7FdeCd87EAC6Aa6A536Bf85'
}

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