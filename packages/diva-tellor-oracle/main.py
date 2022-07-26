import config
from web3 import Web3
import tellor
from submitToTellor import submitTellorValue
from triggerSetFinalRefValue import setFinRefVal
import time


network = "ropsten"
w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))

poolId = 48696

finalReferenceValue = 93
collateralToUSDRate = 1

tellor_contract = w3.eth.contract(address=tellor.TellorPlayground_contract_address[network], abi=tellor.TellorPlayground_abi)
submitTellorValue(poolId, finalReferenceValue, collateralToUSDRate, network, w3, tellor_contract)

time.sleep(15)

DIVAOracleTellor_contract = w3.eth.contract(address=tellor.DIVAOracleTellor_contract_address[network], abi=tellor.DIVAOracleTellor_abi)
setFinRefVal(poolId, network, w3, DIVAOracleTellor_contract)