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
    address=tellor_contracts.Tellor_contract_address[network], abi=tellor.tellor_contract_abi)
max_time_away = dt.timedelta(minutes=config.max_time_away)
start = dt.datetime.now().replace(microsecond=0)



if __name__ == "__main__":
    printn("*********************************************************", 'green')
    printn("RUNNING DEPOSIT STAKE SCRIPT", 'green')
    printn("START TIME: %s " % start + f'({dt.datetime.astimezone(start).tzinfo.__str__()})', 'green')
    printn("USER: {}\n".format(config.PUBLIC_KEY), 'green')
    printn("")

    allowance = int(w3.fromWei(tellor_token_contract.functions._allowances(config.PUBLIC_KEY, tellor_flex_contract.address).call(), 'ether'))
    balance = int(w3.fromWei(tellor_token_contract.functions.balanceOf(config.PUBLIC_KEY).call(), 'ether'))
    staked = int(w3.fromWei(tellor_flex_contract.functions.getStakerInfo(config.PUBLIC_KEY).call()[1], 'ether'))
    printn(f"Already staked: {staked} TRB")
    printn(f"User allowance: {allowance} TRB")
    printn(f"User balance: {balance} TRB")
    printn("")
    x = input("Enter staking amount: ")
    printn("")
    depositStake(int(x), network, w3, tellor_token_contract, tellor_flex_contract, int(allowance))

