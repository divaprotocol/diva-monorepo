
/* global ethers task */
require('@nomiclabs/hardhat-waffle');
require("dotenv").config();
require("hardhat-gas-reporter");
require('hardhat-contract-sizer');
require("./tasks/generateDiamondABI.js");
require("./tasks/accounts.js");
require('solidity-coverage');

/**
 * Makes compilation possible without a .env file
 */
const E = (name) => {
  return process.env[name] || ''
}

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
// Good read on hardhat.config: https://medium.com/coinmonks/hardhat-configuration-c96415d4fcba

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const PRIVATE_KEY = E("PRIVATE_KEY");
const MNEMONIC = E("process.env.MNEMONIC");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.6",
  networks: {
    hardhat: {
      forking: {
        url: E("ALCHEMY_URL_MAINNET"),
      },
      gas: "auto",
    },
    ropsten: {
      url: E("ALCHEMY_URL_ROPSTEN"),
      accounts: {
        mnemonic: MNEMONIC, // example with mnemonic; type: object
      },
      // accounts: [`0x${PRIVATE_KEY}`], // example with private key; type: array
      // gas: 4100000,
      gasPrice: 8000000000,
    },
    rinkeby: {
      url: E("ALCHEMY_URL_RINKEBY"),
      accounts: {
        mnemonic: MNEMONIC, // example with mnemonic; type: object
      },
    },
    kovan: {
      url: E("ALCHEMY_URL_KOVAN"),
      accounts: {
        mnemonic: MNEMONIC,
      },
    },
    polygon_mumbai: {
      url: E("ALCHEMY_URL_POLYGON_MUMBAI"),
      accounts: {
        mnemonic: MNEMONIC,
      },
      gasLimit: 3000000,
      gasPrice: 30000000000,
    },
    polygon: {
      url: E("ALCHEMY_URL_POLYGON_MAINNET"),
      accounts: {
        mnemonic: MNEMONIC,
      },
      gasLimit: 3000000,
      gasPrice: 50000000000,
    },
    arbitrum_rinkeby: {
      url: E("ALCHEMY_URL_ARBITRUM_RINKEBY"),
      accounts: {
        mnemonic: MNEMONIC,
      },
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
  gasReporter: {
    currency: "USD",
    gasPrice: 100,
    enabled: true,
  },
  mocha: {
    timeout: 120000,
  },
};


