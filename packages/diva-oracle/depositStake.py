import tellor_settings.tellor_abi as tellor
import tellor_settings.tellor_contracts as tellor_contracts
from tellor_settings.tellor_depositStake import depositStake
import datetime as dt
import config.config as config
from web3 import Web3
from lib.recorder import printn

network = config.network
w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))
tellor_token_contract = w3.eth.contract(
    address=tellor_contracts.TRB_token_contract[network], abi=tellor.tellor_approve_abi)
tellor_flex_contract = w3.eth.contract(
    address=tellor_contracts.Tellor_contract_address[network], abi=tellor.tellor_depositStake_abi)
max_time_away = dt.timedelta(minutes=config.max_time_away)
start = dt.datetime.now().replace(microsecond=0)



if __name__ == "__main__":
    printn("*********************************************************", 'green')
    printn("RUNNING DEPOSIT STAKE SCRIPT", 'green')
    printn("START TIME: %s " % start + f'({dt.datetime.astimezone(start).tzinfo.__str__()})', 'green')
    printn("USER: {}\n".format(config.PUBLIC_KEY), 'green')
    x = input("Enter Amount: ")
    printn("")
    depositStake(x, network, w3, tellor_token_contract, tellor_flex_contract)

