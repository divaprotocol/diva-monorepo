import tellor_settings.tellor_abi as tellor
import tellor_settings.tellor_contracts as tellor_contracts
import datetime as dt
from lib.QueryGraph import *
import config.config as config
from web3 import Web3
import time
from lib.query import tellor_query
from lib.submitPool import tellor_submit_pools
import pandas as pd


from termcolor import colored

waiting_sec = 60
network = config.network
print(network)
w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))
tellor_contract = w3.eth.contract(
    address=tellor_contracts.TellorPlayground_contract_address[network], abi=tellor.TellorPlayground_abi)
max_time_away = dt.timedelta(minutes=config.max_time_away)


if __name__ == "__main__":
    print(colored("*****************************************", 'green'))
    print(colored("RUNNING TELLOR-DIVA ORACLE", 'green'))
    print(colored("START TIME: %s" % dt.datetime.now().replace(microsecond=0), 'green'))
    print(colored("DATA PROVIDER: {}\n".format(tellor_contracts.DIVAOracleTellor_contract_address[network]), 'green'))
    with open('log.txt', 'a') as f:
        f.write("*****************************************\n")
        f.write("RUNNING TELLOR-DIVA ORACLE\n")
        f.write("START TIME: %s\n" % dt.datetime.now().replace(microsecond=0))
        f.write("DATA PROVIDER: {}\n".format(tellor_contracts.DIVAOracleTellor_contract_address[network]))
    # DO time time check here 
    while True:
        resp = run_graph_query(tellor_query(0, tellor_contracts.DIVAOracleTellor_contract_address[network]), network)
        df = pd.json_normalize(resp, ['data', 'pools'])
        if df.empty:
            print("No pools to report on at this time")
        tellor_submit_pools(df, network, w3, tellor_contract)
        print(colored("#########################################", "yellow"))
        print(colored("Waiting {} sec before next iteration...".format(waiting_sec), 'yellow'))
        # Wait before next iteration
        time.sleep(waiting_sec)