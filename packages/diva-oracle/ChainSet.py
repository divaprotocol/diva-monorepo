# This file will set chains when running this script
# For instance, choose robsten, rinkeby, etc, to run this script



class Chain:
    CHAIN_ID = 1

    def __init__(self):
        return
    
    def Price_infra(self):
        network = "default"
        if self.CHAIN_ID == 1:
            network = "https://ropsten.infura.io/v3/a6b3d560ce544297b265bb09f0d4bfa8"
            #print(self.CHAIN_ID)
            #print("network: ", network)
            return network
        else:
            print("chain not set")
    
    def Graph_url(self):
        graph = "default"
        if self.CHAIN_ID == 1:
            graph = "https://api.thegraph.com/subgraphs/name/divaprotocol/diva-ropsten"
            #print(graph)
            return graph
        else:
            print("graph url not set")
