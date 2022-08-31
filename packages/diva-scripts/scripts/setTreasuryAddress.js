const { ethers } = require("hardhat");
const DIVA_ABI = require("@diva/contracts/abis/diamond.json");
const { addresses } = require("../constants/constants");

async function main() {
  
  // INPUTS: network name
  const network = "goerli" // has to be one of the networks included in constants.js
  const newTreasuryAddress = "0x47566C6c8f70E4F16Aa3E7D8eED4a2bDb3f4925b"

  // Get signers
  const [acc1, acc2, acc3] = await ethers.getSigners();
  const owner = acc3;
  console.log('contract owner address: ', owner.address)

  // Connect to DIVA contract
  let diva = await ethers.getContractAt(
    DIVA_ABI,
    addresses[network].divaAddress
  );
  console.log("DIVA address: ", diva.address);

  // Get current treasury address
  console.log("Current treasury address: " + (await diva.getGovernanceParameters()).treasury);

  // Set new treasury address
  const tx = await diva.connect(owner).setTreasuryAddress(newTreasuryAddress)
  await tx.wait()

  // Get new treasury address
  console.log("New treasury address: " + (await diva.getGovernanceParameters()).treasury);
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});
