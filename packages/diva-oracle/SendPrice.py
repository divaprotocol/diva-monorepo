import config

PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY


def sendPrice(pool_id, value, network, w3, my_contract, nonce):
    print("Sending price to smart contract ...")
    gas_price = w3.eth.gas_price
    setFinRef_txn = my_contract.functions.setFinalReferenceValue(int(pool_id), int(w3.toWei(value, 'ether')),
                                                                  False).buildTransaction(
        {
            "gasPrice": gas_price,
            "chainId": config.chain_id[network],
            "from": PUBLIC_KEY,
            "nonce": nonce
        }
    )
    print("Nonce:", nonce)
    print("For pool:", pool_id)
    signed_txn = w3.eth.account.sign_transaction(setFinRef_txn, private_key=PRIVATE_KEY)
    txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    print(txn_hash.hex())
    transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=config.timeout)
    print("Price submitted for pool id {} ".format(pool_id), "({})".format(network))
