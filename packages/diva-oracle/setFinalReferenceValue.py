import tellor_settings.tellor_contracts as tellor_contracts
import datetime as dt
import config.config as config
from web3 import Web3
from lib.submitPool import tellor_triggering_setFinRefVal_specific_pool
from lib.recorder import printn

network = config.network
w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))
max_time_away = dt.timedelta(minutes=config.max_time_away)
start = dt.datetime.now().replace(microsecond=0)


if __name__ == "__main__":
    printn("*********************************************************", 'green')
    printn("RUNNING TELLOR-DIVA ORACLE", 'green')
    printn("START TIME: %s " % start + f'({dt.datetime.astimezone(start).tzinfo.__str__()})', 'green')
    printn("DATA PROVIDER: {}\n".format(tellor_contracts.DIVAOracleTellor_contract_address[network]), 'green')
    x = input("Enter Pool Id: ")
    tellor_triggering_setFinRefVal_specific_pool(network, w3, x)

