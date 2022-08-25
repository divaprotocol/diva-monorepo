from lib.df_utils import extend_DataFrame
import config.diva as diva
from lib.SendPrice import sendPrice
from lib.QueryGraph import *
from lib.Prices import getKrakenPrice, getKrakenCollateralConversion
from lib.query import query, tellor_query
from lib.recorder import *
from tellor_settings.tellor_submission import submitTellorValue
import tellor_settings.tellor_abi as tellor
from tellor_settings.tellor_setFinalReferenceValue import setFinRefVal
import tellor_settings.tellor_contracts as tellor_contracts
import time

from colorama import init
from termcolor import colored


def submitPools(df, network, max_time_away, w3, contract):
    # This while loop extends the dataframe if the graph is at max capacity
    if df.empty:
        return("dataframe empy")
    numberPools = 0
    while True:
        lastId = df.id.iloc[-1]
        if numberPools == df.shape[0]:
            break
        numberPools = df.shape[0]
        resp = run_graph_query(query(lastId), network)
        df = extend_DataFrame(df, resp)

    df = transform_expiryTimes(df)
    df = df.sort_values(by=['expiryTime'], ignore_index=True)

    for j in pendingPools[network]:
        df = df[df["id"] != j]
        
    for i in range(df.shape[0]):
        pair = df['referenceAsset'].iloc[i]
        opair = pair
        pair = pair.replace("/", "")
        date_dt = df['expiryTime_datetime'].iloc[i]
        pool_id = df['id'].iloc[i]

        date_max_away = date_dt - max_time_away
        # convert times to timestamp
        ts_date = datetime.timestamp(date_dt)
        ts_date_max_away = datetime.timestamp(date_max_away)
        price, date = getKrakenPrice(
            pair=pair, ts_date=ts_date, ts_date_max_away=ts_date_max_away)
        # This function will get collToUSD format:
        if (price, date) != (-1, -1):
            # submit pool price
            print("-----------------------------------------")
            message = "Price Submission of Pool id {} -> of pair {} -> Expiry date: {}  Price {}  ".format(
                pool_id, opair, date, price)
            print(colored(message, "red"))

            try:
                sendPrice(pool_id=pool_id, value=price, network=network,
                            w3=w3, my_contract=contract, nonce=nonces[network])
                update_records(message)
            except:
                # How do we know transactions is still pending?
                print("Transaction is still pending...")
                pendingPools[network].append(pool_id)
                pendingPools_nonces[network].append(nonces[network])
                print("Nonce of pending pool transaction: {}".format(
                    nonces[network]))
                print("Pool Id of pending pool: {}".format(pool_id))
            nonces[network] += 1
        else:
            pendingPools[network].append(pool_id)
            message = "Pood id %s : No price available or Pair not available" % pool_id
            update_pending_records(message)

    return

# TODO need a stand alone function for submit pools rather than wrapped in above
def tellor_submit_pools(df, network, max_time_away, w3, contract):
    if df.empty:
        return
    DIVAOracleTellor_contract = w3.eth.contract(
            address=tellor_contracts.DIVAOracleTellor_contract_address[network], abi=tellor.DIVAOracleTellor_abi)
    numberPools = 0
    while True:
        lastId = df.id.iloc[-1]
        if numberPools == df.shape[0]:
            break
        numberPools = df.shape[0]
        resp = run_graph_query(tellor_query(lastId, tellor_contracts.DIVAOracleTellor_contract_address[network]), network)
        df = extend_DataFrame(df, resp)

    df = transform_expiryTimes(df)
    df = df.sort_values(by=['expiryTime'], ignore_index=True)

    # taking this out for now, keeps in a pending pools but doesn't resubmit on error
    #for j in pendingPools[network]:
     #   df = df[df["id"] != j]

    for i in range(df.shape[0]):
        pair = df['referenceAsset'].iloc[i]
        opair = pair
        pair = pair.replace("/", "")
        date_dt = df['expiryTime_datetime'].iloc[i]
        pool_id = df['id'].iloc[i]

        date_max_away = date_dt - max_time_away
        # convert times to timestamp
        ts_date = datetime.timestamp(date_dt)
        ts_date_max_away = datetime.timestamp(date_max_away)
        price, date = getKrakenPrice(
            pair=pair, ts_date=ts_date, ts_date_max_away=ts_date_max_away)
        # This function will get collToUSD format:
       
            # TODO
            # AUTOMATICALLY SETS TO 1 FOR TEST SEE PRICES.PY
            # This is for testing purposes, fix before prod
        coll_asset_to_usd = getKrakenCollateralConversion(
            df['collateralToken.symbol'].iloc[i], ts_date=ts_date, ts_date_max_away=ts_date_max_away)
        if (price, date) != (-1, -1):
            # submit pool price
            print("-----------------------------------------")
            message = "Price Submission of Pool id {} -> of pair {} -> Expiry date: {}  Price {}  ".format(
                pool_id, opair, date, price)
            print(colored(message, "red"))

            try:
                # tellor oracle has 2 steps submitting value to contract and setting final reference value
                print("submitting tellor value")
                submitTellorValue(pool_id=pool_id, finalRefVal=price,
                                    collToUSD=coll_asset_to_usd, network=network, w3=w3, my_contract=contract)
                # TODO Pull a delay from contract
                # minDisputePeriod -> Pulling this from the blockchain -> Look to do this on main
                time.sleep(15)
                print("sending final reference value")
                setFinRefVal(pool_id, network, w3,
                                DIVAOracleTellor_contract)
            
            except:
                # How do we know transactions is still pending?
                print("Transaction is still pending...")
                pendingPools[network].append(pool_id)
                pendingPools_nonces[network].append(nonces[network])
                print("Nonce of pending pool transaction: {}".format(
                    nonces[network]))
                print("Pool Id of pending pool: {}".format(pool_id))
            nonces[network] += 1
        else:
            pendingPools[network].append(pool_id)
            message = "Pood id %s : No price available or Pair not available" % pool_id
            update_pending_records(message)
    return



pendingPools = {
    "ropsten": [],
    "mumbai": [],
    "rinkeby": [],
    "goerli": []
}
pendingPools_nonces = {
    "ropsten": [],
    "mumbai": [],
    "rinkeby": [],
    "goerli": []
}
pendingPools_len = {
    "ropsten": [0],
    "mumbai": [0],
    "rinkeby": [0],
    "goerli": [0]
}

w3_instances = []
contract_instances = []
nonces = {
    "ropsten": 0,
    "mumbai": 0,
    "rinkeby": 0,
    "goerli": 0
}
