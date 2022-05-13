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

    df['expiryTime_datetime'] = df['expiryTime'].apply(lambda x: datetime.fromtimestamp(float(x)))
    df['Passed Hours After Expiry'] = df['expiryTime_datetime'].apply(lambda x: (datetime.now()-x).total_seconds()//60//60)

    df_reporting_needed = df.loc[(0 <= df['Passed Hours After Expiry']) & (df['Passed Hours After Expiry'] <= hours)] # normally we said at least after 24 hours
    df_reporting_needed = df_reporting_needed[df_reporting_needed["statusFinalReferenceValue"] == "Open"] # Remove pools with already confirmed price
    return df_reporting_needed


