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
from lib.submitPool import submitPool

message = "Subject: Pending Pool Transactions \n"


def run(network, w3, contract):
    # sendEmail()
    print("#########################################")
    print('\033[1m' + "Network: {}".format(network) + '\033[0m')
    max_time_away = dt.timedelta(minutes=config.max_time_away)

    resp = run_query(query(0), network)
    df = pd.json_normalize(resp, ['data', 'pools'])
    numberPools = 0

    if not df.empty:
        submitPool(df, network, max_time_away, w3, contract)

    else:
        print("No pools that require price now.")


# Parallel execution
networks = config.networks
waiting_sec = config.waiting_next_iteration


w3_instances = []
contract_instances = []
nonces = {
    "ropsten": 0,
    "mumbai": 0,
    "rinkeby": 0
}

for network in networks:
    w3_instances.append(Web3(Web3.HTTPProvider(config.PROVIDER_URL[network])))
    contract_instances.append(
        w3_instances[-1].eth.contract(address=diva.contract_address[network], abi=diva.abi))
    nonces[network] = w3_instances[-1].eth.get_transaction_count(
        config.PUBLIC_KEY)
iter = 0


if __name__ == "__main__":
    while True:
        jobs = []
        for (network, w3, contract) in zip(networks, w3_instances, contract_instances):
            thread = threading.Thread(target=run(network, w3, contract))
            jobs.append(thread)

        for j in jobs:
            j.start()

        for j in jobs:
            j.join()

        print("#########################################")
        print("Waiting {} sec before next iteration...".format(waiting_sec))
        # Wait before next iteration
        time.sleep(waiting_sec)
        iter += 1
