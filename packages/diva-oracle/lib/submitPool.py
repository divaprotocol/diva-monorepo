import pandas as pd

from lib.df_utils import extend_DataFrame
from lib.SendPrice import sendPrice
from lib.QueryGraph import *
from lib.Prices import getKrakenPrice, getKrakenCollateralConversion
from lib.query import query, tellor_query, queryPool
from tellor_settings.tellor_submission import submitTellorValue
import tellor_settings.tellor_abi as tellor
from tellor_settings.tellor_setFinalReferenceValue import setFinRefVal
import tellor_settings.tellor_contracts as tellor_contracts
import time
from termcolor import colored
import datetime
from lib.recorder import printb, printn, printbAll, printt, printr, update_pending_records, update_records
from tellor_settings.tellor_retrieveData import retrieveData
from config.config import submission_tolerance, max_reporting_frame, expiry_floor_time_away


def extract(lst):
    return [item[0] for item in lst]

# Function to create output console message
def printDataToBeSubmitted(pool_id, ts_date, opair, price, date, collAsset, collAddr, proxy, coll_to_usd, coll_date):
    printr("*** Value submission for Pool Id %s ***" % pool_id, 'cyan')
    printn("Pool expiration time: %s (%s)" % (datetime.datetime.fromtimestamp(ts_date),datetime.datetime.fromtimestamp(ts_date).astimezone().tzinfo.__str__()))
    printn("")
    printbAll("Data to be submitted:", underline=True)
    printbAll("%s: %s" % (opair, price), 'blue')
    printn("As of time: %s (%s)" % (datetime.datetime.fromtimestamp(date),datetime.datetime.fromtimestamp(date).astimezone().tzinfo.__str__()))
    printn("Source: Kraken")
    printn("")
    printn("Collateral asset: %s (%s)" % (collAsset, collAddr))
    printn("Proxy rate: %s" % proxy)
    printbAll("Collateral/USD: %s" % coll_to_usd, 'blue')
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
                # We want to submit a value if nobody else has done so, or if others have done but their values differ from my value
                # by more than a tolerance percentage.
                submit = False
                others_values = retrieveData(pool_id, network, getVal_contract)
                if others_values and submission_tolerance != 0:
                    printbAll("Already submitted values are: ", underline=True)
                    printt(others_values)
                    values_ref = extract(others_values)
                    diff = [abs(price / x - 1) * 100 for x in values_ref]
                    diff_ = [x < submission_tolerance for x in diff]
                    if sum(diff_) == 0:  # If there is at least reported value within the tolerance, you don't report.
                        submit = True
                    else:
                        printn("At least one submitted value is within the specified {}% tolerance. No submission will be done.".format(submission_tolerance))
                elif not others_values:
                    submit = True
            except:
                printn("-- Error while checking for already submitted values --", 'red')

            if submit or (submission_tolerance == 0):
                # Tellor oracle has 2 steps submitting value to contract and setting final reference value
                sTV = submitTellorValue(pool_id=pool_id, finalRefVal=price,
                                        collToUSD=coll_asset_to_usd, network=network, w3=w3, my_contract=contract)
                if sTV == 1:
                    printn("-- Error in Tellor submission: Continuing with next pool --")
                    continue
                # TODO Pull a delay from contract
                # minDisputePeriod -> Pulling this from the blockchain -> Look to do this on main
                time.sleep(15)
                printn("")
                sFRV = setFinRefVal(pool_id, network, w3,
                                    DIVAOracleTellor_contract)
                if sFRV == 1:
                    printn("-- Error in setFinalReferenceValue: Continuing with next pool --")
                    continue
            #except:
            # How do we know transactions is still pending?
            # printn("--Tellor submission or setFinalReferenceValue failed--")
            #pendingPools[network].append(pool_id)
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


def tellor_submit_pools_only(df, network, w3, contract):
    if df.empty:
        return
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
                # We want to submit a value if nobody else has done so, or if others have done but their values differ from my value
                # by more than a tolerance percentage.
                submit = False
                others_values = retrieveData(pool_id, network, getVal_contract)
                if others_values and submission_tolerance != 0:
                    printbAll("Already submitted values are: ", underline=True)
                    printt(others_values)
                    values_ref = extract(others_values)
                    diff = [abs(price / x - 1) * 100 for x in values_ref]
                    diff_ = [x < submission_tolerance for x in diff]
                    if sum(diff_) == 0:  # If there is at least reported value within the tolerance, you don't report.
                        submit = True
                    else:
                        printn("At least one submitted value is within the specified {}% tolerance. No submission will be done.".format(submission_tolerance))
                elif not others_values:
                    submit = True
            except:
                printn("-- Error while checking for already submitted values --", 'red')

            if submit or (submission_tolerance == 0):
                # Tellor oracle has 2 steps submitting value to contract and setting final reference value
                sTV = submitTellorValue(pool_id=pool_id, finalRefVal=price,
                                        collToUSD=coll_asset_to_usd, network=network, w3=w3, my_contract=contract)
                if sTV == 1:
                    printn("-- Error in Tellor submission: Continuing with next pool --")
                    continue

        else:
            pendingPools[network].append(pool_id)
            printb("Failure: ", "No price available or pair not available")
            message = "Pood id %s : No price available or Pair not available" % pool_id
            update_pending_records(message)
    return

