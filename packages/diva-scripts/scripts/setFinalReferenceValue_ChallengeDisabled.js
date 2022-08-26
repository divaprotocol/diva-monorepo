/**
 * Script to set the final reference price for an already expired pool. Challenge is disabled by the data provider at the time of submission.
 * Run: `yarn hardhat run scripts/setFinalReferenceValue_ChallengeDisabled.js --network goerli`
  * Replace goerli with any other network that is listed in constants.js
 *
 * Note that `setFinalReferenceValue` only works for an expired pool and only within the initial 24h submission window.
 */

const { ethers } = require('hardhat');
const ERC20_ABI = require('@diva/contracts/abis/erc20.json');
const DIVA_ABI = require('@diva/contracts/abis/diamond.json');
const { parseEther, formatEther, formatUnits } = require('@ethersproject/units')
const { addresses, status } = require('../constants/constants')

async function main() {

  // INPUT: network
  const network = "goerli" // has to be one of the networks included in constants.js
  
  // INPUT: arguments for `setFinalReferenceValue` function
  const poolId = 22 // id of an existing pool
  const finalReferenceValue = parseEther("2444.8") // 18 decimals
  const allowChallenge = false // first value submitted will automatically be confirmed, no challenge possible; keep it at false in this example and use `setFinalReferenceValue_ChallengeEnabled.js` if you want to simulate a submission with a challenge 

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

  // Connect to ERC20 collateral token 
  const erc20Contract = await ethers.getContractAt(ERC20_ABI, poolParamsBefore.collateralToken)    
  const decimals = await erc20Contract.decimals();

  console.log("Final reference value after: " + formatEther(poolParamsAfter.finalReferenceValue))
  console.log("Status final reference value after: " + status[poolParamsAfter.statusFinalReferenceValue])
  console.log("Payout per long token: " + formatUnits(poolParamsAfter.redemptionAmountLongToken, decimals))
  console.log("Payout per short token: " + formatUnits(poolParamsAfter.redemptionAmountShortToken, decimals))
   
 }
 
 main()
   .then(() => process.exit(0))
   .catch((error) => {
     console.error(error);
     process.exit(1);
   });
  