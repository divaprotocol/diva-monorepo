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
from lib.submitPool import submitPools

message = "Subject: Pending Pool Transactions \n"

waiting_sec = 30
def run(network, w3, contract):
    # sendEmail()
    print("#########################################")
    print("RUNNING PRICE ORACLE")
    print('\033[1m' + "Network: {}".format(network) + '\033[0m')
    max_time_away = dt.timedelta(minutes=60)

    resp = run_graph_query(query(0), network)
    print(resp)
    df = pd.json_normalize(resp, ['data', 'pools'])
    numberPools = 0

    if not df.empty:
        submitPools(df, network, max_time_away, w3, contract)

    else:
        print("No pools that require price now.")


w3_instances = []
contract_instances = []
nonces = {
    "ropsten": 0,
    "mumbai": 0,
    "rinkeby": 0
}


network = config.network
w3 = (Web3(Web3.HTTPProvider(config.PROVIDER_URL[network])))
contract = w3.eth.contract(
    address=diva.contract_address[network], abi=diva.abi)


if __name__ == "__main__":
    while True:
        run(network, w3, contract)
        print("#########################################")
        print("Waiting {} sec before next iteration...".format(waiting_sec))
        # Wait before next iteration
        time.sleep(waiting_sec)
