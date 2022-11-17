from lib.df_utils import extend_DataFrame
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
from termcolor import colored
<<<<<<< Updated upstream
=======
import datetime
from lib.recorder import printb, printn, printbAll, printt, update_pending_records, update_records
from tellor_settings.tellor_retrieveData import retrieveData
from config.config import submission_threshold
from tabulate import tabulate

def extract(lst):
    return [item[0] for item in lst]

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
>>>>>>> Stashed changes


def submitPools(df, network, max_time_away, w3, contract):
    # This while loop extends the dataframe if the graph is at max capacity
    if df.empty:
        return("dataframe empy")
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
        print("could not query graph")
    print(df)
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

        ts_date_max_away = ts_date - max_time_away.seconds

        price, date = getKrakenPrice(
            pair=pair, ts_date=ts_date)
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
            message = "Pood id %s : Price or pair not available" % pool_id
            update_pending_records(message)

    return

# TODO need a stand alone function for submit pools rather than wrapped in above
def tellor_submit_pools(df, network, max_time_away, w3, contract):
    if df.empty:
        return
    DIVAOracleTellor_contract = w3.eth.contract(
            address=tellor_contracts.DIVAOracleTellor_contract_address[network], abi=tellor.DIVAOracleTellor_abi)
    getVal_contract = w3.eth.contract(
        address=tellor_contracts.TellorPlayground_contract_address[network], abi=tellor.ReportedData_abi)
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
        print("Could not query graph")

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

        ts_date_max_away = ts_date - max_time_away.seconds
        if pool_id in blocked_pools_by_whitelist:
            return

        price, date = getKrakenPrice(
            pair=pair, ts_date=ts_date)
        print('Price timestamp', date)
        # This function will get collToUSD format:
       
            # TODO
            # AUTOMATICALLY SETS TO 1 FOR TEST SEE PRICES.PY
            # This is for testing purposes, fix before prod
        coll_asset_to_usd = getKrakenCollateralConversion(
            df['collateralToken.symbol'].iloc[i], df['collateralToken.id'], ts_date=ts_date)
        if coll_asset_to_usd == "NotWhiteListed":
            print("collateral asset not whitelisted, blocking submission, add to blocked list")
            blocked_pools_by_whitelist.append(pool_id)
            return
        print("coll asset value from kraken", coll_asset_to_usd)
        if (price, date) != (-1, -1):
            # submit pool price
            print("-----------------------------------------")
            message = "Price Submission of Pool id {} -> of pair {} -> Expiry date: {}  Price {}  ".format(
                pool_id, opair, date, price)
            print(colored(message, "red"))

            try:
<<<<<<< Updated upstream
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
            
=======
                # We want to submit a value if nobody else has done so, or if others have done but their values differ from my value
                # by more than a threshold percentage.
                submit = False
                others_values = retrieveData(pool_id, network, getVal_contract)
                if others_values and submission_threshold != 0:
                    printn("Already submitted values are: ")
                    printt(others_values)
                    values_ref = extract(others_values)
                    diff = [abs(price / x - 1) * 100 for x in values_ref]
                    diff_ = [x < submission_threshold for x in diff]
                    if sum(diff_) == 0:  # If there is at least reported value within the threshold, you don't report.
                        submit = True
                    else:
                        printn("At least one submitted value is close to our value with respect to the threshold. No submission will be done.")
                elif not others_values:
                    submit = True

                if submit or (submission_threshold == 0):
                    # Tellor oracle has 2 steps submitting value to contract and setting final reference value
                    submitTellorValue(pool_id=pool_id, finalRefVal=price,
                                        collToUSD=coll_asset_to_usd, network=network, w3=w3, my_contract=contract)
                    # TODO Pull a delay from contract
                    # minDisputePeriod -> Pulling this from the blockchain -> Look to do this on main
                    time.sleep(15)
                    printn("")
                    setFinRefVal(pool_id, network, w3,
                                    DIVAOracleTellor_contract)
>>>>>>> Stashed changes
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

blocked_pools_by_whitelist = []
