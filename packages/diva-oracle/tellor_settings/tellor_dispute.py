import config.config as config
from Crypto.Hash import keccak
import tellor_settings.tellor_contracts as tellor
import eth_abi
import time
from lib.recorder import printb, printn, printc


PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY

def beginDispute(pool_id, idxx, w3, network, contract_gov, my_contract):
    idx= int(idxx)
    queryDataArgs = eth_abi.encode_abi(["int", "address", "int"], [int(pool_id), tellor.divaDiamond[network], int(config.chain_id[network])])
    queryData = eth_abi.encode_abi(["string", "bytes"], ["DIVAProtocol", queryDataArgs])
    queryId = keccak.new(digest_bits=256)
    queryId.update(queryData)
    values = []
    timestmp = my_contract.functions.getTimestampbyQueryIdandIndex('0x' + queryId.hexdigest(), idx).call()
    #disp_before = my_contract.functions.isDisputed('0x' + queryId.hexdigest(), timestmp).call()


    gas_price = w3.eth.gas_price
    try:
        submit_txn = contract_gov.functions.beginDispute('0x' + queryId.hexdigest(), timestmp).buildTransaction(
            {
                "gasPrice": gas_price,
                "chainId": config.chain_id[network],
                "from": PUBLIC_KEY,
                "nonce": w3.eth.get_transaction_count(PUBLIC_KEY)
            }
        )
        signed_txn = w3.eth.account.sign_transaction(submit_txn, private_key=PRIVATE_KEY)

        txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        #print("https://%s.etherscan.io/tx/%s" % (network, txn_hash.hex()))
        transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=config.timeout)# Later we have to use the function isInDispute()
        printn("")
        printb("Success: ", "Value successfully disputed.", 'green')
        printn("https://%s.etherscan.io/tx/%s" % (network, txn_hash.hex()))
        time.sleep(5)
        try:
            bf = w3.eth.fee_history(1, transaction_receipt.blockNumber)['baseFeePerGas'][0]/1000000000
            gp = transaction_receipt.effectiveGasPrice/1000000000
            gu = transaction_receipt.gasUsed
            printn("Base Fee Per Gas: %s Gwei" % bf)
            printc("Effective Gas Price: ", "%s Gwei" % gp, 'magenta')
            printn("Gas Used: %s" % gu)
        except:
            printn("No Gas Data available at this point.")

        #disp_after = my_contract.functions.isDisputed('0x' + queryId.hexdigest(), timestmp).call()
        return


    except Exception as err:
        printb("Failure: ", err.args[0].__str__(), 'red')
        return
