from datetime import datetime
import string
import requests
import pandas as pd
import json
from config.config import WHITELIST_TOKEN_POOLS


def getKrakenPrice(pair, ts_date, ts_date_max_away):
    url = 'https://api.kraken.com/0/public/Trades?pair={}'.format(
        pair) + '&since={}'.format(ts_date_max_away)
    resp = requests.get(url)

    data = json.loads(resp.content.decode('utf-8'))
    keys = list(data)
    if data[keys[0]] == []:
        keys2 = list(data[keys[1]])

        df = pd.json_normalize(data, [keys[1], keys2[0]])
        if df.empty:
            print("no kraken data")
            return -1, -1
        df.columns = ['price', 'volume', 'time',
                      'buy/sell', 'market/limit', 'misc']
        df['datetime'] = df['time'].apply(lambda x: datetime.fromtimestamp(x))

        df_reduced = df.loc[df['time'] <= ts_date-60]
        if not df_reduced.empty:
            price_kraken = float(df_reduced.iloc[-1, 0])
            price_kraken_rounded = round(price_kraken, 2)
            date_kraken = df_reduced.iloc[-1, -1]
            return(price_kraken_rounded, date_kraken)
        else:
            print("No available price for pair ", pair, " between ", datetime.fromtimestamp(
                ts_date_max_away), " and ", datetime.fromtimestamp(ts_date))
            return -1, -1
    else:
        print("Error: ", data[keys[0]][0], "for pair ", pair)
        return -1, -1


def getKrakenCollateralConversion(dfitem, dfcontract, ts_date, ts_date_max_away):
    pair = dfitem+"USD"
    check_whitelist_token(dfitem, dfcontract)
    price = getKrakenPrice(pair, ts_date, ts_date_max_away)
    # This is for auto price to one in testing of dUSD
    if price[0] == -1:
        return 1
    return price[0]

def check_whitelist_token(dfitem, dfcontract):
    try:
        if dfitem in WHITELIST_TOKEN_POOLS:
            print("Valid whitelisted Token {}, {}", dfitem, dfcontract )
            print(WHITELIST_TOKEN_POOLS.get(dfitem))
        else:
            print("INVALID WHITELIST TOKEN")
    except:
        print("UNABLE TO VERIFY WHITELIST")
    return
# Example Call
# asset = 'ETH'
# currency = 'USD'
#
# pair = asset + currency
#
# date = "20.03.2022 10:25:00"
# max_time_away = dt.timedelta(minutes=15)
#
# # Convert string to datetime:
# date_dt = datetime.strptime(date, '%d.%m.%Y %H:%M:%S')
#
# date_max_away = date_dt - max_time_away
#
# # convert to timestamp
# ts_date = datetime.timestamp(date_dt)
# ts_date_max_away = datetime.timestamp(date_max_away)
#
#
# price, date = getKrakenPrice(pair, ts_date, ts_date_max_away)
#
# print('Kraken Price: ', price, ' at datetime: ', date)
