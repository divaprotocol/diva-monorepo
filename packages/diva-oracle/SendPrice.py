from web3 import Web3
import config
import diva

PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY

#w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))
#print(w3.isConnected())

def sendPrice(pool_id, value, network, w3):
    print("Sending price to smart contract ...")
    my_contract = w3.eth.contract(address=diva.contract_address[network], abi=diva.abi)
    setFinRef_txn = my_contract.functions.setFinalReferenceValue(int(pool_id), int(w3.toWei(value, 'ether')), False).buildTransaction(
        {
            "gasPrice": w3.eth.gas_price,
            "chainId": config.chain_id[network],
            "from": PUBLIC_KEY,
            "nonce": w3.eth.get_transaction_count(PUBLIC_KEY)
        }
    )

    signed_txn = w3.eth.account.sign_transaction(setFinRef_txn, private_key=PRIVATE_KEY)
    txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=1000)
    print("Price submitted for pool id {} ".format(pool_id), "({})".format(network))
    #print(my_contract.functions.getPoolParameters(int(pool_id)).call())