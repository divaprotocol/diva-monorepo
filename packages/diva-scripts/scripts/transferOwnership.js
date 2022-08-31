const { ethers } = require("hardhat");
const DIVA_ABI = require("@diva/contracts/abis/diamond.json");
const { addresses } = require("../constants/constants");

async function main() {
  
  // INPUTS: network name
  const network = "goerli" // has to be one of the networks included in constants.js
  const newOwner = "0xBb0F479895915F80f6fEb5BABcb0Ad39a0D7eF4E"

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

  // Get current owner
  console.log("Current owner: " + (await diva.owner()));

  // Transfer ownership
  const tx = await diva.connect(owner).transferOwnership(newOwner)
  await tx.wait()

  // Get new owner
  console.log("New owner: " + (await diva.owner()));
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});
