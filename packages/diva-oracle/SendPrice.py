from web3 import Web3

PRIVATE_KEY = '0x' + 'ca9af43b9f248bd8b8a2f51b4905325f1dc65e8ae0e8a96638f37ef60bbe1476'
wallet = '0xc948f2F172Fe25977E322c8D82F8f53338f8a051'

contract_address = '0x07F0293a07703c583F4Fb4ce3aC64043732eF3bf'

provider_url = 'https://ropsten.infura.io/v3/a6b3d560ce544297b265bb09f0d4bfa8'

w3 = Web3(Web3.HTTPProvider(provider_url))

print(w3.isConnected())

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

def sendPrice(pool_id, value):
    my_contract = w3.eth.contract(address=contract_address, abi=abi)
    setFinRef_txn = my_contract.functions.setFinalReferenceValue(int(pool_id), int(w3.toWei(value, 'ether')), False).buildTransaction(
        {
            "gasPrice": w3.eth.gas_price,
            "chainId": 3,
            "from": wallet,
            "nonce": w3.eth.get_transaction_count(wallet)
        }
    )

    signed_txn = w3.eth.account.sign_transaction(setFinRef_txn, private_key=PRIVATE_KEY)
    txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=1000)
    print("Price submitted: ")
    print(my_contract.functions.getPoolParameters(int(pool_id)).call())
