import tellor_settings.tellor_abi as tellor
import tellor_settings.tellor_contracts as tellor_contracts
import datetime as dt
from lib.QueryGraph import *
import config.config as config
from web3 import Web3
import time
from lib.query import tellor_query
from lib.submitPool import  tellor_submit_pools
import pandas as pd
<<<<<<< Updated upstream


=======
from lib.recorder import printc, printt
>>>>>>> Stashed changes
from termcolor import colored
from tellor_settings.tellor_retrieveData import retrieveData

# For testing purposes:
# getVal_contract = w3.eth.contract(
#     address=tellor_contracts.TellorPlayground_contract_address[network], abi=tellor.ReportedData_abi)
# values = retrieveData(243,network, getVal_contract)
# printt(values)

waiting_sec = 60
network = config.network
print(network)
w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))
tellor_contract = w3.eth.contract(
    address=tellor_contracts.TellorPlayground_contract_address[network], abi=tellor.TellorPlayground_abi)
max_time_away = dt.timedelta(minutes=config.max_time_away)


if __name__ == "__main__":
    print(colored("RUNNING TELLOR-DIVA ORACLE", 'green'))
    print(colored("DATA_PROVIDER: {}\n".format(tellor_contracts.DIVAOracleTellor_contract_address[network]), 'green') )
    # DO time time check here 
    while True:
        resp = run_graph_query(tellor_query(0, tellor_contracts.DIVAOracleTellor_contract_address[network]), network)
        df = pd.json_normalize(resp, ['data', 'pools'])
        if df.empty:
            print("No pools to report on at this time")
        tellor_submit_pools(df, network, max_time_away, w3, tellor_contract)
        print(colored("#########################################", "yellow"))
        print(colored("Waiting {} sec before next iteration...".format(waiting_sec), 'yellow'))
        # Wait before next iteration
        time.sleep(waiting_sec)