/**
 * Script to get the pool parameters for an existing poolId
 * Run: `yarn hardhat run scripts/getPoolParameters.js --network ropsten`
 * Replace ropsten with any other network that is listed in constants.js
 */

const { ethers } = require('hardhat');
const DIVA_ABI = require('@diva/contracts/abis/diamond.json');
const { addresses } = require('../constants/constants')


async function main() {

    // INPUT: network (check constants.js for available values), id of an existing pool 
    const network = "ropsten"     
    
    // INPUT: id of existing pool
    const poolId = 17

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
 