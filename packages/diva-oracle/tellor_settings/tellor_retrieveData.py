import config.config as config
from Crypto.Hash import keccak
import tellor_settings.tellor_contracts as tellor
from termcolor import colored
from web3.exceptions import TimeExhausted
from lib.recorder import printb, printn, printbAll
import eth_abi
import web3

PRIVATE_KEY = config.PRIVATE_KEY
PUBLIC_KEY = config.PUBLIC_KEY

def retrieveData(pool_id, network, my_contract):
    queryDataArgs = eth_abi.encode_abi(["int", "address", "int"], [int(pool_id), tellor.divaDiamond[network], int(config.chain_id[network])])
    queryData = eth_abi.encode_abi(["string", "bytes"], ["DIVAProtocol", queryDataArgs])
    queryId = keccak.new(digest_bits=256)
    queryId.update(queryData)
    values = []

    try:
        count = my_contract.functions.getNewValueCountbyQueryId('0x' + queryId.hexdigest()).call()
        for idx in range(count):
            timestmp = my_contract.functions.getTimestampbyQueryIdandIndex('0x' + queryId.hexdigest(), idx).call()
            data = my_contract.functions.retrieveData('0x' + queryId.hexdigest(), timestmp).call()
            #disp = my_contract.functions.isInDispute('0x' + queryId.hexdigest(), timestmp).call()
            val = eth_abi.decode_abi(['uint256', 'uint256'],data)
            values.append([float(web3.Web3.fromWei(val[0], 'ether')), float(web3.Web3.fromWei(val[1], 'ether'))])
        return values

    except Exception as err:
        printb("Failure: ", err.args[0])
        return

# def getValueCountbyPool(pool_id, network, my_contract):
#     printbAll("Get Value Count for Pool id: %s" % pool_id)
#
#     queryDataArgs = eth_abi.encode_abi(["int", "address", "int"], [int(pool_id), tellor.divaDiamond[network], int(config.chain_id[network])])
#     queryData = eth_abi.encode_abi(["string", "bytes"],["DIVAProtocol", queryDataArgs])
#     queryId = keccak.new(digest_bits=256)
#     queryId.update(queryData)
#     printn("queryId: %s" % queryId.hexdigest())
#     #print("queryData: %s" % queryData)
#
#     try:
#         count = my_contract.functions.getNewValueCountbyQueryId('0x' + queryId.hexdigest()).call()
#         return count
#     except Exception as err:
#         printb("Failure: ", err.args[0]["message"])
#         return
#
#
# def getTimestamp(pool_id, index,  network, my_contract):
#     #printbAll("Get Value Count for Pool id: %s" % pool_id)
#     queryDataArgs = eth_abi.encode_abi(["int", "address", "int"], [int(pool_id), tellor.divaDiamond[network], int(config.chain_id[network])])
#     queryData = eth_abi.encode_abi(["string", "bytes"],["DIVAProtocol", queryDataArgs])
#     queryId = keccak.new(digest_bits=256)
#     queryId.update(queryData)
#     #printn("queryId: %s" % queryId.hexdigest())
#     #print("queryData: %s" % queryData)
#
#     try:
#         timestmp = my_contract.functions.getTimestampbyQueryIdandIndex('0x' + queryId.hexdigest(), index).call()
#         return timestmp
#
#     except Exception as err:
#         printb("Failure: ", err.args[0]["message"])
#         return
#
#
# def retrieveData(pool_id, timestmp,  network, my_contract):
#     #printbAll("Get Value Count for Pool id: %s" % pool_id)
#     queryDataArgs = eth_abi.encode_abi(["int", "address", "int"], [int(pool_id), tellor.divaDiamond[network], int(config.chain_id[network])])
#     queryData = eth_abi.encode_abi(["string", "bytes"],["DIVAProtocol", queryDataArgs])
#     queryId = keccak.new(digest_bits=256)
#     queryId.update(queryData)
#     #printn("queryId: %s" % queryId.hexdigest())
#     #print("queryData: %s" % queryData)
#
#     try:
#         data = my_contract.functions.retrieveData('0x' + queryId.hexdigest(), timestmp).call()
#         return data
#
#     except Exception as err:
#         printb("Failure: ", err.args[0]["message"])
#         return
