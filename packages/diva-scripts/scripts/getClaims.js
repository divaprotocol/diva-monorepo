/**
 * Script to transfer fee claims
 * Run: `yarn hardhat run scripts/getClaims.js --network ropsten`
 * Replace ropsten with any other network that is listed in constants.js
 */

const { ethers } = require('hardhat');
const DIVA_ABI = require('@diva/contracts/abis/diamond.json');
const { addresses } = require('../constants/constants')


async function main() {

    // INPUT: network
    const network = "ropsten"     
    
    // INPUT: collateral token
    const collateralTokenSymbol = "WAGMI18"

    // Lookup collateral token address
    const collateralToken = addresses[network][collateralTokenSymbol];

    // Get signers
    const [acc1, acc2, acc3] = await ethers.getSigners();
    const recipient = acc2;

    // Connect to DIVA contract
    let diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
    console.log("DIVA address: ", diva.address);

    // Get fee claim amount
    fee = await diva.getClaims(collateralToken, recipient.address)
    console.log("Claiming address: " + recipient.address)
    console.log("Collateral token address: " + collateralToken)
    console.log("Fee claim amount recipient: " + fee)
    
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
 