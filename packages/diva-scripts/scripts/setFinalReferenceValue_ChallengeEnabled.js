/**
 * Script to set the final reference price for an already expired pool. Challenge is enabled by data feed provider.
 * To execute the script, run `yarn hardhat run scripts/setFinalReferenceValue_ChallengeEnabled.js --network ropsten` (you can replace ropsten with any other network that is listed in constants.js)
 * 
 * IMPORTANT: 
 * 1) setFinalReferenceValue only works for an expired pool, but no longer than 24h (that's the submission period for the data feed provider)
 * 2) dataFeedProvider for that pool needs to be your second wallet account
 * 
 * DIVA smart contract addresses for the different networks are registered in constants.js
 */

const { ethers } = require('hardhat');
const DIVA_ABI = require('../contracts/abis/DIVA.json');
const { parseEther, formatEther } = require('@ethersproject/units')
const { addresses, status } = require('../constants/constants')

async function main() {

  // INPUT (network)
  const network = "ropsten" // has to be one of the networks included in constants.js
  
  // INPUT (setFinalReferenceValue arguments)
  const poolId = 2 // id of an existing pool
  const finalReferenceValue = parseEther("80") // 18 decimals
  const allowChallenge = true // Do not change in this script; final reference value submissions by data feed provider are challengeable

  // Get accounts (dataFeedProvider is account 2 in your wallet)
  const [user1, dataFeedProvider] = await ethers.getSigners();
  console.log("Data feed provider address: " + dataFeedProvider.address)
  
  // Connect to DIVA contract
  let diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
  console.log("DIVA address: ", diva.address);

  // Check that pool already expired
  const poolParamsBefore = await diva.getPoolParameters(poolId)
  if (poolParamsBefore.expiryDate > Math.floor(Date.now() / 1000)) {
    console.log("Pool not yet expired");
    return;
  }

  // Print pool parameters before final reference value was set
  console.log("Final reference value before: " + formatEther(poolParamsBefore.finalReferenceValue))
  console.log("Status final reference value before: " + status[poolParamsBefore.statusFinalReferenceValue])

  // Set final reference value
  let tx = await diva.connect(dataFeedProvider).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge); 
  await tx.wait();
  
  // Get pool parameters after final reference value was set
  const poolParamsAfter = await diva.getPoolParameters(poolId)
  console.log("Final reference value after: " + formatEther(poolParamsAfter.finalReferenceValue))
  console.log("Status final reference value after: " + status[poolParamsAfter.statusFinalReferenceValue])
   
 }
 
 main()
   .then(() => process.exit(0))
   .catch((error) => {
     console.error(error);
     process.exit(1);
   });
  