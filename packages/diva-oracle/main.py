import datetime as dt
from Prices import getKrakenPrice
from QueryGraph import *
from SendPrice import sendPrice
#0x9AdEFeb576dcF52F5220709c1B267d89d5208D78
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
              }
            }
        """

max_time_away = dt.timedelta(minutes=60)

resp = run_query(query)

df_reporting_needed = get_required_reporting_df(resp,hours=24)


for i in range(df_reporting_needed.shape[0]):
    pair = df_reporting_needed['referenceAsset'].iloc[i]
    pair = pair.replace("/", "")
    date_dt = df_reporting_needed['expiryTime_datetime'].iloc[i]
    pool_id = df_reporting_needed['id'].iloc[i]

    date_max_away = date_dt - max_time_away
    #convert times to timestamp
    ts_date = datetime.timestamp(date_dt)
    ts_date_max_away = datetime.timestamp(date_max_away)

    price, date = getKrakenPrice(pair=pair, ts_date=ts_date, ts_date_max_away=ts_date_max_away)
    if (price, date) != (-1,-1):
        print("Price for pair ", pair, " at ", date,": ", price, " where time interval is from",date_max_away, " to expiryTime:", date_dt )
    #send price to smart contract
    sendPrice(pool_id=pool_id, value=price)
