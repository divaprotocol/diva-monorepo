# This script is to run the email notification system
# This isn't necessarily an Oracle, but runs similar steps as the Oracle
# Simply sends an email notifcation when a contract is up on expiry

import datetime as dt
from datetime import datetime
import requests
import pandas as pd
import json
import time
import os


from Prices import getKrakenPrice
from QueryGraph import *
from SendPrice import sendPrice
from ChainSet import Chain
from email_notify import sendEmail


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


email_query = '''
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
                collateralToken {
                    id
                    name
                  }
                createdAt
              }
            }
'''% dataprovider



query_list = [email_query]
# seeing when expirty is 1 hour away to send in prce oracle
max_time_away = dt.timedelta(minutes=60)



if __name__ == "__main__":
  max_time_away = dt.timedelta(minutes=60)
  run = 1

  while True:
    # Iterate through the graph queries to pull selected data
    print("Activity on Chain ID", Chain().CHAIN_ID)
    for query in range(len(query_list)):
      
      # This will run the graph query to gather existing data
      graph_resp = run_query(query_list[query])
      test = email_report(graph_resp, Asset_list)
      sendEmail(test)
    print(f"sleeping {SLEEP_TIME} seconds: cycle #: ", run)
    run +=1
    # Sleep time in seconds
    time.sleep(SLEEP_TIME)
  

