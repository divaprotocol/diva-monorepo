import requests

# function to use requests.post to make an API call to the subgraph url
def run_graph_query(query, network):
    # need try and except here for the reuest
    # endpoint where you are making the request
    request = requests.post('https://api.thegraph.com/subgraphs/name/divaprotocol/diva-{}-new-2'''.format(network),
                            json={'query': query})
    if request.status_code == 200:
        return request.json()
    else:
        return Exception('Query failed. return code is {}.      {}'.format(request.status_code, query))



def transform_expiryTimes(df):
    df['expiryTime'] = df['expiryTime'].apply(lambda x: float(x))
    # df['Passed Seconds After Expiry'] = df['expiryTime'].apply(lambda x: (datetime.now().timestamp()-x))
    return df



