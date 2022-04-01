/**
 * Script to set the final reference price for an already expired pool. Challenge is enabled by data provider at the time of submission.
 * Run `yarn hardhat run scripts/setFinalReferenceValue_ChallengeEnabled.js --network ropsten`
 * Replace ropsten with any other network that is listed in constants.js
 *
 * Note that `setFinalReferenceValue` only works for an expired pool and only within the initial 24h submission window.
 */

const { ethers } = require('hardhat');
const DIVA_ABI = require('../contracts/abis/DIVA.json');
const { parseEther, formatEther } = require('@ethersproject/units')
const { addresses, status } = require('../constants/constants')

async function main() {

  // INPUT: network
  const network = "ropsten" // has to be one of the networks included in constants.js
  
  // INPUT: arguments for the `setFinalReferenceValue` function
  const poolId = 5 // id of an existing pool
  const finalReferenceValue = parseEther("80") // 18 decimals
  const allowChallenge = true // first value submitted will automatically be confirmed, no challenge possible; keep it at true in this example and use `setFinalReferenceValue_ChallengeDisabled.js` if you want to simulate a submission without a challenge 

  // Set data provider account
  const [acc1, acc2, acc3] = await ethers.getSigners();
  dataProvider = acc1;
  console.log("Data provider address: " + dataProvider.address)
  
  // Connect to DIVA contract
  let diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
  console.log("DIVA address: ", diva.address);

  // Load pool parameters
  const poolParamsBefore = await diva.getPoolParameters(poolId)
  
  // Check that pool already expired
  if (poolParamsBefore.expiryTime > Math.floor(Date.now() / 1000)) {
    console.log("Pool not yet expired");
    return;
  }

  // Check that the function is called within the 24h submission period following expiration
  if (Math.floor(Date.now() / 1000) > poolParamsBefore.expiryTime.add(60*60*24)) {
    console.log("Submission period expired");
    return;
  }

  // Print pool parameters before final reference value is set
  console.log("Final reference value before: " + formatEther(poolParamsBefore.finalReferenceValue))
  console.log("Status final reference value before: " + status[poolParamsBefore.statusFinalReferenceValue])

  // Set final reference value
  let tx = await diva.connect(dataProvider).setFinalReferenceValue(poolId, finalReferenceValue, allowChallenge); 
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
  