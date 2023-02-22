# Script to submit values to Tellor Flex contract. Script does not trigger the 
# setFinalReferenceValue function in the DIVA Tellor Oracle adapter. To do that
# either run the `setFinalReferenceValue.py` script or the `tellor.py` script with
# `value_submission = False` and `triggering_setFinRefVal = True`.

import tellor_settings.tellor_abi as tellor
import tellor_settings.tellor_contracts as tellor_contracts
import datetime as dt
from lib.QueryGraph import *
import config.config as config
from web3 import Web3
import time
from lib.query import tellor_query
from lib.submitPool import tellor_submit_pools_only_actual
import pandas as pd
from lib.recorder import printn

from termcolor import colored

waiting_sec = config.waiting_next_iteration
network = config.network
w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))
tellor_contract = w3.eth.contract(
    address=tellor_contracts.Tellor_contract_address[network], abi=tellor.tellor_contract_abi)
max_time_away = dt.timedelta(minutes=config.max_time_away)
start = dt.datetime.now().replace(microsecond=0)


if __name__ == "__main__":
    printn("*********************************************************", 'green')
    printn("RUNNING TELLOR-DIVA ORACLE", 'green')
    printn("START TIME: %s " % start + f'({dt.datetime.astimezone(start).tzinfo.__str__()})', 'green')
    printn("DATA PROVIDER: {}\n".format(config.dataprovider), 'green')
    # DO time time check here


    while True:
        resp = run_graph_query(tellor_query(0, tellor_contracts.DIVAOracleTellor_contract_address[network]), network)
        df = pd.json_normalize(resp, ['data', 'pools'])
        if df.empty:
            print("No pools to report on at this time")
        if dt.datetime.now().timestamp() > config.next_submission_timestamp:
            tellor_submit_pools_only_actual(df, network, w3, tellor_contract)
            print(colored("#########################################", "yellow"))
            print(colored("Waiting {} sec before next iteration...".format(waiting_sec), 'yellow'))
            # Wait before next iteration
            time.sleep(waiting_sec)
        else:
            wt = config.next_submission_timestamp - dt.datetime.now().timestamp()
            print(f"Waiting previous timelock period. Remaining waiting time: {round(wt,2)} seconds")
            time.sleep(wt)

