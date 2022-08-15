import config.config as config
from web3 import Web3
import tellor_settings.tellor_abi as tellor
from tellor_settings.tellor_submission import submitTellorValue
from tellor_settings.tellor_setFinalReferenceValue import setFinRefVal
import time
import datetime as dt
from lib.Prices import getKrakenPrice
from lib.QueryGraph import *
from lib.SendPrice import sendPrice
import config.config as config
import threading
from web3 import Web3
import time
import config.diva as diva
from lib.sendEmail import sendEmail
from lib.recorder import *
from lib.df_utils import extend_DataFrame
from lib.query import tellor_query, query
from lib.submitPool import submitPools


from colorama import init
from termcolor import colored

waiting_sec = 15
network = "ropsten"
w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))
tellor_contract = w3.eth.contract(
    address=tellor.TellorPlayground_contract_address[network], abi=tellor.TellorPlayground_abi)
max_time_away = dt.timedelta(minutes=config.max_time_away)

# The submit pool function has additional logic for the Tellor oracle
# submitPools(df, network, max_time_away, w3, tellor_contract, oracle="TELLOR")
# Still need to do below
collateralToUSDRate = 1  # TODO: Pull actual rate

# TODO: Instead of hard-coding 15 sec, pull the value from the DIVATellorOracle contract via getMinPeriodUndisputed (see slack channel)
# time.sleep(15) # After submitting the value there is a delay before you can trigger the function. For testing delay is 10 sec

#DIVAOracleTellor_contract = w3.eth.contract(address=tellor.DIVAOracleTellor_contract_address[network], abi=tellor.DIVAOracleTellor_abi)
#setFinRefVal(poolId, network, w3, DIVAOracleTellor_contract)

# Bug, block Oracle from sending price if before 24 hours!!!
# This will save on gas costs
if __name__ == "__main__":
    print(colored("TELLOR-DIVA ORACLE", 'green'))
    print(colored("RUNNING DATA_PROVIDER: {}\n".format(tellor.DIVAOracleTellor_contract_address[network]), 'green') )
    while True:
        resp = run_graph_query(tellor_query(0, tellor.DIVAOracleTellor_contract_address[network]), network)
        print(resp)
        df = pd.json_normalize(resp, ['data', 'pools'])
        if df.empty:
            print("dataframe empy")
        submitPools(df, network, max_time_away, w3, tellor_contract, oracle="TELLOR")
        print(colored("#########################################", "yellow"))
        print(colored("Waiting {} sec before next iteration...".format(waiting_sec), 'yellow'))
        # Wait before next iteration
        time.sleep(waiting_sec)
        