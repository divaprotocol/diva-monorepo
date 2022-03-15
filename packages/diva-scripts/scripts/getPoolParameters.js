/**
 * Script to get the pool parameters for an existing poolId
 * To execute the script, run `yarn hardhat run scripts/getPoolParameters.js --network ropsten` (you can replace ropsten with any other network that is listed in constants.js)
 * 
 * DIVA smart contract addresses for the different networks are registered in constants.js
 */

const { ethers } = require('hardhat');
const DIVA_ABI = require('../contracts/abis/DIVA.json');
const { addresses } = require('../constants/constants')

async function main() {

    // INPUT (network)
    const network = "ropsten" // has to be one of the networks included in constants.js
    
    // INPUT (getPoolParameters arguments)
    const poolId = 158 // id of an existing pool

    // Connect to DIVA contract
    let diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
    console.log("DIVA address: ", diva.address);

    // Get pool parameters
    const poolParams = await diva.getPoolParameters(poolId)
    console.log(poolParams)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
 