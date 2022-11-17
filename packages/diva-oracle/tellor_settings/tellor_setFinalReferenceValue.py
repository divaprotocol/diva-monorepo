import config.config as config
import tellor_settings.tellor_contracts as tellor
from termcolor import colored
PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY
from web3.exceptions import TimeExhausted

def setFinRefVal(pool_id, network, w3, my_contract):
    print(colored("Triggering setFinalReferenceValue()...", attrs=["bold"]))
    print("DIVAOracleTellor address: %s" % my_contract.address)
    print("Triggered by address: %s" % PUBLIC_KEY)
    with open('log.txt', 'a') as f:
        f.write("Triggering setFinalReferenceValue()...\n")
        f.write("DIVAOracleTellor address: %s\n" % my_contract.address)
        f.write("Triggered by address: %s\n" % PUBLIC_KEY)
    gas_price = w3.eth.gas_price
    try: 
        submit_txn = my_contract.functions.setFinalReferenceValue(int(pool_id)).buildTransaction(
            {
                "gasPrice": gas_price,
                "chainId": config.chain_id[network],
                "from": PUBLIC_KEY,
                "nonce": w3.eth.get_transaction_count(PUBLIC_KEY)
            }
        )
    except ValueError as err:
        print(colored("Failure: ", attrs=["bold"]) + err.args[0]["message"])
        with open('log.txt', 'a') as f:
            f.write("Failure: " + err.args[0]["message"])
            f.write("\n")
    except:
        print(colored("Failure: ", attrs=["bold"]) + "Unable to trigger setFinalReferenceValue")
        with open('log.txt', 'a') as f:
            f.write("Failure: " + "Unable to trigger setFinalReferenceValue\n")
    print("Nonce:", w3.eth.get_transaction_count(PUBLIC_KEY))
    with open('log.txt', 'a') as f:
        f.write("Nonce: %s\n" % w3.eth.get_transaction_count(PUBLIC_KEY))
    #print("For pool:", pool_id)
    signed_txn = w3.eth.account.sign_transaction(submit_txn, private_key=PRIVATE_KEY)
    txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    #print("transaction hash for successful transaction")
    #print(txn_hash.hex())
    try:
        transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=config.timeout)
    except TimeExhausted:
        print(colored("Failure: ", attrs=["bold"]) + "Timeout error. Transaction is not in chain after %s seconds" % config.timeout)
        with open('log.txt', 'a') as f:
            f.write("Failure: Timeout error. Transaction is not in chain after %s seconds. \n" % config.timeout)
    print("")
    print(colored("Success: ", attrs=["bold"]) + "Final Reference Value submitted")
    print("https://%s.etherscan.io/tx/%s" % (network, txn_hash.hex()))

    with open('log.txt', 'a') as f:
        f.write("\n")
        f.write("Success: " + "Final Reference Value submitted\n")
        f.write("https://%s.etherscan.io/tx/%s\n" % (network, txn_hash.hex()))
    #print("Final Reference Value submitted for pool id {} ".format(pool_id), "({})".format(network))