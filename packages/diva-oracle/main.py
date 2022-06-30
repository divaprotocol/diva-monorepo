import datetime as dt
from Prices import getKrakenPrice
from QueryGraph import *
from SendPrice import sendPrice
import config
import threading
from web3 import Web3
import time
import diva
from sendEmail import sendEmail
from recorder import *

def extend_DataFrame(df, resp):
    df = pd.concat([df, pd.json_normalize(resp, ["data", "pools"])], ignore_index=True)
    return df

def query(lastId):
    return """
            { 
                pools (first: 1000, where: {id_gt: %s, expiryTime_gte: "%s", expiryTime_lte: "%s", statusFinalReferenceValue: "Open", dataProvider: "%s"}) {
                    id
                    dataProvider
                    referenceAsset
                    floor
                    inflection
                    cap
                    statusFinalReferenceValue
                    expiryTime
                  }
                }
            """ % (lastId, (int(datetime.now().timestamp()) - 86400), (int(datetime.now().timestamp()) - 300), config.dataprovider)

message = "Subject: Pending Pool Transactions \n"

def run(network, w3, contract):
    print("#########################################")
    print('\033[1m' + "Network: {}".format(network) + '\033[0m')
    max_time_away = dt.timedelta(minutes=config.max_time_away)

    resp = run_query(query(0), network)
    df = pd.json_normalize(resp, ['data', 'pools'])
    numberPools = 0

    if not df.empty:
        while True:
            lastId = df.id.iloc[-1]
            if numberPools == df.shape[0]:
                break
            numberPools = df.shape[0]
            resp = run_query(query(lastId), network)
            df = extend_DataFrame(df, resp)

        df = transform_expiryTimes(df)
        df = df.sort_values(by=['expiryTime'], ignore_index=True)

        for j in pendingPools[network]:
            df = df[df["id"] != j]

        for i in range(df.shape[0]):
            pair = df['referenceAsset'].iloc[i]
            pair = pair.replace("/", "")
            date_dt = df['expiryTime_datetime'].iloc[i]
            pool_id = df['id'].iloc[i]

            date_max_away = date_dt - max_time_away
            # convert times to timestamp
            ts_date = datetime.timestamp(date_dt)
            ts_date_max_away = datetime.timestamp(date_max_away)

            price, date = getKrakenPrice(pair=pair, ts_date=ts_date, ts_date_max_away=ts_date_max_away)
            if (price, date) != (-1, -1):
                print("-----------------------------------------")
                message = "Pool id {} : Price for pair {}  date: {} : Price {}  ".format(pool_id, pair, date, price)
                print(message)

                try:
                    sendPrice(pool_id=pool_id, value=price, network=network, w3=w3, my_contract=contract, nonce=nonces[nt])
                    update_records(message)
                except:
                    print("Transaction is still pending...")
                    pendingPools[nt].append(pool_id)
                    pendingPools_nonces[nt].append(nonces[nt])
                    print("Nonce of pending pool transaction: {}".format(nonces[nt]))
                    print("Pool Id of pending pool: {}".format(pool_id))
                nonces[nt] += 1
            else:
                pendingPools[nt].append(pool_id)
                message = "Pood id %s : No price available or Pair not available" % pool_id
                update_pending_records(message)

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

for nt in networks:
    w3_instances.append(Web3(Web3.HTTPProvider(config.PROVIDER_URL[nt])))
    contract_instances.append(w3_instances[-1].eth.contract(address=diva.contract_address[nt], abi=diva.abi))
    nonces[nt] = w3_instances[-1].eth.get_transaction_count(config.PUBLIC_KEY)
iter = 0



while True:
    jobs = []
    for (nt, w3, contract) in zip(networks, w3_instances, contract_instances):
        thread = threading.Thread(target=run(nt, w3, contract))
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
