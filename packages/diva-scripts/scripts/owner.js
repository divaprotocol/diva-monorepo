const { ethers } = require("hardhat");
const DIVA_ABI = require("@diva/contracts/abis/diamond.json");
const { addresses } = require("../constants/constants");

async function main() {
  
  // INPUTS: network name
  const network = "goerli" // has to be one of the networks included in constants.js

  // Connect to DIVA contract
  let diva = await ethers.getContractAt(
    DIVA_ABI,
    addresses[network].divaAddress
  );
  console.log("DIVA address: ", diva.address);

  // Get current owner
  console.log("Current owner: " + (await diva.owner()));
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
});
