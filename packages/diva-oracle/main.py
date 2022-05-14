import datetime as dt
from Prices import getKrakenPrice
from QueryGraph import *
from SendPrice import sendPrice
import config
import threading
from web3 import Web3
import time

query = """
        { 
            pools (where: {dataProvider: """ + """ "{}" """.format(config.dataprovider) + """}) {
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
        """

def run(network, w3):
    #w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))
    #print(w3.isConnected())
    print("#########################################")
    print('\033[1m' + "Network: {}".format(network) + '\033[0m')
    max_time_away = dt.timedelta(minutes=60)
    resp = run_query(query, network)
    df_reporting_needed = get_required_reporting_df(resp, hours=24)

    for i in range(df_reporting_needed.shape[0]):
        pair = df_reporting_needed['referenceAsset'].iloc[i]
        pair = pair.replace("/", "")
        date_dt = df_reporting_needed['expiryTime_datetime'].iloc[i]
        pool_id = df_reporting_needed['id'].iloc[i]

        date_max_away = date_dt - max_time_away
        # convert times to timestamp
        ts_date = datetime.timestamp(date_dt)
        ts_date_max_away = datetime.timestamp(date_max_away)

        price, date = getKrakenPrice(pair=pair, ts_date=ts_date, ts_date_max_away=ts_date_max_away)
        if (price, date) != (-1, -1):
            print("-----------------------------------------")
            print("Pool id {} :".format(pool_id),"Price for pair ", pair, " at ", date, ": ", price)
            # print("Price for pair ", pair, " at ", date, ": ", price, " where time interval is from", date_max_away,
            #      " to expiryTime:", date_dt)
        # send price to smart contract
        sendPrice(pool_id=pool_id, value=price, network=network, w3=w3)
    if df_reporting_needed.shape[0] == 0:
        print("No pools that require price now.")


# Parallel execution
networks = ["ropsten","mumbai"]
waiting_sec = 120

w3_instances = []
for nt in networks:
    w3_instances.append(Web3(Web3.HTTPProvider(config.PROVIDER_URL[nt])))

while True:
    jobs = []
    for (nt, w3) in zip(networks, w3_instances):
        thread = threading.Thread(target=run(nt, w3))
        jobs.append(thread)

    for j in jobs:
        j.start()

    for j in jobs:
        j.join()

    print("#########################################")
    print("Waiting {} sec before next iteration...".format(waiting_sec))
    # Wait before next iteration
    time.sleep(waiting_sec)
