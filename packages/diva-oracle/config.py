PRIVATE_KEY = '0xcd840957318e971c708d4a0fe4b9a9e5e8478bcf8c090c2df2a23e6f913e506d'
PUBLIC_KEY = '0x2c7bcb465E14a031D51a07879a7A46A43a40cD0B'
PROVIDER_URL = 'https://goerli.infura.io/v3/a6b3d560ce544297b265bb09f0d4bfa8'
dataprovider = PUBLIC_KEY


PROVIDER_URL = {
    "ropsten": 'https://ropsten.infura.io/v3/a6b3d560ce544297b265bb09f0d4bfa8',
    "goerli": 'https://goerli.infura.io/v3/a6b3d560ce544297b265bb09f0d4bfa8',
    "rinkeby": 'https://rinkeby.infura.io/v3/a6b3d560ce544297b265bb09f0d4bfa8',
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

# PARAMETERS

# Max seconds to wait for a transaction to be confirmed
timeout = 1800

# Latest Kraken price before expiry: max minutes away
max_time_away = 60

# Reporting needed only for pools that are not older than 24 hours
max_reporting_frame = 24

# Networks
networks = ["goerli"]  # write ["ropsten","mumbai"] for multiple networks

# Waiting time (in seconds) before next iteration
waiting_next_iteration = 120