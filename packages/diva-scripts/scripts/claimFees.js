/**
 * Script to transfer fee claims
 * Run: `yarn hardhat run scripts/getClaims.js --network goerli`
 * Replace goerli with any other network that is listed in constants.js
 */

const { ethers } = require('hardhat');
const ERC20_ABI = require('@diva/contracts/abis/erc20.json');
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
    const recipient = acc1;

    // Connect to collateral token
    let collateralTokenInstance = await ethers.getContractAt(ERC20_ABI, collateralToken);

    // Connect to DIVA contract
    let diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
    console.log("DIVA address: ", diva.address);

    console.log("Balance before: " + await collateralTokenInstance.balanceOf(recipient.address))

    // Get fee claim amount
    const tx = await diva.connect(recipient).claimFees(collateralToken);
    await tx.wait();

    console.log("Balance after: " + await collateralTokenInstance.balanceOf(recipient.address))

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
 