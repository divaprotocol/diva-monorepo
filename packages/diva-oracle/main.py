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
    #sendEmail()
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

pendingPools = {
    "ropsten": [],
    "mumbai": [],
    "rinkeby": []
}
pendingPools_nonces = {
    "ropsten": [],
    "mumbai": [],
    "rinkeby": []
}
pendingPools_len = {
    "ropsten": [0],
    "mumbai": [0],
    "rinkeby": [0]
}


w3_instances = []
contract_instances = []
nonces = {
    "ropsten": 0,
    "mumbai": 0,
    "rinkeby": 0
}

for network in networks:
    w3_instances.append(Web3(Web3.HTTPProvider(config.PROVIDER_URL[network])))
    contract_instances.append(w3_instances[-1].eth.contract(address=diva.contract_address[network], abi=diva.abi))
    nonces[network] = w3_instances[-1].eth.get_transaction_count(config.PUBLIC_KEY)
iter = 0



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
    # Send email with pending pool transactions.
    # bool_var = False
    # for nt in networks:
    #     bool_var = (pendingPools_len[nt][-1] != len(pendingPools[nt]))
    #     if bool_var:
    #         break
    # if (iter % 5 == 0) and bool_var:
    #     for nt in networks:
    #         message += "########## Pending transactions #################\n" \
    #                    + "Network: {} \n".format(nt) \
    #                    + "Pool ids: {} \n".format(pendingPools[nt]) \
    #                    + "Nonces: {} \n".format(pendingPools_nonces[nt])
    #         pendingPools_len[nt].append(len(pendingPools[nt]))
    #     print("Sending Email...")
    #     sendEmail(message)
    #     message = "Subject: Pending Pool Transactions \n"
