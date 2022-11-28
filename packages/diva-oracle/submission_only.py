import tellor_settings.tellor_abi as tellor
import tellor_settings.tellor_contracts as tellor_contracts
import datetime as dt
import config.config as config
from web3 import Web3
from lib.submitPool import tellor_submit_pools_specific_pool
from lib.recorder import printn

network = config.network
w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))
tellor_contract = w3.eth.contract(
    address=tellor_contracts.TellorPlayground_contract_address[network], abi=tellor.TellorPlayground_abi)
max_time_away = dt.timedelta(minutes=config.max_time_away)
start = dt.datetime.now().replace(microsecond=0)

pool_id = 15

if __name__ == "__main__":
    printn("*********************************************************", 'green')
    printn("RUNNING TELLOR-DIVA ORACLE", 'green')
    printn("START TIME: %s " % start + f'({dt.datetime.astimezone(start).tzinfo.__str__()})', 'green')
    printn("DATA PROVIDER: {}\n".format(tellor_contracts.DIVAOracleTellor_contract_address[network]), 'green')
    tellor_submit_pools_specific_pool(network, w3, tellor_contract, pool_id)
