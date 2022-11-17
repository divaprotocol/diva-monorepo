from lib.df_utils import extend_DataFrame
from lib.SendPrice import sendPrice
from lib.QueryGraph import *
from lib.Prices import getKrakenPrice, getKrakenCollateralConversion
from lib.query import query, tellor_query
from tellor_settings.tellor_submission import submitTellorValue
import tellor_settings.tellor_abi as tellor
from tellor_settings.tellor_setFinalReferenceValue import setFinRefVal
import tellor_settings.tellor_contracts as tellor_contracts
import time
from termcolor import colored
import datetime
from lib.recorder import printb, printn, printbAll, update_pending_records, update_records


# Function to create output console message
def printDataToBeSubmitted(pool_id, ts_date, opair, price, date, collAsset, collAddr, proxy, coll_to_usd, coll_date):
    printn("*** Value submission for Pool Id %s ***" % pool_id)
    printn("Pool expiration time: %s (%s)" % (datetime.datetime.fromtimestamp(ts_date),datetime.datetime.fromtimestamp(ts_date).astimezone().tzinfo.__str__()))
    printn("")
    printbAll("Data to be submitted:")
    printbAll("%s: %s" % (opair, price))
    printn("As of time: %s (%s)" % (datetime.datetime.fromtimestamp(date),datetime.datetime.fromtimestamp(date).astimezone().tzinfo.__str__()))
    printn("Source: Kraken")
    printn("")
    printn("Collateral asset: %s (%s)" % (collAsset, collAddr))
    printn("Proxy rate: %s" % proxy)
    printbAll("Collateral/USD: %s" % coll_to_usd)
    printn("As of time: %s (%s)" % (datetime.datetime.fromtimestamp(coll_date), datetime.datetime.fromtimestamp(coll_date).astimezone().tzinfo.__str__()))
    printn("Source: Kraken")
    printn("")


def submitPools(df, network, max_time_away, w3, contract):
    # This while loop extends the dataframe if the graph is at max capacity
    if df.empty:
        return "dataframe empty"
    numberPools = 0
    try:
        while True:
            lastId = df.id.iloc[-1]
            if numberPools == df.shape[0]:
                break
            numberPools = df.shape[0]
            resp = run_graph_query(query(lastId), network)
            df = extend_DataFrame(df, resp)
    except:
        print("Error: Could not query graph.")
    #print(df)
    df = transform_expiryTimes(df)
    df = df.sort_values(by=['expiryTime'], ignore_index=True)

    for j in pendingPools[network]:
        df = df[df["id"] != j]
        
    for i in range(df.shape[0]):
        pair = df['referenceAsset'].iloc[i]
        opair = pair
        pair = pair.replace("/", "")
        ts_date = df['expiryTime'].iloc[i]
        pool_id = df['id'].iloc[i]

        price, date = getKrakenPrice(
            pair=pair, ts_date=ts_date)

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
            message = "Pood id %s : Price or pair not available" % pool_id
            update_pending_records(message)

    return

# Submit function used for Tellor submissions
def tellor_submit_pools(df, network, w3, contract):
    if df.empty:
        return
    DIVAOracleTellor_contract = w3.eth.contract(
            address=tellor_contracts.DIVAOracleTellor_contract_address[network], abi=tellor.DIVAOracleTellor_abi)
    numberPools = 0
    try:
        while True:
            lastId = df.id.iloc[-1]
            if numberPools == df.shape[0]:
                break
            numberPools = df.shape[0]
            resp = run_graph_query(tellor_query(lastId, tellor_contracts.DIVAOracleTellor_contract_address[network]), network)
            df = extend_DataFrame(df, resp)
    except:
        printn("Error: Could not query graph.")

    df = transform_expiryTimes(df)
    df = df.sort_values(by=['expiryTime'], ignore_index=True)

    # taking this out for now, keeps in a pending pools but doesn't resubmit on error
    #for j in pendingPools[network]:
     #   df = df[df["id"] != j]

    for i in range(df.shape[0]):
        pair = df['referenceAsset'].iloc[i]
        opair = pair
        pair = pair.replace("/", "")
        ts_date = df['expiryTime'].iloc[i]
        pool_id = df['id'].iloc[i]

        if pool_id in blocked_pools_by_whitelist:
            return

        price, date = getKrakenPrice(
            pair=pair, ts_date=ts_date)
        #print('Price timestamp', date)

        # This function will get collToUSD format:
        coll_asset_to_usd, coll_date, proxy = getKrakenCollateralConversion(
            df['collateralToken.symbol'].iloc[i], df['collateralToken.id'].iloc[i], ts_date=ts_date)
        if coll_asset_to_usd == "NotWhiteListed":
            printb("Failure: ", "Error while fetching collateral to USD rate. Blocking submission, add to blocked list")
            printn("Potential reason: Collateral asset missing in mapping.")
            #print("collateral asset not whitelisted, blocking submission, add to blocked list")
            blocked_pools_by_whitelist.append(pool_id)
            return
        #print("coll asset value from kraken", coll_asset_to_usd)
        if (price, date) != (-1, -1):
            # submit pool price
            printn("-----------------------------------------")
            printDataToBeSubmitted(pool_id, ts_date, opair, price, date, df['collateralToken.symbol'].iloc[i], df['collateralToken.id'].iloc[i], proxy, coll_asset_to_usd, coll_date)
            try:
                # Tellor oracle has 2 steps submitting value to contract and setting final reference value
                submitTellorValue(pool_id=pool_id, finalRefVal=price,
                                    collToUSD=coll_asset_to_usd, network=network, w3=w3, my_contract=contract)
                # TODO Pull a delay from contract
                # minDisputePeriod -> Pulling this from the blockchain -> Look to do this on main
                time.sleep(15)
                printn("")
                setFinRefVal(pool_id, network, w3,
                                DIVAOracleTellor_contract)
            except:
                # How do we know transactions is still pending?
                printn("--Tellor submission or setFinalReferenceValue failed--")
                pendingPools[network].append(pool_id)
                #pendingPools_nonces[network].append(nonces[network])
                #print("Nonce of pending pool transaction: {}".format(nonces[network]))
                #print("Pool Id of pending pool: {}".format(pool_id))
            #nonces[network] += 1
        else:
            pendingPools[network].append(pool_id)
            printb("Failure: ", "No price available or pair not available")
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

blocked_pools_by_whitelist = []