def trigger_setFinRefVal_only(df, network, w3):
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
        printn("Error: Could not query graph.")

    df = transform_expiryTimes(df)
    df = df.sort_values(by=['expiryTime'], ignore_index=True)

    for i in range(df.shape[0]):
        pool_id = df['id'].iloc[i]

        if pool_id in blocked_pools_by_whitelist:
            return

        others_values = retrieveData(pool_id, network, getVal_contract)
        if others_values:
            printr("*** Triggering setFinRefVal() for Pool Id %s ***" % pool_id, 'cyan')
            sFRV = setFinRefVal(pool_id, network, w3,
                                DIVAOracleTellor_contract)
            if sFRV == 1:
                printn("-- Error in setFinalReferenceValue: Continuing with next pool --")
                continue
        else:
            printb('Failure: ', "No values submitted for this pool. First submit values before you trigger the function.", "red")
    return


def tellor_submit_pools_specific_pool(network, w3, contract, poolid):
    getVal_contract = w3.eth.contract(
        address=tellor_contracts.TellorPlayground_contract_address[network], abi=tellor.ReportedData_abi)

    try:
        resp = run_graph_query(queryPool(poolid),
                               network)
        df = pd.json_normalize(resp["data"]["pool"])
    except Exception as err:
        printb("Failure: ", err.args[0].__str__(), 'red')
        return

    df = transform_expiryTimes(df)
    pair = df['referenceAsset'][0]
    opair = pair
    pair = pair.replace("/", "")
    ts_date = df['expiryTime'][0]
    time_diff = datetime.datetime.now().timestamp() - ts_date
    if df['statusFinalReferenceValue'][0] == 'Confirmed':
        printn("Pool %s already settled." % poolid, 'red')
        return
    elif max_reporting_frame * 3600 <= time_diff:
        printn("Pool already expired more than %s h ago" % max_reporting_frame, 'red')
        return
    elif time_diff <= expiry_floor_time_away:
        printn("Pool should be expired for at least %s min before submitting a value." % int(expiry_floor_time_away/60), 'red')
        return

    if poolid in blocked_pools_by_whitelist:
        return


    price, date = getKrakenPrice(
                pair=pair, ts_date=ts_date)

    # This function will get collToUSD format:
    coll_asset_to_usd, coll_date, proxy = getKrakenCollateralConversion(
            df['collateralToken.symbol'][0], df['collateralToken.id'][0], ts_date=ts_date)
    if coll_asset_to_usd == "NotWhiteListed":
        printb("Failure: ", "Error while fetching collateral to USD rate. Blocking submission, add to blocked list")
        printn("Potential reason: Collateral asset missing in mapping.")
        #print("collateral asset not whitelisted, blocking submission, add to blocked list")
        blocked_pools_by_whitelist.append(poolid)
        return
        #print("coll asset value from kraken", coll_asset_to_usd)
    if (price, date) != (-1, -1):
        # submit pool price
        printn("-----------------------------------------")
        printDataToBeSubmitted(poolid, ts_date, opair, price, date, df['collateralToken.symbol'][0], df['collateralToken.id'][0], proxy, coll_asset_to_usd, coll_date)
        try:
            # We want to submit a value if nobody else has done so, or if others have done but their values differ from my value
            # by more than a tolerance percentage.
            submit = False
            others_values = retrieveData(poolid, network, getVal_contract)
            if others_values and submission_tolerance != 0:
                printbAll("Already submitted values are: ", underline=True)
                printt(others_values)
                values_ref = extract(others_values)
                diff = [abs(price / x - 1) * 100 for x in values_ref]
                diff_ = [x < submission_tolerance for x in diff]
                if sum(diff_) == 0:  # If there is at least reported value within the tolerance, you don't report.
                    submit = True
                else:
                    printn("At least one submitted value is within the specified {}% tolerance. No submission will be done.".format(submission_tolerance))
            elif not others_values:
                submit = True
        except:
            printn("-- Error while checking for already submitted values --", 'red')

        if submit or (submission_tolerance == 0):
            # Tellor oracle has 2 steps submitting value to contract and setting final reference value
            sTV = submitTellorValue(pool_id=poolid, finalRefVal=price,
                                    collToUSD=coll_asset_to_usd, network=network, w3=w3, my_contract=contract)
            if sTV == 1:
                printn("-- Error in Tellor submission: Continuing with next pool --")
                return
    return

def tellor_triggering_setFinRefVal_specific_pool(network, w3, pool_id):
    DIVAOracleTellor_contract = w3.eth.contract(
        address=tellor_contracts.DIVAOracleTellor_contract_address[network], abi=tellor.DIVAOracleTellor_abi)
    getVal_contract = w3.eth.contract(
        address=tellor_contracts.TellorPlayground_contract_address[network], abi=tellor.ReportedData_abi)

    if pool_id in blocked_pools_by_whitelist:
        return

    others_values = retrieveData(pool_id, network, getVal_contract)
    if others_values:
        printr("*** Triggering setFinRefVal() for Pool Id %s ***" % pool_id, 'cyan')
        sFRV = setFinRefVal(pool_id, network, w3,
                            DIVAOracleTellor_contract)
    else:
        printb('Failure: ',
               "No values submitted for this pool. First submit values before you trigger the function.", "red")
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
