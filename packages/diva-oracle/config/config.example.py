PRIVATE_KEY = ''
PUBLIC_KEY = ''
dataprovider = ''  # Use '0x63098cC6EDa33B0FbD07472B1a8dD54D4a5C2153' for Tellor as dataprovider


# This is for gmail
# This requires 2FA along with
# https://stackoverflow.com/questions/46445269/gmail-blocks-login-attempt-from-python-with-app-specific-password
sender_email = ""
pass_code = ""

PROVIDER_URL = {
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


WHITELIST_TOKEN_POOLS = {
    "goerli": {
                "dUSD": "0xfa158c9b780a4213f3201ae74cca013712c8538d",  # 18 decimals
                "WBTC": "0xA61E26649743f8c86b09860c9fddf45153fA7A55",  # 8 decimals
                "WAGMI": "0x9A07D3F69411155f2790E5ed138b750C3Ecd28aD",  # 6 decimals
                "WETH": "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"  # 18 decimals
    },
    "polygon": {
                "dUSD": "",
                "WBTC": "",
                "WAGMI": "",
                "WETH": ""
    }

}

COLLATERAL_MAPPING = {
    "dUSD": "ETH",
    "WBTC": "BTC",
    "WAGMI": "ETH",
    "WETH": "ETH"
}

# This true value will only submit pools in the whitelist token pools
# Any collateral assets outside of the whitelist will not be processed.
BLOCK_ON_WHITELIST = True
# PARAMETERS

# Max seconds to wait for a transaction to be confirmed
timeout = 1800

# Latest Kraken price before expiry: max minutes away
max_time_away = 60

# Reporting needed only for pools that are not older than 24 hours
max_reporting_frame = 24

# Reporting will be done only for pools that are expired at least 300 sec before
expiry_floor_time_away = 300

# Network
network = "goerli"

# Waiting time (in seconds) before next iteration
waiting_next_iteration = 60

# Tolerance in percent whether you want to report values when others' values are different by the tolerance
# If submission_tolerance = 0, we always submit values.
submission_tolerance = 0.5

# Threshold: If account balance is below threshold, print balance in red. Else print balance in green.
acc_balance_threshold = 5

# Value submission to pools:
value_submission = True

# Triggering setFinRefVal():
triggering_setFinRefVal = True
