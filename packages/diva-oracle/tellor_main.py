import config.config as config
from web3 import Web3
import tellor_settings.tellor_abi as tellor
from tellor_settings.tellor_submission import submitTellorValue
from tellor_settings.tellor_setFinalReferenceValue import setFinRefVal
import time
import datetime as dt
from lib.Prices import getKrakenPrice
from lib.QueryGraph import *
from lib.SendPrice import sendPrice
import config.config as config
import threading
from web3 import Web3
import time
import config.diva as diva
from lib.sendEmail import sendEmail
from lib.recorder import *
from lib.df_utils import extend_DataFrame
from lib.query import tellor_query
from lib.submitPool import  submitPools


network = "ropsten"
w3 = Web3(Web3.HTTPProvider(config.PROVIDER_URL[network]))
tellor_contract = w3.eth.contract(address=tellor.TellorPlayground_contract_address[network], abi=tellor.TellorPlayground_abi)
max_time_away = dt.timedelta(minutes=config.max_time_away)
## graph queyr for poolIDs
resp = run_graph_query(tellor_query(0), network)
df = pd.json_normalize(resp, ['data', 'pools'])
print(df)
# The submit pool function  has additional logic for the tellow oracle
submitPools(df, network, max_time_away, w3, tellor_contract, oracle="TELLOR")
# Still need to do below
collateralToUSDRate = 1 # TODO: Pull actual rate

# TODO: Instead of 15 sec, pull the value from the DIVATellorOracle contract (see slack channel)
#time.sleep(15) # After submitting the value there is a delay before you can trigger the function. For testing delay is 10 sec

#DIVAOracleTellor_contract = w3.eth.contract(address=tellor.DIVAOracleTellor_contract_address[network], abi=tellor.DIVAOracleTellor_abi)
#setFinRefVal(poolId, network, w3, DIVAOracleTellor_contract)