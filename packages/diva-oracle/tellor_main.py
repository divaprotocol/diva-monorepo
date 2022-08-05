import config.config as config
from web3 import Web3
import tellor_settings.tellor_abi as tellor
from tellor_settings.tellor_submission import submitTellorValue
from tellor_settings.tellor_setFinalReferenceValue import setFinRefVal
import time


network = "ropsten"
w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))

poolId = 48696 # TODO: Pull all open expired pools from e.g. theGraph

finalReferenceValue = 93 # TODO: Pull actual value (from e.g. Kraken)
collateralToUSDRate = 1 # TODO: Pull actual rate
print(tellor.TellorPlayground_contract_address[network])
tellor_contract = w3.eth.contract(address=tellor.TellorPlayground_contract_address[network], abi=tellor.TellorPlayground_abi)
submitTellorValue(poolId, finalReferenceValue, collateralToUSDRate, network, w3, tellor_contract)

# TODO: Instead of 15 sec, pull the value from the DIVATellorOracle contract (see slack channel)
time.sleep(15) # After submitting the value there is a delay before you can trigger the function. For testing delay is 10 sec

DIVAOracleTellor_contract = w3.eth.contract(address=tellor.DIVAOracleTellor_contract_address[network], abi=tellor.DIVAOracleTellor_abi)
setFinRefVal(poolId, network, w3, DIVAOracleTellor_contract)