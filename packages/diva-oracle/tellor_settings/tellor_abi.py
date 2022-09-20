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
          "internalType": "address",
          "name": "_divaDiamond",
          "type": "address"
        },
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