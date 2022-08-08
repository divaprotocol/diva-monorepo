import requests
import pandas as pd
from datetime import datetime


# function to use requests.post to make an API call to the subgraph url
def run_graph_query(query, network):

    # endpoint where you are making the request
    request = requests.post('https://api.thegraph.com/subgraphs/name/divaprotocol/diva-{}'''.format(network),
                            json={'query': query})
    if request.status_code == 200:
        return request.json()
    else:
        raise Exception('Query failed. return code is {}.      {}'.format(request.status_code, query))



def transform_expiryTimes(df):
    df['expiryTime'] = df['expiryTime'].apply(lambda x: float(x))
    df['expiryTime_datetime'] = df['expiryTime'].apply(lambda x: datetime.fromtimestamp(x))
    df['Passed Seconds After Expiry'] = df['expiryTime_datetime'].apply(lambda x: (datetime.now()-x).total_seconds())
    return df



