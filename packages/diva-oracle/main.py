import datetime as dt
from datetime import datetime
import requests
import pandas as pd
import json
import time

from Prices import getKrakenPrice
from QueryGraph import *
from SendPrice import sendPrice

# Let's focus on BTC/ETH pairs, see all the data providers
# data provider address 0x77fc64c1a9a7126c236f45d07fc3fd8b64077494  ;0xc948f2F172Fe25977E322c8D82F8f53338f8a051
# data provider is who the pool creator selects to verify the price information, or whatever information
# Supposed to report the final value on the underlying asset, when the pool expires
# This bot will have an account
# This bot will be set as the data provider. 

''' {
              pools (where: {referenceAsset: "BTC/USD", dataProvider: "0x77fc64c1a9a7126c236f45d07fc3fd8b64077494"}) {
                id
                dataProvider
                referenceAsset
                floor
                inflection
                cap
                expiryTime
    						finalReferenceValue
    						statusFinalReferenceValue
              }
            }'''
query = """
            {
              pools (where: {dataProvider: "0xc948f2F172Fe25977E322c8D82F8f53338f8a051"}) {
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
        """

query2 = """
            {
              pools (where: {referenceAsset: "ETH/USD"}) {
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
        """

query_list = [query]
# seeing when expirty is 1 hour away to send in prce oracle
max_time_away = dt.timedelta(minutes=60)

# running Query Graphy to get the option details
# This grabs all the data from stated query via the graph
#resp = run_query(query)
#print(resp)

# The queires subgraph and what the does 
# hours to report the values
#df_reporting_needed = get_required_reporting_df(resp,hours=100)
#print(df_reporting_needed)

#print(df_reporting_needed)

# Once the pair is obtained, what do we want to do:
# Filter for pools of lifetime, expiriry,  BTC as underlying
# Only care about pools that are past expirations, have not been sent a price
# From open to confirmed
# Perform checks below and get pools 
# Past expiry, and status is open. Data provider is address, reference asset is BTC/USD


def main_send(df_reporting_needed):
  print(df_reporting_needed)
  for i in range(df_reporting_needed.shape[0]):
      pair = df_reporting_needed['referenceAsset'].iloc[i]
      pair = pair.replace("/", "")
      date_dt = df_reporting_needed['expiryTime_datetime'].iloc[i]
      pool_id = df_reporting_needed['id'].iloc[i]

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
    for query in range(len(query_list)):
      print("running query # ", query)
      # This will run the graph query to gather existing data
      resp = run_query(query_list[query])
      # Determine reporting needed based on time frame, within 24 hours after expiry
      df_reporting_needed = get_required_reporting_df(resp,hours=24)
      main_send(df_reporting_needed)
    print("sleeping 1 minute: run #: ", run)
    run +=1
    time.sleep(60)
  


    # Send price and verify for send price
    # Check pool, and what the id
    # Restrict to data provider
    # Change hours after expiry
    # automatically running script 
    # Call the send price function
    #sendPrice(pool_id=pool_id, value=price)
    # Wait for successful transaction 
    # This would be good for testnet
    # Then verify the that the reference value is filled. 
    # Exclude the ones already open 

    # Increase the asset pools,
    # Change the areas of Queries to pull data providers
    # Take the average price and average over the various exchanges
