/**
 * Script to transfer fee claims
 * Run: `yarn hardhat run scripts/transferFeeClaim.js --network goerli`
 * Replace goerli with any other network that is listed in constants.js
 */

const { ethers } = require('hardhat');
const DIVA_ABI = require('@diva/contracts/abis/diamond.json');
const { addresses } = require('../constants/constants')


async function main() {

    // INPUT: network
    const network = "goerli"     
    
    // INPUT: collateral token
    const collateralTokenSymbol = "dUSD"

    // Lookup collateral token address
    const collateralToken = addresses[network][collateralTokenSymbol];

    // Get signers
    const [acc1, acc2, acc3] = await ethers.getSigners();
    const currentFeeRecipient = acc1;
    const newFeeRecipient = acc3;

    // Connect to DIVA contract
    let diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
    console.log("DIVA address: ", diva.address);

    // Get fee claim amount
    feeCurrentFeeRecipient = await diva.getClaims(collateralToken, currentFeeRecipient.address)
    feeNewFeeRecipient = await diva.getClaims(collateralToken, newFeeRecipient.address)
    console.log("Fee current fee recipient before: " + feeCurrentFeeRecipient)
    console.log("Fee new fee recipient before: " + feeNewFeeRecipient)

    // Transfer entire fee claim
    tx = await diva.connect(currentFeeRecipient).transferFeeClaim(newFeeRecipient.address, collateralToken, feeCurrentFeeRecipient)
    await tx.wait() 

    // Get fee claim amount
    feeCurrentFeeRecipient = await diva.getClaims(collateralToken, currentFeeRecipient.address)
    feeNewFeeRecipient = await diva.getClaims(collateralToken, newFeeRecipient.address)
    console.log("Fee current fee recipient after: " + feeCurrentFeeRecipient)
    console.log("Fee new fee recipient after: " + feeNewFeeRecipient)
    
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
 