/**
 * Script to challenge the value submitted by the data feed provider. Only works if 
 * challenge was enabled by the data feed provider at value submission and if within the challenge period (24h after submission)
 * Run: `yarn hardhat run scripts/challengeFinalReferenceValue.js --network goerli`
 * Replace goerli with any other network that is listed in constants.js
 */

const { ethers } = require('hardhat');
const DIVA_ABI = require('@diva/contracts/abis/diamond.json');
const { parseEther, formatEther } = require('@ethersproject/units')
const { addresses, status } = require('../constants/constants')

async function main() {

  // INPUT: network
  const network = "goerli" // has to be one of the networks included in constants.js
  
  // INPUT: arguments into `setFinalReferenceValue` function
  const poolId = 5 // id of an existing pool
  const proposedFinalReferenceValue = parseEther("1670") // 18 decimals

  // Get accounts
  const [acc1, acc2, acc3] = await ethers.getSigners();
  const positionTokenHolder = acc1;
  console.log("Position token holder address: " + positionTokenHolder.address)
  
  // Connect to DIVA contract
  let diva = await ethers.getContractAt(DIVA_ABI, addresses[network].divaAddress);
  console.log("DIVA address: ", diva.address);

  // Get pool parameters before submitted final reference value was challenged
  const poolParamsBefore = await diva.getPoolParameters(poolId)
  console.log("Final reference value before: " + formatEther(poolParamsBefore.finalReferenceValue))
  console.log("Status final reference value before: " + status[poolParamsBefore.statusFinalReferenceValue])

  // Set final reference value
  let tx = await diva.challengeFinalReferenceValue(poolId, proposedFinalReferenceValue); 
  await tx.wait();
  
  // Get pool parameters after submitted final reference value was challenged
  const poolParamsAfter = await diva.getPoolParameters(poolId)
  console.log("Final reference value after: " + formatEther(poolParamsAfter.finalReferenceValue)) // Value doesn't change; get proposed final reference value from TheGraph (TODO)
  console.log("Status final reference value after: " + status[poolParamsAfter.statusFinalReferenceValue])
   
 }
 
 main()
   .then(() => process.exit(0))
   .catch((error) => {
     console.error(error);
     process.exit(1);
   });
  