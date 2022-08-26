/**
 * Script to get the pool parameters for an existing poolId
 * Run: `yarn hardhat run scripts/getGovernanceParameters.js --network goerli`
 * Replace goerli with any other network that is listed in constants.js
 */

const { ethers } = require('hardhat');
const DIVA_ABI = require('@diva/contracts/abis/diamond.json');
const { addresses } = require('../constants/constants')


async function main() {

    // INPUT: network (check constants.js for available values), id of an existing pool 
    const network = "goerli"     
    
    // Connect to DIVA contract
    let diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
    console.log("DIVA address: ", diva.address);

    // Get governance parameters
    const govParams = await diva.getGovernanceParameters()
    console.log(govParams)

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
 