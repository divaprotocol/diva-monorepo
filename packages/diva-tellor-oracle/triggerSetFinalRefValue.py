import config
import eth_abi
from Crypto.Hash import keccak
from web3 import Web3
import tellor

PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY


def setFinRefVal(pool_id, network, w3, my_contract):
    print("Triggering setFinalReferenceValue() ...")
    gas_price = w3.eth.gas_price

    submit_txn = my_contract.functions.setFinalReferenceValue(tellor.divaDiamond[network], pool_id).buildTransaction(
        {
            "gasPrice": gas_price,
            "chainId": config.chain_id[network],
            "from": PUBLIC_KEY,
            "nonce": w3.eth.get_transaction_count(PUBLIC_KEY)
        }
    )
    print("Nonce:", w3.eth.get_transaction_count(PUBLIC_KEY))
    print("For pool:", pool_id)
    signed_txn = w3.eth.account.sign_transaction(submit_txn, private_key=PRIVATE_KEY)
    txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    print(txn_hash.hex())
    transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=config.timeout)
    print("Price submitted for pool id {} ".format(pool_id), "({})".format(network))

poolId = 48423
w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL["ropsten"]))
DIVAOracleTellor_contract = w3.eth.contract(address=tellor.DIVAOracleTellor_contract_address["ropsten"], abi=tellor.DIVAOracleTellor_abi)
setFinRefVal(poolId, "ropsten", w3, DIVAOracleTellor_contract)
