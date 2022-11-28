import config.config as config
import eth_abi
from Crypto.Hash import keccak
import tellor_settings.tellor_contracts as tellor
import time
from lib.recorder import printb, printn, printbAll, printc

PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY


def submitTellorValue(pool_id, finalRefVal, collToUSD, network, w3, my_contract):
    printbAll("Sending price to Tellor playground...", underline=True)
    printn("Network: %s" % network)
    printn("Contract address: %s" % my_contract.address)
    printn("Reporter address: %s" % PUBLIC_KEY)

    gas_price = w3.eth.gas_price

    # Prepare queryId and queryData for value submission
    queryDataArgs = eth_abi.encode_abi(["int", "address", "int"], [int(pool_id), tellor.divaDiamond[network], int(config.chain_id[network])])
    queryData = eth_abi.encode_abi(["string", "bytes"],["DIVAProtocol", queryDataArgs])
    queryId = keccak.new(digest_bits=256)
    queryId.update(queryData)
    printn("queryId: %s" % queryId.hexdigest())
    #print("queryData: %s" % queryData)

    oracleValue = eth_abi.encode_abi(["int", "int"], [int(w3.toWei(finalRefVal, 'ether')), int(w3.toWei(collToUSD, 'ether'))])
    try:
        submit_txn = my_contract.functions.submitValue('0x' + queryId.hexdigest(), '0x' + oracleValue.hex(), 0, '0x' + queryData.hex()).buildTransaction(
            {
                "gasPrice": gas_price,
                "chainId": config.chain_id[network],
                "from": PUBLIC_KEY,
                "nonce": w3.eth.get_transaction_count(PUBLIC_KEY)
            }
        )

        printn("Nonce: %s " % w3.eth.get_transaction_count(PUBLIC_KEY))
        signed_txn = w3.eth.account.sign_transaction(submit_txn, private_key=PRIVATE_KEY)

        txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=config.timeout)

        printn("")
        printb("Success: ", "Price submitted to Tellor playground", 'green')
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

        return 0

    except Exception as err:
        printb("Failure: ", err.args[0].__str__(), 'red')
        return 1


