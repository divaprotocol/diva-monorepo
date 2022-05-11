from web3 import Web3
import json
import os

from ChainSet import Chain

# here pull keys and Diva contract address from config.json
# Must create a config.json file with below format
'''
{
    "wallet" :
    "private_key" : 
    "contract_address" : 
}
'''
e = Chain()

PRIVATE_KEY = os.environ.get('PRIVATE_KEY')
WALLET = os.environ.get('WALLET')
# 0x07F0293a07703c583F4Fb4ce3aC64043732eF3bf
CONTRACT_ADDRESS = e.contract_address()
e = Chain()

e.price_infra()


provider_url = e.price_infra()
print(provider_url)
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
    my_contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)
    #print("contract: {}", my_contract)
    #print(w3.eth.get_transaction_count(wallet))
    #print(w3.eth.gas_price)
    setFinRef_txn = my_contract.functions.setFinalReferenceValue(int(pool_id), int(w3.toWei(value, 'ether')), False).buildTransaction(
        {
            "gasPrice": w3.eth.gas_price,
            "chainId": 3,
            "from": WALLET,
            "nonce": w3.eth.get_transaction_count(WALLET)
        }
    )

    signed_txn = w3.eth.account.sign_transaction(setFinRef_txn, private_key=PRIVATE_KEY)
    txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=1000)
    print("Price submitted: ")
    print(my_contract.functions.getPoolParameters(int(pool_id)).call())
