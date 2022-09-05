PRIVATE_KEY = ''
PUBLIC_KEY = ''
dataprovider = PUBLIC_KEY

# This is for gmail
# This requires 2FA along with
# https://stackoverflow.com/questions/46445269/gmail-blocks-login-attempt-from-python-with-app-specific-password
sender_email = ""
pass_code = ""

PROVIDER_URL = {
    "ropsten": 'https://ropsten.infura.io/v3/<YOUR_API_KEY>',
    "goerli": 'https://goerli.infura.io/v3/<YOUR_API_KEY>',
    "rinkeby": 'https://rinkeby.infura.io/v3/<YOUR_API_KEY>',
    "mumbai": ''
}

chain_id = {
    "ropsten": 3,
    "rinkeby": 4,
    "kovan": 42,
    "mumbai": 80001,
    "polygon": 137,
    "goerli": 5
}

# symbol : Id
WHITELIST_TOKEN_POOLS = {
    "dUSD" : "0xfa158c9b780a4213f3201ae74cca013712c8538d",
    "WBTC" : "0xA61E26649743f8c86b09860c9fddf45153fA7A55"
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
network = "ropsten"
# Waiting time (in seconds) before next iteration
waiting_next_iteration = 120
