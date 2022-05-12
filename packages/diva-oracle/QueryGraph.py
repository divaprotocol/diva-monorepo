import requests
import pandas as pd
import datetime as dt
from datetime import datetime
import json

from ChainSet import Chain

# function to use requests.post to make an API call to the subgraph url
def run_query(query):

    # endpoint where you are making the request
    url = Chain()
    url.graph_url()
    u2 = url.graph_url()
    request = requests.post( u2
                            ,
                            json={'query': query})
    if request.status_code == 200:
        return request.json()
    else:
        raise Exception('Query failed. return code is {}.      {}'.format(request.status_code, query))



def get_required_reporting_df(resp,  Asset_list, hours=24,):
    df = pd.json_normalize(resp, ['data', 'pools'])
    # filtering for time error in app
    df = df[df['expiryTime'].apply(lambda x: float(x) < 16512056850 )]

    # Asset list of what assets the oracle resonds to
    #df = df[df['referenceAsset'].isin(Asset_list)]

    df = df[df['statusFinalReferenceValue'] == 'Open']
    

    df['expiryTime_datetime'] = df['expiryTime'].apply(lambda x: datetime.fromtimestamp(float(x)))
    df['Passed Hours After Expiry'] = df['expiryTime_datetime'].apply(lambda x: (datetime.now()-x).total_seconds()//60//60)

    print(df)

    df_reporting_needed = df.loc[(0 <= df['Passed Hours After Expiry']) & (df['Passed Hours After Expiry'] <= hours)] # normally we said at least after 24 hours
    return df_reporting_needed


