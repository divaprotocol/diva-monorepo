import config.config as config
import tellor_settings.tellor_contracts as tellor
from termcolor import colored
PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY
from web3.exceptions import TimeExhausted
from lib.recorder import printb, printn, printbAll

def setFinRefVal(pool_id, network, w3, my_contract):
    printbAll("Triggering setFinalReferenceValue()...")
    printn("DIVAOracleTellor address: %s" % my_contract.address)
    printn("Triggered by address: %s" % PUBLIC_KEY)

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
    except Exception as err:
        printb("Failure: ", err.args[0].__str__())


    printn("Nonce: %s" % w3.eth.get_transaction_count(PUBLIC_KEY))

    signed_txn = w3.eth.account.sign_transaction(submit_txn, private_key=PRIVATE_KEY)
    try:
        txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=config.timeout)
    #except TimeExhausted:
    #    printb("Failure: ", "Timeout error. Transaction is not in chain after %s seconds" % config.timeout)
    except Exception as err:
        printb("Failure: ", err.args[0].__str__())
    printn("")
    printb("Success: ", "Final Reference Value submitted")
    printn("https://%s.etherscan.io/tx/%s" % (network, txn_hash.hex()))
    printn("Base Fee Per Gas: %s Gwei" % (w3.eth.fee_history(1, transaction_receipt.blockNumber)['baseFeePerGas'][0]/1000000000))
    printn("Effective Gas Price: %s Gwei" % (transaction_receipt.effectiveGasPrice/1000000000))
    printn("Gas Used: %s" % transaction_receipt.gasUsed)

    #print("Final Reference Value submitted for pool id {} ".format(pool_id), "({})".format(network))