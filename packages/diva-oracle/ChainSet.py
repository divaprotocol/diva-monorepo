# This file will set chains when running this script
# For instance, choose robsten, rinkeby, etc, to run this script
import os


class Chain:
    CHAIN_ID = 3
    '''eth mainnet is 1
    ropsten is 3, 
    rinkeby is 4
    polygon is 137
    Mumbai: 80001
    https://chainlist.org/'''

    def __init__(self):
        return
    
    def price_infra(self):
        network = "default"
        API_KEY = "a6b3d560ce544297b265bb09f0d4bfa8"
        if self.CHAIN_ID == 3:
            network = "https://ropsten.infura.io/v3/" + API_KEY
            #print(self.CHAIN_ID)
            #print("network: ", network)
            return network
        elif self.CHAIN_ID == 4:
            network = "https://rinkeby.infura.io/v3/" + API_KEY
            return network
        elif self.CHAIN_ID == 137:
            network = "https://polygon.infura.io/v3/" + API_KEY
            return network
        elif self.CHAIN_ID == 80001:
            network = "https://mumbai.infura.io/v3/" + API_KEY
            return network
        else:
            print("chain not set")
    
    def graph_url(self):
        graph = "default"
        if self.CHAIN_ID == 3:
            graph = "https://api.thegraph.com/subgraphs/name/divaprotocol/diva-ropsten"
            #print(graph)
            return graph
        elif self.CHAIN_ID == 4:
            graph = "https://api.thegraph.com/subgraphs/name/divaprotocol/diva-rinkeby"
            return graph
        elif self.CHAIN_ID == 137:
            graph = "https://api.thegraph.com/subgraphs/name/divaprotocol/diva-polygon"
            return graph
        elif self.CHAIN_ID == 80001:
            graph = "https://api.thegraph.com/subgraphs/name/divaprotocol/diva-mumbai"
            return graph
        else:
            print("graph url not set")
    
    def contract_address(self):
        contract = "test"
        if self.CHAIN_ID == 1:
            contract = os.environ.get('ROBSTEN')
            #print(graph)
            return contract
        elif self.CHAIN_ID == 4:
            contract = os.getenv('RINKEBY')
            return contract
        elif self.CHAIN_ID == 137:
            contract = os.getenv('ROBSTEN')
            return contract
        elif self.CHAIN_ID == 80001:
            contract = os.getenv('MUMBAI')
            return contract
        else:
            print("contract address not set")
        
