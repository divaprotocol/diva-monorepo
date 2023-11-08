import tellor_settings.tellor_abi as tellor
import tellor_settings.tellor_contracts as tellor_contracts
import datetime as dt
import config.config as config
from web3 import Web3
from lib.submitPool import tellor_submit_pools_specific_pool
from lib.recorder import printn
from tellor_settings.tellor_dispute import beginDispute
from tellor_settings.tellor_retrieveData import retrieveData
from lib.recorder import printbAll, printt

network = config.network
w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))
# tellor_governance_contract = w3.eth.contract(
#     address=tellor_contracts.TellorPlayground_contract_address[network], abi=tellor.tellor_dispute_abi)
# my_contract = w3.eth.contract(
#     address=tellor_contracts.TellorPlayground_contract_address[network], abi=tellor.ReportedData_abi)
tellor_governance_contract = w3.eth.contract(
    address=tellor_contracts.Tellor_contract_address[network], abi=tellor.tellor_dispute_abi)
my_contract = w3.eth.contract(
    address=tellor_contracts.Tellor_contract_address[network], abi=tellor.ReportedData_abi)
max_time_away = dt.timedelta(minutes=config.max_time_away)
start = dt.datetime.now().replace(microsecond=0)



if __name__ == "__main__":
    printn("*********************************************************", 'green')
    printn("RUNNING DISPUTE SCRIPT", 'green')
    printn("START TIME: %s " % start + f'({dt.datetime.astimezone(start).tzinfo.__str__()})', 'green')
    printn("REPORTER: {}\n".format(config.PUBLIC_KEY), 'green')
    x = input("Enter Pool Id: ")
    others_values = retrieveData(x, network, my_contract)
    if others_values:
        printn("")
        printbAll("Already submitted values are: ", underline=True)
        printt(others_values)
        printn("")
        idx = input("Index to dispute: ")
        beginDispute(x, idx, w3, network, tellor_governance_contract, my_contract)
    else:
        printn("No submitted values for this pool.")

