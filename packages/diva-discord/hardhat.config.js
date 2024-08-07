
/* global ethers task */
require('@nomiclabs/hardhat-waffle');
require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
// Good read on hardhat.config: https://medium.com/coinmonks/hardhat-configuration-c96415d4fcba

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const PRIVATE_KEY = process.env.PRIVATE_KEY
const MNEMONIC = process.env.MNEMONIC

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.6',
  networks: {
    hardhat: {
        forking: {
            url: process.env.ALCHEMY_URL_MAINNET,
        },
        gas: "auto"
    },
    ropsten: {
      url: process.env.ALCHEMY_URL_ROPSTEN,
      // accounts: [`0x${PRIVATE_KEY}`], // example with private key; type: array; note that this only unlocks 1 single account
      // gas: 4100000,
      accounts: {
        mnemonic: MNEMONIC, // unlocks multiple accounts
      },
      gasPrice: 8000000000
    },
    goerli: {
      url: process.env.ALCHEMY_URL_GOERLI,
      // accounts: [`0x${PRIVATE_KEY}`], // example with private key; type: array; note that this only unlocks 1 single account
      // gas: 4100000,
      accounts: {
        mnemonic: MNEMONIC, // unlocks multiple accounts
      },
      gasPrice: 8000000000
    },
    rinkeby: {
      url: process.env.ALCHEMY_URL_RINKEBY,
      accounts: {
        mnemonic: MNEMONIC, // example with mnemonic; type: object
      },
    },
    kovan: {
      url: process.env.ALCHEMY_URL_KOVAN,
      accounts: {
        mnemonic: MNEMONIC,
      }
    },
    polygon_mumbai: {
      url: process.env.ALCHEMY_URL_POLYGON_MUMBAI,
      accounts: {
        mnemonic: MNEMONIC, 
      },
      gasPrice: 8000000000,
    },
    polygon: {
      url: process.env.ALCHEMY_URL_POLYGON_MAINNET,
      accounts: {
        mnemonic: MNEMONIC, 
      },
      gasLimit: 3000000,
      // gas: 2000000,
      gasPrice: 30000000000,
    },
    arbitrum_rinkeby: {
      url: process.env.ALCHEMY_URL_ARBITRUM_RINKEBY,
      accounts: {
        mnemonic: MNEMONIC, 
      }
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  gasReporter:{
    currency: "USD",
    gasPrice: 100,
    enabled: true,
}
}