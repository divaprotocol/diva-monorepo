# This help file will format the dataframe for specific functions
# This is to seperate the various functions 
import requests
import pandas as pd
import datetime as dt
from datetime import datetime
import json

from helpers.ChainSet import Chain

# Breaking out cleaning data
def normalize_data(df, Asset_list):
    # Time filtering error, delete once resolved
    df = df[df['expiryTime'].apply(lambda x: float(x) < 16512056850 )]

    df = df.rename(columns={'id':'poolId'})

    # modify column values to alter decimal place
    df['floor'] = df['floor'].apply(lambda x: str(int(x)/1000000000000000000))
    df['inflection'] = df['inflection'].apply(lambda x: str(int(x)/1000000000000000000))
    df['cap'] = df['cap'].apply(lambda x: str(int(x)/1000000000000000000))
    print(df)

    df = df[df['referenceAsset'].isin(Asset_list)]
    df = df[df['statusFinalReferenceValue'] == 'Open']
    return df

# Reporting criteria and mechanics
def df_format_oracle_report(resp,  Asset_list, hours=24):
    df = pd.json_normalize(resp, ['data', 'pools'])
    if  df.empty:
        print("No data to report on")
        return df
    df = normalize_data(df, Asset_list)
    
    df['expiryTime_datetime'] = df['expiryTime'].apply(lambda x: datetime.fromtimestamp(float(x)))
    df['Passed Hours After Expiry'] = df['expiryTime_datetime'].apply(lambda x: (datetime.now()-x).total_seconds()//60//60)

    #print(df)

    df_reporting_needed = df.loc[(0 <= df['Passed Hours After Expiry']) & (df['Passed Hours After Expiry'] <= hours)] # normally we said at least after 24 hours
    return df_reporting_needed

# This will report on email 
def df_format_email_report(resp, Asset_list, notification_period=72):
    df = pd.json_normalize(resp, ['data', 'pools'])
    df = normalize_data(df, Asset_list)


    # Asset list of what assets the oracle resonds to
    
    df['expiryTime'] = df['expiryTime'].apply(lambda x: datetime.fromtimestamp(float(x)))
    df['createdAt'] = df['createdAt'].apply(lambda x: datetime.fromtimestamp(float(x)))
    df['Hours Before Expiry'] = df['expiryTime'].apply(lambda x: (x-datetime.now()).total_seconds()//60//60)
    print(df)
    df_final = df#.loc[(df['Hours Before Expiry'] >= 24) & (df['Hours Before Expiry'] <= notification_period)] # normally we said at least after 24 hours
    print(df_final)
    df_final = df_final.astype(str)
    return df_final
