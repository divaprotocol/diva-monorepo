import config.config as config
from Crypto.Hash import keccak
import tellor_settings.tellor_contracts as tellor
from lib.recorder import printb
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
            disp = my_contract.functions.isDisputed('0x' + queryId.hexdigest(), timestmp).call()  # Later we have to use the function isInDispute()
            if data != b'':
                val = eth_abi.decode_abi(['uint256', 'uint256'],data)
                values.append([float(web3.Web3.fromWei(val[0], 'ether')), float(web3.Web3.fromWei(val[1], 'ether')), timestmp, disp])
            else:
                val = ("n/a", "n/a")
                values.append([val[0], val[1], timestmp, disp])
        return values

    except Exception as err:
        printb("Failure: ", err.args[0])
        return
