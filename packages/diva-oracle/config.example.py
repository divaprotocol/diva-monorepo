PRIVATE_KEY = ''
PUBLIC_KEY = ''
dataprovider = PUBLIC_KEY


email = ""
emailpassword = ""

PROVIDER_URL = {
    "ropsten": 'https://ropsten.infura.io/v3/<YOUR_API_KEY>',
    "rinkeby": 'https://rinkeby.infura.io/v3/<YOUR_API_KEY>',
    "mumbai": ''
}

chain_id = {
    "ropsten": 3,
    "rinkeby": 4,
    "kovan": 42,
    "mumbai": 80001,
    "polygon": 137
}

# PARAMETERS

# Max seconds to wait for a transaction to be confirmed
timeout = 1800

# Latest Kraken price before expiry: max minutes away
max_time_away = 60

# Reporting needed only for pools that are not older than 24 hours
max_reporting_frame = 24

# Networks
networks = ["ropsten"]  # write ["ropsten","mumbai"] for multiple networks

# Waiting time (in seconds) before next iteration
waiting_next_iteration = 120
