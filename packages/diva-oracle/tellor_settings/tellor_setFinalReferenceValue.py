import config.config as config
import time
PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY
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

        printn("Nonce: %s" % w3.eth.get_transaction_count(PUBLIC_KEY))

        signed_txn = w3.eth.account.sign_transaction(submit_txn, private_key=PRIVATE_KEY)

        txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=config.timeout)

        printn("")
        printb("Success: ", "Final Reference Value submitted")
        printn("https://%s.etherscan.io/tx/%s" % (network, txn_hash.hex()))
        time.sleep(5)
        try:
            bf = w3.eth.fee_history(1, transaction_receipt.blockNumber)['baseFeePerGas'][0]/1000000000
            gp = transaction_receipt.effectiveGasPrice/1000000000
            gu = transaction_receipt.gasUsed
            printn("Base Fee Per Gas: %s Gwei" % bf)
            printn("Effective Gas Price: %s Gwei" % gp)
            printn("Gas Used: %s" % gu)
        except:
            printn("No Gas Data available at this point.")
        return 0
    except Exception as err:
        printb("Failure: ", err.args[0].__str__())
        return 1

