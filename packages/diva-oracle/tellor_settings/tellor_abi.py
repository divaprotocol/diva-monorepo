TellorPlayground_abi = '''[
{
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_queryId",
          "type": "bytes32"
        },
        {
          "internalType": "bytes",
          "name": "_value",
          "type": "bytes"
        },
        {
          "internalType": "uint256",
          "name": "_nonce",
          "type": "uint256"
        },
        {
          "internalType": "bytes",
          "name": "_queryData",
          "type": "bytes"
        }
      ],
      "name": "submitValue",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
]
'''

DIVAOracleTellor_abi = '''[
{
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_poolId",
          "type": "uint256"
        }
      ],
      "name": "setFinalReferenceValue",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_queryId",
          "type": "bytes32"
        }
      ],
      "name": "getCurrentValue",
      "outputs": [
        {
          "internalType": "bool",
          "name": "_ifRetrieve",
          "type": "bool"
        },
        {
          "internalType": "bytes",
          "name": "_value",
          "type": "bytes"
        },
        {
          "internalType": "uint256",
          "name": "_timestampRetrieved",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
]'''


ReportedData_abi = '''[
    {
      "inputs": [
        {
          "internalType": "address payable",
          "name": "_tellor",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_queryId",
          "type": "bytes32"
        }
      ],
      "name": "getCurrentValue",
      "outputs": [
        {
          "internalType": "bool",
          "name": "_ifRetrieve",
          "type": "bool"
        },
        {
          "internalType": "bytes",
          "name": "_value",
          "type": "bytes"
        },
        {
          "internalType": "uint256",
          "name": "_timestampRetrieved",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_queryId",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "_timestamp",
          "type": "uint256"
        }
      ],
      "name": "getDataBefore",
      "outputs": [
        {
          "internalType": "bool",
          "name": "_ifRetrieve",
          "type": "bool"
        },
        {
          "internalType": "bytes",
          "name": "_value",
          "type": "bytes"
        },
        {
          "internalType": "uint256",
          "name": "_timestampRetrieved",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_queryId",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "_timestamp",
          "type": "uint256"
        }
      ],
      "name": "getIndexForDataBefore",
      "outputs": [
        {
          "internalType": "bool",
          "name": "_found",
          "type": "bool"
        },
        {
          "internalType": "uint256",
          "name": "_index",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_queryId",
          "type": "bytes32"
        }
      ],
      "name": "getNewValueCountbyQueryId",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_queryId",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "_index",
          "type": "uint256"
        }
      ],
      "name": "getTimestampbyQueryIdandIndex",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_queryId",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "_timestamp",
          "type": "uint256"
        }
      ],
      "name": "isDisputed",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_queryId",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "_timestamp",
          "type": "uint256"
        }
      ],
      "name": "isInDispute",
      "outputs": [
        {
          "internalType": "bool",
          "name": "",
          "type": "bool"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "_queryId",
          "type": "bytes32"
        },
        {
          "internalType": "uint256",
          "name": "_timestamp",
          "type": "uint256"
        }
      ],
      "name": "retrieveData",
      "outputs": [
        {
          "internalType": "bytes",
          "name": "",
          "type": "bytes"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]'''


tellor_dispute_abi = '''[
    {
        "inputs":[
          {
            "internalType":"bytes32",
            "name":"_queryId",
            "type":"bytes32"
          },
          {
            "internalType":"uint256",
            "name":"_timestamp",
            "type":"uint256"
            }
        ],
        "name":"beginDispute",
        "outputs":[],
        "stateMutability":"nonpayable",
        "type":"function"
    }
]'''

tellor_approve_abi = '''[
{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},

    {
        "inputs":[
        {
            "internalType":"address",
            "name":"",
            "type":"address"
        },
        {
            "internalType":"address",
            "name":"",
            "type":"address"}
        ],
        "name":"_allowances",
        "outputs":[
        {
            "internalType":"uint256",
            "name":"",
            "type":"uint256"
        }
        ],
        "stateMutability":"view",
        "type":"function"
    },
    {
        "inputs":[
        {
            "internalType":"address",
            "name":"_spender",
            "type":"address"
        },
        {
            "internalType":"uint256",
            "name":"_amount",
            "type":"uint256"
        }
        ],
        "name":"approve",
        "outputs":[
        {
            "internalType":"bool",
            "name":"",
            "type":"bool"
        }
        ],
        "stateMutability":"nonpayable",
        "type":"function"
    }
]'''

tellor_depositStake_abi = '''[
    {
        "inputs":[
        {
            "internalType":"uint256",
            "name":"_amount",
            "type":"uint256"
        }
        ],
        "name":"depositStake",
        "outputs":[],
        "stateMutability":"nonpayable",
        "type":"function"
    },
    {"inputs":[{"internalType":"address","name":"_stakerAddress","type":"address"}],"name":"getStakerInfo","outputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"}
]'''