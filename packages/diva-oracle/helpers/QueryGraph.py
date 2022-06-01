import requests
import pandas as pd
import datetime as dt
from datetime import datetime
import json

from helpers.ChainSet import Chain

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

