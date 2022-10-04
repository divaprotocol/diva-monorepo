import config.config as config
import tellor_settings.tellor_contracts as tellor

PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY


def setFinRefVal(pool_id, network, w3, my_contract):
    print("Triggering setFinalReferenceValue() ...")
    gas_price = w3.eth.gas_price
    try: 
        submit_txn = my_contract.functions.setFinalReferenceValue(tellor.divaDiamond[network], int(pool_id)).buildTransaction(
            {
                "gasPrice": gas_price,
                "chainId": config.chain_id[network],
                "from": PUBLIC_KEY,
                "nonce": w3.eth.get_transaction_count(PUBLIC_KEY)
            }
        )
    except:
        print("unable to trigger setFinalreferenceValue")
    print("Nonce:", w3.eth.get_transaction_count(PUBLIC_KEY))
    print("For pool:", pool_id)
    signed_txn = w3.eth.account.sign_transaction(submit_txn, private_key=PRIVATE_KEY)
    txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    #print("transaction hash for successful transaction")
    #print(txn_hash.hex())
    transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=config.timeout)
    print("Final Reference Value submitted for pool id {} ".format(pool_id), "({})".format(network))