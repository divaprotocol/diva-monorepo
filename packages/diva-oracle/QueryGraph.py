import requests
import pandas as pd
from datetime import datetime


# function to use requests.post to make an API call to the subgraph url
def run_query(query, network):

    # endpoint where you are making the request
    request = requests.post('https://api.thegraph.com/subgraphs/name/divaprotocol/diva-{}'''.format(network),
                            json={'query': query})
    if request.status_code == 200:
        return request.json()
    else:
        raise Exception('Query failed. return code is {}.      {}'.format(request.status_code, query))



def get_required_reporting_df(resp, hours=24):
    df = pd.json_normalize(resp, ['data', 'pools'])
    df = df[df["statusFinalReferenceValue"] == "Open"]
    df['expiryTime'] = df['expiryTime'].apply(lambda x: float(x))
    df = df[df['expiryTime'] <= 95617580400]  # 95617580400 = Year 5000
    df['expiryTime_datetime'] = df['expiryTime'].apply(lambda x: datetime.fromtimestamp(x))
    df['Passed Seconds After Expiry'] = df['expiryTime_datetime'].apply(lambda x: (datetime.now()-x).total_seconds())

    df_reporting_needed = df.loc[(300 <= df['Passed Seconds After Expiry']) & (df['Passed Seconds After Expiry'] <= hours*60*60)] # normally we said at least after 24 hours
    return df_reporting_needed


