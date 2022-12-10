import tellor_settings.tellor_abi as tellor
import tellor_settings.tellor_contracts as tellor_contracts
import datetime as dt
from lib.QueryGraph import *
import config.config as config
from web3 import Web3
import time
from lib.query import tellor_query
from lib.submitPool import tellor_submit_pools, tellor_submit_pools_only, trigger_setFinRefVal_only
import pandas as pd
from lib.recorder import printn

from termcolor import colored

# For testing purposes:
# from tellor_settings.tellor_retrieveData import retrieveData
# getVal_contract = w3.eth.contract(
#     address=tellor_contracts.TellorPlayground_contract_address[network], abi=tellor.ReportedData_abi)
# values = retrieveData(243,network, getVal_contract)
# printt(values)

waiting_sec = config.waiting_next_iteration
network = config.network
w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))
tellor_contract = w3.eth.contract(
    address=tellor_contracts.TellorPlayground_contract_address[network], abi=tellor.TellorPlayground_abi)
max_time_away = dt.timedelta(minutes=config.max_time_away)
start = dt.datetime.now().replace(microsecond=0)


if __name__ == "__main__":
    printn("*********************************************************", 'green')
    printn("RUNNING TELLOR-DIVA ORACLE", 'green')
    printn("START TIME: %s " % start + f'({dt.datetime.astimezone(start).tzinfo.__str__()})', 'green')
    printn("DATA PROVIDER: {}\n".format(tellor_contracts.DIVAOracleTellor_contract_address[network]), 'green')
    # DO time time check here

    if config.value_submission and not config.triggering_setFinRefVal:
        while True:
            resp = run_graph_query(tellor_query(0, tellor_contracts.DIVAOracleTellor_contract_address[network]), network)
            df = pd.json_normalize(resp, ['data', 'pools'])
            if df.empty:
                print("No pools to report on at this time")
            tellor_submit_pools_only(df, network, w3, tellor_contract)
            print(colored("#########################################", "yellow"))
            print(colored("Waiting {} sec before next iteration...".format(waiting_sec), 'yellow'))
            # Wait before next iteration
            time.sleep(waiting_sec)
    elif config.triggering_setFinRefVal and not config.value_submission:
        while True:
            resp = run_graph_query(tellor_query(0, tellor_contracts.DIVAOracleTellor_contract_address[network]),
                                   network)
            df = pd.json_normalize(resp, ['data', 'pools'])
            if df.empty:
                print("No pools to report on at this time")
            trigger_setFinRefVal_only(df, network, w3)
            print(colored("#########################################", "yellow"))
            print(colored("Waiting {} sec before next iteration...".format(waiting_sec), 'yellow'))
            # Wait before next iteration
            time.sleep(waiting_sec)
    elif not config.value_submission and not config.triggering_setFinRefVal:
        printn("Change parameters in config file to run oracle.", 'red')
    else:
        while True:
            resp = run_graph_query(tellor_query(0, tellor_contracts.DIVAOracleTellor_contract_address[network]),
                                   network)
            df = pd.json_normalize(resp, ['data', 'pools'])
            if df.empty:
                print("No pools to report on at this time")
            tellor_submit_pools(df, network, w3, tellor_contract)
            print(colored("#########################################", "yellow"))
            print(colored("Waiting {} sec before next iteration...".format(waiting_sec), 'yellow'))
            # Wait before next iteration
            time.sleep(waiting_sec)
