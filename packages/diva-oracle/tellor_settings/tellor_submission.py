import config.config as config
import eth_abi
from Crypto.Hash import keccak


PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY


def submitTellorValue(pool_id, finalRefVal, collToUSD, network, w3, my_contract):
    print("Sending price to Tellor Playground ...")
    gas_price = w3.eth.gas_price


    queryDataArgs = eth_abi.encode_abi(["int"], [int(pool_id)])
    queryData = eth_abi.encode_abi(["string", "bytes"],["DIVAProtocolPolygon", queryDataArgs])
    queryId = keccak.new(digest_bits=256)
    queryId.update(queryData)
    print(queryId.hexdigest())

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
    except:
        print("error on submit transaction of submit tellor value: check ether for Gas")
    print("Nonce:", w3.eth.get_transaction_count(PUBLIC_KEY))
    print("For pool:", pool_id)
    signed_txn = w3.eth.account.sign_transaction(submit_txn, private_key=PRIVATE_KEY)
    txn_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
    print(txn_hash.hex())
    transaction_receipt = w3.eth.wait_for_transaction_receipt(txn_hash, timeout=config.timeout)
    print("Price submitted to Tellor for pool id {} ".format(pool_id), "({})".format(network))