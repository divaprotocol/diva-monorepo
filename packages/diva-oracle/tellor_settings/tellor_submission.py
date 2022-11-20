import config.config as config
import eth_abi
from Crypto.Hash import keccak
import tellor_settings.tellor_contracts as tellor
from termcolor import colored
from web3.exceptions import TimeExhausted
from lib.recorder import printb, printn, printbAll

PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY


def submitTellorValue(pool_id, finalRefVal, collToUSD, network, w3, my_contract):
    printbAll("Sending price to Tellor playground...")
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
    except Exception as err:
        printb("Failure: ", err.args[0])

    #except :
    #    printb("Failure: ", "Error while submit to Tellor playground.")
    #    printn("Potential reason: Insufficient Gas")

    printn("Nonce: %s " % w3.eth.get_transaction_count(PUBLIC_KEY))

    #print("For pool:", pool_id)
    signed_txn = w3.eth.account.sign_transaction(submit_txn, private_key=PRIVATE_KEY)
    txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    #print(txn_hash.hex())
    try:
        transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=config.timeout)
    #except TimeExhausted:
    #    printb("Failure: ", "Timeout error. Transaction is not in chain after %s seconds" % config.timeout)
    except ValueError as err:
        printb("Failure: ", err.args[0])
    #print("Price submitted to Tellor for pool id {} ".format(pool_id), "({})".format(network))
    printn("")
    printb("Success: ", "Price submitted to Tellor playground")
    printn("https://%s.etherscan.io/tx/%s" % (network, txn_hash.hex()))
    printn("Base Fee Per Gas: %s Gwei" % (w3.eth.fee_history(1, transaction_receipt.blockNumber)['baseFeePerGas'][0]/1000000000))
    printn("Effective Gas Price: %s Gwei" % (transaction_receipt.effectiveGasPrice/1000000000))
    printn("Gas Used: %s" % transaction_receipt.gasUsed)


