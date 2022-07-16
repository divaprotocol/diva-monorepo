# This will run the email Oracle
# Use case if an address creates a contract
# Ie your triggers are dataProvider and createdAt fields in the Pool subgraph entity
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
from lib.query import query
from lib.query import email_query
from lib.submitPool import submitPool

waiting_sec = 500
def run(network, w3, contract):
    #sendEmail()
    print("#########################################")
    print('\033[1m' + "Network: {}".format(network) + '\033[0m')
    max_time_away = dt.timedelta(minutes=config.max_time_away)

    resp = run_query(email_query(), network)
    #print(resp)
    df = pd.json_normalize(resp, ['data', 'pools'])
    print(df)
    numberPools = 0

    if not df.empty:
        sendEmail(False, df)

network = config.network
w3 = (Web3(Web3.HTTPProvider(config.PROVIDER_URL[network])))
contract = w3.eth.contract(address=diva.contract_address[network], abi=diva.abi)

if __name__ == "__main__":
    run(network, w3, contract)
    print("#########################################")
    print("Waiting {} sec before next iteration...".format(waiting_sec))
        # Wait before next iteration
    time.sleep(waiting_sec)
    iter += 1



