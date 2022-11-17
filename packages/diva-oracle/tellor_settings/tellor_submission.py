import config.config as config
import eth_abi
from Crypto.Hash import keccak
import tellor_settings.tellor_contracts as tellor
from termcolor import colored
from web3.exceptions import TimeExhausted

PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY


def submitTellorValue(pool_id, finalRefVal, collToUSD, network, w3, my_contract):
    print(colored("Sending price to Tellor playground...", attrs=["bold"]))
    print("Network: %s" % network)
    print("Contract address: %s" % my_contract.address)
    print("Reporter address: %s" % PUBLIC_KEY)
    with open('log.txt', 'a') as f:
        f.write("Sending price to Tellor playground...\n")
        f.write("Network: %s\n" % network)
        f.write("Contract address: %s\n" % my_contract.address)
        f.write("Reporter address: %s\n" % PUBLIC_KEY)
    gas_price = w3.eth.gas_price

    # Prepare queryId and queryData for value submission
    queryDataArgs = eth_abi.encode_abi(["int", "address", "int"], [int(pool_id), tellor.divaDiamond[network], int(config.chain_id[network])])
    queryData = eth_abi.encode_abi(["string", "bytes"],["DIVAProtocol", queryDataArgs])
    queryId = keccak.new(digest_bits=256)
    queryId.update(queryData)
    print("queryId: %s" % queryId.hexdigest())
    with open('log.txt', 'a') as f:
        f.write("queryId: %s\n" % queryId.hexdigest())
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
    except ValueError as err:
        print(colored("Failure: ", attrs=["bold"]) + err.args[0]["message"])
        with open('log.txt', 'a') as f:
            f.write("Failure: " + err.args[0]["message"])
            f.write("\n")
    except:
        print(colored("Failure: ", attrs=["bold"]) + "Error while submit to Tellor playground.")
        print("Potential reason: Insufficient Gas")
        with open('log.txt', 'a') as f:
            f.write("Failure: " + "Error while submit to Tellor playground.\n")
            f.write("Potential reason: Insufficient Gas\n")

    print("Nonce: ", w3.eth.get_transaction_count(PUBLIC_KEY))
    with open('log.txt', 'a') as f:
        f.write("Nonce: %s \n" % w3.eth.get_transaction_count(PUBLIC_KEY))
    #print("For pool:", pool_id)
    signed_txn = w3.eth.account.sign_transaction(submit_txn, private_key=PRIVATE_KEY)
    txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    #print(txn_hash.hex())
    try:
        transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=config.timeout)
    except TimeExhausted:
        print(colored("Failure: ", attrs=["bold"]) + "Timeout error. Transaction is not in chain after %s seconds" % config.timeout)
        with open('log.txt', 'a') as f:
            f.write("Failure: Timeout error. Transaction is not in chain after %s seconds. \n" % config.timeout)
    #print("Price submitted to Tellor for pool id {} ".format(pool_id), "({})".format(network))
    print("")
    print(colored("Success: ", attrs=["bold"]) + "Price submitted to Tellor playground")
    print("https://%s.etherscan.io/tx/%s" % (network, txn_hash.hex()))
    with open('log.txt', 'a') as f:
        f.write("\n")
        f.write("Success: " + "Price submitted to Tellor playground\n")
        f.write("https://%s.etherscan.io/tx/%s\n" % (network, txn_hash.hex()))

