import datetime as dt
from datetime import datetime
import requests
import pandas as pd
import json
import time
import os


from helpers.Prices import getKrakenPrice
from helpers.QueryGraph import *
from helpers.SendPrice import sendPrice
from helpers.ChainSet import Chain
from helpers.dataframe_formats import *


# List of assets to choose from, if there are more from the Price Oracle
# Asset list to query and send prices for
Asset_list = ['BTC/USD', 'ETH/USD', 'ZRX/USD', '1INCH/USD', 'AAVE/USD', 'ALGO/USD', 'AXS/USD']
# How long the oracle sleeps in between checks in seconds
SLEEP_TIME = 60 


# Dataprovider is determined by who created the pool
# Only the specified data provider can update the contract
# In this case, it is the WALLET variable set in the .env file
dataprovider = Chain()
dataprovider = Chain.WALLET
#print("dataprovider", dataprovider)
query = '''
            {
              pools (where: {dataProvider: "%s"}) {
                id
                dataProvider
                referenceAsset
                floor
                inflection
                cap
                expiryTime
                statusFinalReferenceValue
              }
            }
'''% dataprovider

query2 = '''
            {
              pools {
                id
                dataProvider
                referenceAsset
                floor
                inflection
                cap
                expiryTime
                statusFinalReferenceValue
              }
            }
'''



query_list = [query]
# seeing when expirty is 1 hour away to send in prce oracle
max_time_away = dt.timedelta(minutes=60)

def main_send(df_reporting_needed):
  #print(df_reporting_needed)
  if df_reporting_needed.empty:
    print("No Open transactions to report on")
    return 
  else:
    #print(df_reporting_needed)
    for i in range(df_reporting_needed.shape[0]):
        pair = df_reporting_needed['referenceAsset'].iloc[i]
        pair = pair.replace("/", "")
        date_dt = df_reporting_needed['expiryTime_datetime'].iloc[i]
        # This might be broken due to column name change
        pool_id = df_reporting_needed['poolId'].iloc[i]

        date_max_away = date_dt - max_time_away
        #convert times to timestamp
        ts_date = datetime.timestamp(date_dt)
        ts_date_max_away = datetime.timestamp(date_max_away)
        try:
          price, date = getKrakenPrice(pair=pair, ts_date=ts_date, ts_date_max_away=ts_date_max_away)
        except:
          print("asset error at get kraken price")
          continue
        if (price, date) != (-1,-1):
            print("Submission for PoolId:", pool_id)
            print("Price for pair ", pair, " at ", date,": ", price, " where time interval is from",date_max_away, " to expiryTime:", date_dt )
        #send price to smart contract
        try:
          sendPrice(pool_id=pool_id, value=price)
        except Exception as e:
          print(e)



if __name__ == "__main__":
  max_time_away = dt.timedelta(minutes=60)
  run = 1

  while True:
    # Iterate through the graph queries to pull selected data
    print("Activity on Chain ID", Chain().CHAIN_ID)
    for query in range(len(query_list)):
      
      # This will run the graph query to gather existing data
      graph_resp = run_query(query_list[query])
      # Determine reporting needed based on time frame, within 24 hours after expiry
      
      df_reporting_needed = df_format_oracle_report(graph_resp, Asset_list,hours=24)
      main_send(df_reporting_needed)
    print(f"sleeping {SLEEP_TIME} seconds: cycle #: ", run)
    run +=1
    # Sleep time in seconds
    time.sleep(SLEEP_TIME)
  

