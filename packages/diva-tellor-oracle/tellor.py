TellorPlayground_contract_address = {
    "ropsten": '0x7B8AC044ebce66aCdF14197E8De38C1Cc802dB4A',
}

DIVAOracleTellor_contract_address = {
    "ropsten": '0x2f4218C9262216B7B73A76334e5A98F3eF71A61c',
}

divaDiamond = {
    "ropsten": '0xebBAA31B1Ebd727A1a42e71dC15E304aD8905211',
}

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
    }
]'''